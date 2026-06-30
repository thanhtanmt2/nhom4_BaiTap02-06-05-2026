/**
 * gemini.service.js
 * Gọi Google Gemini API để phân tích CV và chấm điểm phù hợp
 */
require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

const API_KEY = process.env.GEMINI_API_KEY?.trim();

// ── Helper: Tạo prompt phân tích CV ────────────────────────
function buildPrompt(cvText, position, skills = []) {
  const skillsHint = skills.length > 0 ? `Kỹ năng kỳ vọng: ${skills.join(', ')}.` : '';
  return `
Bạn là chuyên gia tuyển dụng HR với 10+ năm kinh nghiệm. Hãy phân tích CV sau và đánh giá mức độ phù hợp cho vị trí "${position}".
${skillsHint}

=== NỘI DUNG CV ===
${cvText.slice(0, 8000)}
=== KẾT THÚC CV ===

Hãy trả về JSON với định dạng CHÍNH XÁC sau (không thêm markdown hay text nào khác):
{
  "match_score": <số thực từ 1.0 đến 5.0, ví dụ 3.5>,
  "extracted_skills": ["skill1", "skill2", "skill3"],
  "summary": "<tóm tắt ngắn 1-2 câu về ứng viên bằng tiếng Việt>",
  "reasoning": "<giải thích chi tiết tại sao cho điểm này, 2-4 câu tiếng Việt, nêu điểm mạnh và điểm yếu>"
}

Tiêu chí chấm điểm (match_score 1-5):
- 4.5-5.0: Ứng viên xuất sắc, phù hợp cao
- 3.5-4.4: Phù hợp tốt, có thể xem xét ngay
- 2.5-3.4: Phù hợp một phần, cần đánh giá thêm
- 1.0-2.4: Không phù hợp hoặc thiếu thông tin
`;
}

// ── Phân tích CV bằng Gemini ────────────────────────────────
async function analyzeCV(cvText, position, skills = []) {
  if (!cvText || cvText.trim().length < 50) {
    return {
      match_score: 1.0,
      extracted_skills: [],
      summary: 'CV không có nội dung hoặc quá ngắn để phân tích.',
      reasoning: 'Không thể phân tích vì CV không có đủ nội dung.',
    };
  }

  // Nếu không có API key → trả mock data
  if (!API_KEY) {
    console.warn('[Gemini] GEMINI_API_KEY không được cấu hình — dùng mock data');
    return getMockResult(position);
  }

  try {
    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = buildPrompt(cvText, position, skills);
    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();

    // Parse JSON từ response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Gemini không trả về JSON hợp lệ');

    const parsed = JSON.parse(jsonMatch[0]);

    return {
      match_score: Math.min(5.0, Math.max(1.0, Number(parsed.match_score) || 3.0)),
      extracted_skills: Array.isArray(parsed.extracted_skills) ? parsed.extracted_skills.slice(0, 15) : [],
      summary: parsed.summary || 'Không có tóm tắt.',
      reasoning: parsed.reasoning || 'Không có giải thích.',
    };
  } catch (err) {
    console.error('[Gemini] Lỗi khi gọi API:', err.message);
    // Fallback: trả điểm trung bình + thông báo lỗi
    return {
      match_score: 3.0,
      extracted_skills: [],
      summary: 'Đã xảy ra lỗi khi phân tích CV bằng AI.',
      reasoning: `Lỗi khi gọi Gemini API: ${err.message}. Vui lòng thử lại.`,
    };
  }
}

// ── Mock data (demo khi không có API key) ──────────────────
function getMockResult(position) {
  const mockScores = [3.5, 4.2, 3.0, 4.5, 2.5, 3.8];
  const score = mockScores[Math.floor(Math.random() * mockScores.length)];
  return {
    match_score: score,
    extracted_skills: ['JavaScript', 'React', 'Node.js', 'SQL'],
    summary: `[MOCK] Ứng viên có nền tảng kỹ thuật phù hợp cho vị trí ${position}.`,
    reasoning: `[MOCK] Điểm ${score}/5. Ứng viên có các kỹ năng cơ bản phù hợp. Đây là dữ liệu demo — cấu hình GEMINI_API_KEY để có phân tích thật.`,
  };
}

module.exports = { analyzeCV };
