const { Op } = require('sequelize');
const path = require('path');
const fs = require('fs');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const { Candidate } = require('../entities');
const { logActivity } = require('../utils/activityLogger');
const { analyzeCV: analyzeWithGemini } = require('../services/gemini.service');

// ── helpers ─────────────────────────────────────────────
const VALID_STAGES = ['new', 'screening', 'iv1', 'iv2', 'offer', 'hired', 'rejected'];

// ── GET /api/recruitment/candidates ─────────────────────
// Trả về tất cả ứng viên, nhóm theo stage (cho Kanban)
const getCandidates = async (req, res) => {
  try {
    const { stage, search, position } = req.query;

    const where = {};
    if (stage) where.stage = stage;
    if (position) where.position = { [Op.like]: `%${position}%` };
    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
        { position: { [Op.like]: `%${search}%` } },
      ];
    }

    const candidates = await Candidate.findAll({
      where,
      order: [['created_at', 'DESC']],
    });

    // Nhóm theo stage cho Kanban board
    const board = {};
    VALID_STAGES.forEach((s) => { board[s] = []; });
    candidates.forEach((c) => {
      if (board[c.stage] !== undefined) board[c.stage].push(c);
    });

    return res.status(200).json({ success: true, data: board, total: candidates.length });
  } catch (err) {
    console.error('getCandidates error:', err);
    return res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

// ── GET /api/recruitment/candidates/:id ─────────────────
const getCandidateById = async (req, res) => {
  try {
    const candidate = await Candidate.findByPk(req.params.id);
    if (!candidate) return res.status(404).json({ success: false, message: 'Không tìm thấy ứng viên' });
    return res.status(200).json({ success: true, data: candidate });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

// ── POST /api/recruitment/candidates ────────────────────
const createCandidate = async (req, res) => {
  try {
    const { name, email, phone, position, skills, experience_years, expected_salary, source, current_company, note } = req.body;

    if (!name || !position) {
      return res.status(400).json({ success: false, message: 'Họ tên và Vị trí ứng tuyển là bắt buộc' });
    }

    // Kiểm tra email trùng
    if (email) {
      const exists = await Candidate.findOne({ where: { email } });
      if (exists) return res.status(409).json({ success: false, message: 'Email ứng viên đã tồn tại trong hệ thống' });
    }

    const candidate = await Candidate.create({
      name: name.trim(),
      email: email?.trim().toLowerCase() || null,
      phone: phone?.trim() || null,
      position: position.trim(),
      skills: skills || [],
      experience_years: experience_years || 0,
      expected_salary: expected_salary || null,
      source: source || 'Other',
      current_company: current_company?.trim() || null,
      note: note?.trim() || null,
      stage: 'new',
      created_by: req.user?.id || null,
    });

    await logActivity({ userId: req.user?.id, action: 'create_candidate', detail: `Thêm ứng viên ${candidate.name} - ${candidate.position}`, req });

    return res.status(201).json({ success: true, message: 'Thêm ứng viên thành công', data: candidate });
  } catch (err) {
    console.error('createCandidate error:', err);
    return res.status(500).json({ success: false, message: 'Lỗi server khi tạo ứng viên' });
  }
};

// ── PUT /api/recruitment/candidates/:id/stage ───────────
// Di chuyển ứng viên sang stage khác (Kanban drag-drop)
const moveStage = async (req, res) => {
  try {
    const { stage } = req.body;
    if (!VALID_STAGES.includes(stage)) {
      return res.status(400).json({ success: false, message: 'Stage không hợp lệ' });
    }

    const candidate = await Candidate.findByPk(req.params.id);
    if (!candidate) return res.status(404).json({ success: false, message: 'Không tìm thấy ứng viên' });

    const oldStage = candidate.stage;
    await candidate.update({ stage, updated_at: new Date() });

    await logActivity({ userId: req.user?.id, action: 'move_candidate_stage', detail: `${candidate.name}: ${oldStage} → ${stage}`, req });

    return res.status(200).json({ success: true, message: 'Cập nhật stage thành công', data: candidate });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

// ── PUT /api/recruitment/candidates/:id ─────────────────
const updateCandidate = async (req, res) => {
  try {
    const candidate = await Candidate.findByPk(req.params.id);
    if (!candidate) return res.status(404).json({ success: false, message: 'Không tìm thấy ứng viên' });

    const allowed = ['name', 'email', 'phone', 'position', 'skills', 'experience_years', 'expected_salary', 'source', 'current_company', 'note', 'match_score', 'ai_summary', 'ai_reasoning', 'cv_file_path', 'onboard_date', 'interview_date', 'interview_link', 'interviewer', 'interview_note'];
    const updates = {};
    allowed.forEach((f) => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });
    updates.updated_at = new Date();

    // Kiểm tra trùng lịch phỏng vấn
    const finalInterviewDate = updates.interview_date !== undefined ? updates.interview_date : candidate.interview_date;
    const finalInterviewer = updates.interviewer !== undefined ? updates.interviewer : candidate.interviewer;

    if (finalInterviewDate && finalInterviewer) {
      const conflict = await Candidate.findOne({
        where: {
          id: { [Op.ne]: candidate.id },
          interview_date: new Date(finalInterviewDate),
          interviewer: finalInterviewer
        }
      });
      if (conflict) {
        return res.status(400).json({
          success: false,
          message: `Trùng lịch phỏng vấn! Người phỏng vấn "${finalInterviewer}" đã có lịch hẹn với ứng viên "${conflict.name}" vào thời gian này.`
        });
      }
    }

    await candidate.update(updates);
    return res.status(200).json({ success: true, message: 'Cập nhật thành công', data: candidate });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

// ── DELETE /api/recruitment/candidates/:id ──────────────
const deleteCandidate = async (req, res) => {
  try {
    const candidate = await Candidate.findByPk(req.params.id);
    if (!candidate) return res.status(404).json({ success: false, message: 'Không tìm thấy ứng viên' });

    await logActivity({ userId: req.user?.id, action: 'delete_candidate', detail: `Xoá ứng viên ${candidate.name}`, req });
    await candidate.destroy();

    return res.status(200).json({ success: true, message: 'Đã xoá ứng viên' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

// ── POST /api/recruitment/candidates/:id/analyze-cv ───────────────
const analyzeCV = async (req, res) => {
  let filePath = null;
  try {
    const candidate = await Candidate.findByPk(req.params.id);
    if (!candidate) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy ứng viên' });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Vui lòng upload file CV (PDF/DOCX)' });
    }

    filePath = req.file.path;
    const ext = path.extname(req.file.originalname).toLowerCase();
    let cvText = '';

    // Trích xuất text từ file
    if (ext === '.pdf') {
      const dataBuffer = fs.readFileSync(filePath);
      const pdfData = await pdfParse(dataBuffer);
      cvText = pdfData.text;
    } else if (ext === '.doc' || ext === '.docx') {
      const result = await mammoth.extractRawText({ path: filePath });
      cvText = result.value;
    } else {
      return res.status(400).json({ success: false, message: 'Chỉ hỗ trợ file PDF, DOC, DOCX' });
    }

    if (!cvText || cvText.trim().length < 30) {
      return res.status(400).json({ success: false, message: 'Không thể đọc nội dung từ file CV này. Vui lòng kiểm tra file.' });
    }

    // Gọi Gemini AI phân tích
    const currentSkills = Array.isArray(candidate.skills) ? candidate.skills : [];
    const aiResult = await analyzeWithGemini(cvText, candidate.position, currentSkills);

    // Cập nhật vào database
    const cvRelativePath = `/uploads/cv/${req.file.filename}`;
    await candidate.update({
      match_score: aiResult.match_score,
      ai_summary: aiResult.summary,
      ai_reasoning: aiResult.reasoning,
      cv_file_path: cvRelativePath,
      // Merge skills từ AI vào skills hiện tại (loại trùng)
      skills: [...new Set([...currentSkills, ...aiResult.extracted_skills])],
      updated_at: new Date(),
    });

    await logActivity({
      userId: req.user?.id,
      action: 'analyze_cv',
      detail: `Phân tích CV ${candidate.name} — Match Score: ${aiResult.match_score.toFixed(1)}/5`,
      req,
    });

    return res.status(200).json({
      success: true,
      message: 'Phân tích CV thành công!',
      data: {
        match_score: aiResult.match_score,
        summary: aiResult.summary,
        reasoning: aiResult.reasoning,
        extracted_skills: aiResult.extracted_skills,
        cv_file_path: cvRelativePath,
      },
    });
  } catch (err) {
    console.error('analyzeCV error:', err);
    return res.status(500).json({ success: false, message: `Lỗi phân tích CV: ${err.message}` });
  }
};

// ── GET /api/recruitment/stats ──────────────────────────
const getStats = async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [total, hired, offer, newThisMonth] = await Promise.all([
      Candidate.count({ where: { stage: { [Op.notIn]: ['rejected'] } } }),
      Candidate.count({ where: { stage: 'hired' } }),
      Candidate.count({ where: { stage: 'offer' } }),
      Candidate.count({ where: { created_at: { [Op.gte]: startOfMonth }, stage: { [Op.notIn]: ['rejected'] } } }),
    ]);

    const conversionRate = total > 0 ? ((hired / total) * 100).toFixed(1) : '0.0';
    const offerAcceptRate = offer + hired > 0 ? ((hired / (offer + hired)) * 100).toFixed(0) : '0';

    return res.status(200).json({
      success: true,
      data: { total, hired, offer, newThisMonth, conversionRate, offerAcceptRate },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

// ── GET /api/recruitment/positions ──────────────────────
// Trả về danh sách vị trí đang tuyển (distinct)
const getPositions = async (req, res) => {
  try {
    const rows = await Candidate.findAll({
      attributes: ['position'],
      group: ['position'],
      where: { stage: { [Op.notIn]: ['hired', 'rejected'] } },
    });
    const positions = rows.map((r) => r.position);
    return res.status(200).json({ success: true, data: positions });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

module.exports = { getCandidates, getCandidateById, createCandidate, moveStage, updateCandidate, deleteCandidate, getStats, getPositions, analyzeCV };
