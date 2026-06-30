/* ═══════════════════════════════════════════════════════════
   RecruitmentPage — Kanban tuyển dụng
   Dùng dữ liệu thật từ API /api/recruitment/*
   ═══════════════════════════════════════════════════════════ */
import { useState, useEffect, useRef, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { recruitmentService } from '../../services/recruitment.service';
import './RecruitmentPage.css';

/* ── Constants ───────────────────────────────────────────── */
const STAGES = [
  { id: 'new',       title: 'Mới nộp',           cls: 'stage-new',       subtitle: 'Avg 1–2 ngày' },
  { id: 'screening', title: 'Sàng lọc CV',        cls: 'stage-screening', subtitle: 'Avg 2 ngày' },
  { id: 'iv1',       title: 'PV vòng 1',          cls: 'stage-iv1',       subtitle: 'Avg 3 ngày' },
  { id: 'iv2',       title: 'PV vòng 2 / Test',   cls: 'stage-iv2',       subtitle: 'Avg 4 ngày' },
  { id: 'offer',     title: 'Offer',              cls: 'stage-offer',     subtitle: 'Hạn 7 ngày' },
  { id: 'hired',     title: 'Đã tuyển',           cls: 'stage-hired',     subtitle: 'Trong tháng' },
  { id: 'rejected',  title: 'Bị loại',            cls: 'stage-rejected',  subtitle: 'Lưu trữ CV' },
];

function formatDateTimeLocal(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  const yyyy = d.getFullYear();
  const mm = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  const hh = pad(d.getHours());
  const min = pad(d.getMinutes());
  return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
}

const EMPTY_FORM = {
  name: '', email: '', phone: '', position: '',
  skills: '', experience_years: '', expected_salary: '',
  source: 'Other', current_company: '', note: '',
};

/* ── Avatar ─────────────────────────────────────────────── */
const AVATAR_COLORS = ['#1E3A6B','#0891B2','#7C3AED','#0D9488','#BE185D','#A16207'];
function hashColor(name) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}
function initials(name) {
  return name.trim().split(/\s+/).slice(0, 2).map((p) => p[0].toUpperCase()).join('');
}
function Avatar({ name, size = 28 }) {
  return (
    <span
      className="rc-avatar"
      style={{ width: size, height: size, fontSize: size * 0.38, background: hashColor(name) }}
    >
      {initials(name)}
    </span>
  );
}

/* ── Score color (thang 1-5) ───────────────────────────── */
function scoreColor(s) {
  if (s >= 4.0) return 'var(--rc-success)';
  if (s >= 3.0) return 'var(--rc-success-soft)';
  if (s >= 2.0) return 'var(--rc-warning)';
  return 'var(--rc-gray-500)';
}
function scoreBg(s) {
  if (s >= 4.0) return '#dcfce7';
  if (s >= 3.0) return '#d1fae5';
  if (s >= 2.0) return '#fef9c3';
  return '#f3f4f6';
}

/* ── Time display ─────────────────────────────────────────── */
function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = (Date.now() - new Date(dateStr)) / 1000;
  if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h trước`;
  if (diff < 172800) return 'hôm qua';
  if (diff < 604800) return `${Math.floor(diff / 86400)} ngày trước`;
  return new Date(dateStr).toLocaleDateString('vi-VN');
}

/* ── Icons ───────────────────────────────────────────────── */
const Icon = ({ d, size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {(Array.isArray(d) ? d : [d]).map((p, i) => <path key={i} d={p} />)}
  </svg>
);
const Icons = {
  Plus:    <Icon d="M12 5v14M5 12h14" />,
  Filter:  <Icon d="M22 3H2l8 9.46V19l4 2v-8.54L22 3" />,
  X:       (s = 16) => <Icon size={s} d="M18 6L6 18M6 6l12 12" />,
  Star:    (s = 10) => <Icon size={s} d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />,
  Cal:     (s = 11) => <Icon size={s} d={["M3 4h18v18H3z","M16 2v4M8 2v4","M3 10h18"]} />,
  Refresh: <Icon d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />,
  Trash:   <Icon d={["M3 6h18","M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6","M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2"]} />,
  More:    <Icon d="M5 12a1 1 0 100 2 1 1 0 000-2zM12 12a1 1 0 100 2 1 1 0 000-2z" />,
  User:    <Icon d={["M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2", "M12 11a4 4 0 100-8 4 4 0 000 8z", "M16 11v1M19 8v6M22 11h-6"]} />,
  AI:      <Icon size={14} d={["M12 2a2 2 0 012 2v2a2 2 0 01-2 2 2 2 0 01-2-2V4a2 2 0 012-2z","M12 16a2 2 0 012 2v2a2 2 0 01-2 2 2 2 0 01-2-2v-2a2 2 0 012-2z","M2 12a2 2 0 012-2h2a2 2 0 012 2 2 2 0 01-2 2H4a2 2 0 01-2-2z","M16 12a2 2 0 012-2h2a2 2 0 012 2 2 2 0 01-2 2h-2a2 2 0 01-2-2z","M5.6 5.6l1.4 1.4M16.9 16.9l1.5 1.5M5.6 18.4l1.5-1.5M16.9 7.1l1.4-1.5"]} />,
};

/* ── Toast ───────────────────────────────────────────────── */
function useToast() {
  const [toasts, setToasts] = useState([]);
  const tid = useRef(0);
  const push = useCallback((type, msg) => {
    const id = ++tid.current;
    setToasts((t) => [...t, { id, type, msg }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500);
  }, []);
  return { toasts, push };
}
function ToastList({ toasts }) {
  return (
    <div className="rc-toasts">
      {toasts.map((t) => (
        <div key={t.id} className={`rc-toast rc-toast--${t.type}`}>
          <span className="rc-toast-dot" />
          <span>{t.msg}</span>
        </div>
      ))}
    </div>
  );
}

/* ── Candidate Card ──────────────────────────────────────── */
function CandidateCard({ candidate: c, dragging, selected, onSelect, onDragStart, onDragEnd, onDelete, onAnalyze }) {
  const skills = Array.isArray(c.skills) ? c.skills : [];
  const visible = skills.slice(0, 3);
  const overflow = skills.length - 3;
  const hasScore = c.match_score !== null && c.match_score !== undefined;

  return (
    <div
      draggable
      className={`rc-card${dragging ? ' rc-card--dragging' : ''}${selected ? ' rc-card--selected' : ''}`}
      onDragStart={(e) => { e.dataTransfer.effectAllowed = 'move'; onDragStart(); }}
      onDragEnd={onDragEnd}
      onClick={onSelect}
    >
      <div className="rc-card__row1">
        <Avatar name={c.name} size={28} />
        <p className="rc-card__name">{c.name}</p>
        <button
          className="rc-card__del"
          title="Xoá ứng viên"
          onClick={(e) => { e.stopPropagation(); onDelete(c); }}
        >
          {Icons.X(12)}
        </button>
      </div>

      <p className="rc-card__pos">{c.position}</p>

      {visible.length > 0 && (
        <div className="rc-card__skills">
          {visible.map((s) => <span key={s} className="rc-skill">{s}</span>)}
          {overflow > 0 && <span className="rc-skill rc-skill--more">+{overflow}</span>}
        </div>
      )}

      {/* AI Score Badge */}
      {hasScore ? (
        <div className="rc-ai-badge" style={{ background: scoreBg(c.match_score), borderColor: scoreColor(c.match_score) }} title={c.ai_reasoning || ''}>
          <span style={{ color: scoreColor(c.match_score), fontWeight: 700 }}>🤖 {Number(c.match_score).toFixed(1)}/5</span>
          {c.ai_summary && <span className="rc-ai-summary">{c.ai_summary}</span>}
        </div>
      ) : (
        <button
          className="rc-ai-btn"
          title="Phân tích CV bằng AI"
          onClick={(e) => { e.stopPropagation(); onAnalyze(c); }}
        >
          🤖 Phân tích CV
        </button>
      )}

      <div className="rc-card__foot">
        <span className="rc-card__time">{Icons.Cal()} {timeAgo(c.created_at)}</span>
        {hasScore && (
          <button
            className="rc-reanalyze-btn"
            title="Phân tích lại CV"
            onClick={(e) => { e.stopPropagation(); onAnalyze(c); }}
          >
            ↺ Phân tích lại
          </button>
        )}
      </div>
    </div>
  );
}

/* ── AI CV Modal ─────────────────────────────────────────── */
function AICVModal({ candidate, onClose, onSuccess }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef(null);

  const handleFile = (f) => {
    if (!f) return;
    const ext = f.name.split('.').pop().toLowerCase();
    if (!['pdf','doc','docx'].includes(ext)) {
      setError('Chỉ chấp nhận file PDF, DOC, DOCX'); return;
    }
    if (f.size > 5 * 1024 * 1024) {
      setError('File quá lớn (tối đa 5MB)'); return;
    }
    setFile(f); setError('');
  };

  const handleDrop = (e) => {
    e.preventDefault(); setDragOver(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const submit = async () => {
    if (!file) { setError('Vui lòng chọn file CV'); return; }
    setLoading(true); setError('');
    try {
      const res = await recruitmentService.analyzeCV(candidate.id, file);
      setResult(res.data);
      onSuccess();
    } catch (e) {
      setError(e.response?.data?.message || 'Lỗi khi phân tích CV');
    } finally {
      setLoading(false);
    }
  };

  const scoreNum = result?.match_score ?? 0;

  return (
    <div className="rc-modal-bg" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="rc-modal" style={{ maxWidth: 520 }}>
        <div className="rc-modal__header">
          <div>
            <h2 className="rc-modal__title">🤖 Phân tích CV bằng AI</h2>
            <p className="rc-modal__sub">{candidate.name} — {candidate.position}</p>
          </div>
          <button className="rc-modal__close" onClick={onClose}>{Icons.X()}</button>
        </div>

        <div className="rc-modal__body">
          {error && <div className="rc-error-banner">{error}</div>}

          {!result ? (
            <>
              {/* Drop zone */}
              <div
                className={`rc-dropzone${dragOver ? ' rc-dropzone--over' : ''}${file ? ' rc-dropzone--has-file' : ''}`}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => inputRef.current?.click()}
              >
                <input ref={inputRef} type="file" accept=".pdf,.doc,.docx" style={{ display: 'none' }}
                  onChange={(e) => handleFile(e.target.files[0])} />
                {file ? (
                  <>
                    <div className="rc-dropzone__icon">📄</div>
                    <p className="rc-dropzone__name">{file.name}</p>
                    <p className="rc-dropzone__size">{(file.size / 1024).toFixed(0)} KB</p>
                  </>
                ) : (
                  <>
                    <div className="rc-dropzone__icon">📂</div>
                    <p className="rc-dropzone__text">Kéo thả file CV vào đây</p>
                    <p className="rc-dropzone__hint">hoặc click để chọn file · PDF, DOC, DOCX · tối đa 5MB</p>
                  </>
                )}
              </div>

              <div className="rc-ai-info">
                <span>✨</span>
                <span>AI sẽ đọc CV, trích xuất kỹ năng và chấm điểm phù hợp với vị trí <strong>{candidate.position}</strong></span>
              </div>
            </>
          ) : (
            /* Kết quả AI */
            <div className="rc-ai-result">
              <div className="rc-score-circle" style={{ '--score-color': scoreColor(scoreNum) }}>
                <svg viewBox="0 0 100 100" className="rc-score-svg">
                  <circle cx="50" cy="50" r="40" fill="none" stroke="#e5e7eb" strokeWidth="10" />
                  <circle cx="50" cy="50" r="40" fill="none" stroke={scoreColor(scoreNum)} strokeWidth="10"
                    strokeDasharray={`${2 * Math.PI * 40}`}
                    strokeDashoffset={`${2 * Math.PI * 40 * (1 - scoreNum / 5)}`}
                    strokeLinecap="round"
                    transform="rotate(-90 50 50)" />
                </svg>
                <div className="rc-score-text">
                  <span className="rc-score-num" style={{ color: scoreColor(scoreNum) }}>{Number(scoreNum).toFixed(1)}</span>
                  <span className="rc-score-unit">/5.0</span>
                </div>
              </div>

              <div className="rc-ai-sections">
                <div className="rc-ai-section">
                  <p className="rc-ai-label">📝 Tóm tắt ứng viên</p>
                  <p className="rc-ai-text">{result.summary}</p>
                </div>
                <div className="rc-ai-section">
                  <p className="rc-ai-label">💡 Lý giải điểm số</p>
                  <p className="rc-ai-text">{result.reasoning}</p>
                </div>
                {result.extracted_skills?.length > 0 && (
                  <div className="rc-ai-section">
                    <p className="rc-ai-label">🔧 Kỹ năng phát hiện</p>
                    <div className="rc-card__skills" style={{ marginTop: 6 }}>
                      {result.extracted_skills.map((s) => <span key={s} className="rc-skill">{s}</span>)}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="rc-modal__footer">
          <button className="rc-btn rc-btn--ghost" onClick={onClose}>
            {result ? 'Đóng' : 'Huỷ'}
          </button>
          {!result && (
            <button className="rc-btn rc-btn--primary" onClick={submit} disabled={loading || !file}
              style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}>
              {loading ? (
                <><span className="rc-btn-spinner" /> Đang phân tích...</>
              ) : (
                '🤖 Phân tích ngay'
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Kanban Column ───────────────────────────────────────── */
function KanbanColumn({ stage, candidates, draggingId, selectedId, dropTarget, onCardSelect, onDragStart, onDragEnd, onDragOver, onDragLeave, onDrop, onAddClick, onDelete, onAnalyze }) {
  const isTarget = dropTarget === stage.id;
  return (
    <div
      className={`rc-col ${stage.cls}${isTarget ? ' rc-col--drop' : ''}`}
      onDragOver={(e) => { e.preventDefault(); onDragOver(); }}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      <div className="rc-col__header">
        <div className="rc-col__header-top">
          <div className="rc-col__title">
            <span>{stage.title}</span>
            <span className="rc-col__count">{candidates.length}</span>
          </div>
          <button className="rc-col__add" title={`Thêm vào ${stage.title}`} onClick={onAddClick}>
            {Icons.Plus}
          </button>
        </div>
        <p className="rc-col__subtitle">{stage.subtitle}</p>
      </div>

      <div className="rc-col__body">
        {candidates.length === 0
          ? <p className="rc-col__empty">Chưa có ứng viên</p>
          : candidates.map((c) => (
            <CandidateCard
              key={c.id}
              candidate={c}
              dragging={draggingId === c.id}
              selected={selectedId === c.id}
              onSelect={() => onCardSelect(c.id)}
              onDragStart={() => onDragStart(c.id, stage.id)}
              onDragEnd={onDragEnd}
              onDelete={onDelete}
              onAnalyze={onAnalyze}
            />
          ))
        }
      </div>
    </div>
  );
}

/* ── Stats Bar ───────────────────────────────────────────── */
function StatsBar({ stats, total }) {
  const items = [
    { label: 'TỔNG ỨNG VIÊN',           value: total ?? '—' },
    { label: 'MỚI THÁNG NÀY',           value: stats?.newThisMonth ?? '—' },
    { label: 'CONVERSION CV → OFFER',   value: stats ? `${stats.conversionRate}%` : '—', note: 'CV → tuyển' },
    { label: 'OFFER CHẤP NHẬN',         value: stats ? `${stats.offerAcceptRate}%` : '—' },
  ];
  return (
    <div className="rc-stats">
      {items.map((it) => (
        <div key={it.label} className="rc-stat">
          <p className="rc-stat__label">{it.label}</p>
          <p className="rc-stat__value">{it.value}</p>
          {it.note && <p className="rc-stat__note">{it.note}</p>}
        </div>
      ))}
    </div>
  );
}

/* ── FormField ── (module-level để tránh re-mount khi re-render) ── */
function FormField({ label, req, children }) {
  return (
    <div className="rc-form-grp">
      <label className="rc-lbl">{label}{req && <span className="rc-lbl-req">*</span>}</label>
      {children}
    </div>
  );
}

/* ── Add Candidate Modal ─────────────────────────────────── */
function AddCandidateModal({ positions, onClose, onSuccess }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async () => {
    if (!form.name.trim() || !form.position.trim()) {
      setError('Họ tên và Vị trí là bắt buộc.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const skillArr = form.skills ? form.skills.split(',').map((s) => s.trim()).filter(Boolean) : [];
      await recruitmentService.createCandidate({
        ...form,
        skills: skillArr,
        experience_years: form.experience_years ? Number(form.experience_years) : 0,
        expected_salary: form.expected_salary ? Number(form.expected_salary) : null,
      });
      onSuccess();
      onClose();
    } catch (e) {
      setError(e.response?.data?.message || 'Lỗi khi thêm ứng viên');
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="rc-modal-bg" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="rc-modal">
        <div className="rc-modal__header">
          <div>
            <h2 className="rc-modal__title">Thêm ứng viên mới</h2>
            <p className="rc-modal__sub">Ứng viên sẽ được thêm vào cột "Mới nộp"</p>
          </div>
          <button className="rc-modal__close" onClick={onClose}>{Icons.X()}</button>
        </div>

        <div className="rc-modal__body">
          {error && <div className="rc-error-banner">{error}</div>}

          <div className="rc-form-grid">
            <FormField label="Họ và tên" req>
              <input className="rc-inp" placeholder="Nguyễn Văn A" value={form.name}
                onChange={(e) => set('name', e.target.value)} />
            </FormField>
            <FormField label="Email">
              <input className="rc-inp" type="email" placeholder="email@example.com" value={form.email}
                onChange={(e) => set('email', e.target.value)} />
            </FormField>
            <FormField label="Số điện thoại">
              <input className="rc-inp" placeholder="+84 9XX XXX XXX" value={form.phone}
                onChange={(e) => set('phone', e.target.value)} />
            </FormField>
            <FormField label="Năm kinh nghiệm">
              <input className="rc-inp" type="number" min="0" placeholder="0" value={form.experience_years}
                onChange={(e) => set('experience_years', e.target.value)} />
            </FormField>
            <FormField label="Vị trí ứng tuyển" req>
              <input className="rc-inp" list="pos-list" placeholder="Ví dụ: Backend Engineer"
                value={form.position} onChange={(e) => set('position', e.target.value)} />
              <datalist id="pos-list">
                {positions.map((p) => <option key={p} value={p} />)}
              </datalist>
            </FormField>
            <FormField label="Nguồn">
              <select className="rc-inp rc-select" value={form.source} onChange={(e) => set('source', e.target.value)}>
                {['LinkedIn','TopCV','Referral','Direct','Other'].map((s) => <option key={s}>{s}</option>)}
              </select>
            </FormField>
          </div>

          <FormField label="Skills (cách nhau bằng dấu phẩy)">
            <input className="rc-inp" placeholder="React, TypeScript, Node.js" value={form.skills}
              onChange={(e) => set('skills', e.target.value)} />
          </FormField>

          <div className="rc-form-grid">
            <FormField label="Đang làm tại">
              <input className="rc-inp" placeholder="ABC Company" value={form.current_company}
                onChange={(e) => set('current_company', e.target.value)} />
            </FormField>
            <FormField label="Lương kỳ vọng (₫)">
              <input className="rc-inp rc-mono" type="number" placeholder="25000000" value={form.expected_salary}
                onChange={(e) => set('expected_salary', e.target.value)} />
            </FormField>
          </div>

          <FormField label="Ghi chú">
            <textarea className="rc-inp rc-textarea" placeholder="Ghi chú nội bộ, người giới thiệu..."
              value={form.note} onChange={(e) => set('note', e.target.value)} />
          </FormField>
        </div>

        <div className="rc-modal__footer">
          <button className="rc-btn rc-btn--ghost" onClick={onClose}>Huỷ</button>
          <button className="rc-btn rc-btn--primary" onClick={submit} disabled={loading}>
            {loading ? 'Đang lưu...' : 'Thêm vào pipeline'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Candidate Detail Modal ──────────────────────────────── */
function CandidateDetailModal({ candidate, onClose, onSuccess, onDeleteClick, pushToast }) {
  const [form, setForm] = useState({
    name: candidate.name || '',
    email: candidate.email || '',
    phone: candidate.phone || '',
    position: candidate.position || '',
    skills: Array.isArray(candidate.skills) ? candidate.skills.join(', ') : '',
    experience_years: candidate.experience_years || 0,
    expected_salary: candidate.expected_salary || '',
    source: candidate.source || 'Other',
    current_company: candidate.current_company || '',
    note: candidate.note || '',
    match_score: candidate.match_score || 3.5,
    stage: candidate.stage || 'new',
    interview_date: candidate.interview_date ? formatDateTimeLocal(candidate.interview_date) : '',
    interview_link: candidate.interview_link || '',
    interviewer: candidate.interviewer || '',
    interview_note: candidate.interview_note || '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.name.trim() || !form.position.trim()) {
      setError('Họ tên và Vị trí là bắt buộc.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const skillArr = form.skills ? form.skills.split(',').map((s) => s.trim()).filter(Boolean) : [];
      await recruitmentService.updateCandidate(candidate.id, {
        ...form,
        skills: skillArr,
        experience_years: Number(form.experience_years) || 0,
        expected_salary: form.expected_salary ? Number(form.expected_salary) : null,
        match_score: Number(form.match_score) || 3.5,
        interview_date: form.interview_date ? new Date(form.interview_date) : null,
      });
      pushToast('success', 'Cập nhật ứng viên thành công!');
      onSuccess();
      onClose();
    } catch (e) {
      setError(e.response?.data?.message || 'Lỗi khi cập nhật ứng viên');
    } finally {
      setLoading(false);
    }
  };

  const handleActionStage = async (newStage) => {
    setLoading(true);
    try {
      await recruitmentService.moveStage(candidate.id, newStage);
      pushToast('success', `Đã chuyển ứng viên sang trạng thái "${STAGES.find(s => s.id === newStage)?.title}"`);
      onSuccess();
      onClose();
    } catch {
      pushToast('error', 'Lỗi khi chuyển trạng thái ứng viên');
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="rc-modal-bg" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="rc-modal" style={{ maxWidth: '800px' }}>
        <div className="rc-modal__header">
          <div>
            <h2 className="rc-modal__title">Chi tiết ứng viên: {candidate.name}</h2>
            <p className="rc-modal__sub">Cập nhật thông tin ứng tuyển và lịch phỏng vấn</p>
          </div>
          <button className="rc-modal__close" onClick={onClose}>{Icons.X()}</button>
        </div>

        <div className="rc-modal__body">
          {error && <div className="rc-error-banner">{error}</div>}

          <div className="rc-modal-grid">
            {/* Cột trái: Thông tin cá nhân */}
            <div className="rc-modal-col">
              <h4 className="rc-modal-section-title">Thông tin hồ sơ</h4>
              
              <div className="rc-form-grid">
                <FormField label="Họ và tên">
                  <input className="rc-inp" value={form.name} onChange={(e) => set('name', e.target.value)} />
                </FormField>
                <FormField label="Vị trí ứng tuyển">
                  <input className="rc-inp" value={form.position} onChange={(e) => set('position', e.target.value)} />
                </FormField>
              </div>

              <div className="rc-form-grid">
                <FormField label="Email">
                  <input className="rc-inp" value={form.email} onChange={(e) => set('email', e.target.value)} />
                </FormField>
                <FormField label="Số điện thoại">
                  <input className="rc-inp" value={form.phone} onChange={(e) => set('phone', e.target.value)} />
                </FormField>
              </div>

              <div className="rc-form-grid">
                <FormField label="Kinh nghiệm (năm)">
                  <input className="rc-inp" type="number" value={form.experience_years} onChange={(e) => set('experience_years', e.target.value)} />
                </FormField>
                <FormField label="Lương mong muốn (₫)">
                  <input className="rc-inp rc-mono" type="number" value={form.expected_salary} onChange={(e) => set('expected_salary', e.target.value)} />
                </FormField>
              </div>

              <div className="rc-form-grid">
                <FormField label="Nguồn ứng tuyển">
                  <select className="rc-inp rc-select" value={form.source} onChange={(e) => set('source', e.target.value)}>
                    {['LinkedIn','TopCV','Referral','Direct','Other'].map((s) => <option key={s}>{s}</option>)}
                  </select>
                </FormField>
                <FormField label="Đang làm tại">
                  <input className="rc-inp" value={form.current_company} onChange={(e) => set('current_company', e.target.value)} />
                </FormField>
              </div>

              <FormField label="Kỹ năng (cách nhau bằng dấu phẩy)">
                <input className="rc-inp" value={form.skills} onChange={(e) => set('skills', e.target.value)} />
              </FormField>

              <FormField label="Ghi chú hồ sơ">
                <textarea className="rc-inp rc-textarea" style={{ height: '70px' }} value={form.note} onChange={(e) => set('note', e.target.value)} />
              </FormField>
            </div>

            {/* Cột phải: Lịch phỏng vấn & Trạng thái */}
            <div className="rc-modal-col">
              <h4 className="rc-modal-section-title">Tiến trình & Lịch phỏng vấn</h4>

              <div className="rc-form-grid">
                <FormField label="Trạng thái hiện tại">
                  <select className="rc-inp rc-select" value={form.stage} onChange={(e) => { set('stage', e.target.value); handleActionStage(e.target.value); }}>
                    {STAGES.map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}
                  </select>
                </FormField>
                <FormField label="Điểm đánh giá AI (1-5)">
                  <input className="rc-inp" type="number" step="0.1" min="1" max="5" value={form.match_score} onChange={(e) => set('match_score', e.target.value)} />
                </FormField>
              </div>

              <div className="rc-interview-box">
                <p className="rc-interview-box-title">Thông tin phỏng vấn</p>
                <FormField label="Thời gian phỏng vấn">
                  <input className="rc-inp" type="datetime-local" value={form.interview_date} onChange={(e) => set('interview_date', e.target.value)} />
                </FormField>
                <FormField label="Link phỏng vấn (Google Meet / Zoom)">
                  <input className="rc-inp" placeholder="https://meet.google.com/..." value={form.interview_link} onChange={(e) => set('interview_link', e.target.value)} />
                </FormField>
                <FormField label="Người phỏng vấn">
                  <input className="rc-inp" placeholder="Tên người phỏng vấn..." value={form.interviewer} onChange={(e) => set('interviewer', e.target.value)} />
                </FormField>
                <FormField label="Ghi chú buổi phỏng vấn">
                  <textarea className="rc-inp rc-textarea" style={{ height: '80px' }} placeholder="Nhận xét đánh giá phỏng vấn..." value={form.interview_note} onChange={(e) => set('interview_note', e.target.value)} />
                </FormField>
              </div>
            </div>
          </div>
        </div>

        <div className="rc-modal__footer" style={{ justifyContent: 'space-between' }}>
          <div>
            <button className="rc-btn rc-btn--ghost" style={{ color: 'var(--rc-danger)' }} onClick={() => onDeleteClick(candidate)}>
              Xóa ứng viên
            </button>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="rc-btn rc-btn--ghost" onClick={onClose}>Đóng</button>
            <button className="rc-btn rc-btn--danger" onClick={() => handleActionStage('rejected')} disabled={loading || form.stage === 'rejected'}>
              Từ chối (Reject)
            </button>
            <button className="rc-btn rc-btn--primary" style={{ background: 'var(--rc-success-soft)', borderColor: 'var(--rc-success-soft)' }} onClick={() => handleActionStage('hired')} disabled={loading || form.stage === 'hired'}>
              Chấp nhận tuyển (Hired)
            </button>
            <button className="rc-btn rc-btn--primary" onClick={handleSave} disabled={loading}>
              Lưu thay đổi
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Delete Confirm Modal ────────────────────────────────── */
function DeleteModal({ candidate, onClose, onConfirm }) {
  return (
    <div className="rc-modal-bg" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="rc-modal rc-modal--sm">
        <div className="rc-modal__header">
          <h2 className="rc-modal__title">Xác nhận xoá</h2>
          <button className="rc-modal__close" onClick={onClose}>{Icons.X()}</button>
        </div>
        <div className="rc-modal__body">
          <p className="rc-del-text">
            Bạn có chắc muốn xoá ứng viên <strong>{candidate.name}</strong> — {candidate.position}?
            <br />Hành động này không thể hoàn tác.
          </p>
        </div>
        <div className="rc-modal__footer">
          <button className="rc-btn rc-btn--ghost" onClick={onClose}>Huỷ</button>
          <button className="rc-btn rc-btn--danger" onClick={onConfirm}>Xoá</button>
        </div>
      </div>
    </div>
  );
}

/* ══ Main Page ══════════════════════════════════════════ */
export default function RecruitmentPage() {
  const { user } = useSelector((s) => s.auth);

  const [board, setBoard]         = useState(() => Object.fromEntries(STAGES.map((s) => [s.id, []])));
  const [stats, setStats]         = useState(null);
  const [positions, setPositions] = useState([]);
  const [loading, setLoading]     = useState(true);

  const [dragging, setDragging]   = useState({ id: null, from: null });
  const [dropTarget, setDrop]     = useState(null);
  const [selected, setSelected]   = useState(null);

  const [showAdd, setShowAdd]     = useState(false);
  const [delTarget, setDelTarget] = useState(null);
  const [aiTarget, setAiTarget]   = useState(null);
  const [filterPos, setFilterPos] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // all | active | hired | rejected

  const { toasts, push } = useToast();

  /* ── load ──────────────────────────────────────────── */
  const loadBoard = useCallback(async () => {
    try {
      setLoading(true);
      const params = filterPos ? { position: filterPos } : {};
      const [boardRes, statsRes, posRes] = await Promise.all([
        recruitmentService.getBoard(params),
        recruitmentService.getStats(),
        recruitmentService.getPositions(),
      ]);
      setBoard(boardRes.data);
      setStats(statsRes.data);
      setPositions(posRes.data || []);
    } catch {
      setBoard({ new: [], screening: [], iv1: [], iv2: [], offer: [], hired: [], rejected: [] });
      setStats(null);
      setPositions([]);
    } finally {
      setLoading(false);
    }
  }, [filterPos]); // eslint-disable-line

  useEffect(() => { loadBoard(); }, [loadBoard]);

  /* ── drag & drop ─────────────────────────────────── */
  const STAGE_ORDER = STAGES.map((s) => s.id);

  const handleDrop = useCallback(async (toStage) => {
    const { id, from } = dragging;
    if (!id || !from || from === toStage) { setDrop(null); return; }

    const fromIdx = STAGE_ORDER.indexOf(from);
    const toIdx   = STAGE_ORDER.indexOf(toStage);

    if (from === 'hired') {
      push('error', 'Không thể di chuyển ứng viên đã tuyển.');
      setDragging({ id: null, from: null }); setDrop(null); return;
    }
    if (toIdx < fromIdx - 1) {
      push('error', 'Không thể đảo ngược nhiều stage một lần.');
      setDragging({ id: null, from: null }); setDrop(null); return;
    }

    // Optimistic update
    setBoard((prev) => {
      const card = prev[from]?.find((c) => c.id === id);
      if (!card) return prev;
      return {
        ...prev,
        [from]: prev[from].filter((c) => c.id !== id),
        [toStage]: [{ ...card, stage: toStage }, ...(prev[toStage] || [])],
      };
    });

    const candidateName = board[from]?.find((c) => c.id === id)?.name;
    setDragging({ id: null, from: null }); setDrop(null);

    try {
      await recruitmentService.moveStage(id, toStage);
      const stageTitle = STAGES.find((s) => s.id === toStage)?.title;
      push('success', `Đã chuyển ${candidateName} sang "${stageTitle}"`);
    } catch {
      push('error', 'Lỗi khi cập nhật stage, thử lại.');
      loadBoard(); // revert
    }
  }, [dragging, board, push, loadBoard]); // eslint-disable-line

  /* ── delete ──────────────────────────────────────── */
  const handleDelete = async () => {
    if (!delTarget) return;
    try {
      await recruitmentService.deleteCandidate(delTarget.id);
      push('success', `Đã xoá ${delTarget.name}`);
      setDelTarget(null);
      loadBoard();
    } catch {
      push('error', 'Lỗi khi xoá ứng viên');
    }
  };

  const selectedCandidate = Object.values(board).flat().find((c) => c?.id === selected);
  const totalActive = STAGES.reduce((sum, s) => sum + (board[s.id]?.length || 0), 0);

  const visibleStages = STAGES.filter((stage) => {
    if (filterStatus === 'all') return true;
    if (filterStatus === 'active') return stage.id !== 'hired' && stage.id !== 'rejected';
    if (filterStatus === 'hired') return stage.id === 'hired';
    if (filterStatus === 'rejected') return stage.id === 'rejected';
    return true;
  });

  return (
    <div className="rc-page">
      <ToastList toasts={toasts} />

      {/* Header */}
      <div className="rc-header">
        <div>
          <div className="rc-header__title-row">
            <h1 className="rc-header__h1">Tuyển dụng</h1>
            <select
              className="rc-pos-select"
              value={filterPos}
              onChange={(e) => setFilterPos(e.target.value)}
            >
              <option value="">Tất cả vị trí ({positions.length} mở)</option>
              {positions.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
            <select
              className="rc-pos-select"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              style={{ marginLeft: '8px' }}
            >
              <option value="all">Tất cả trạng thái (All)</option>
              <option value="active">Đang ứng tuyển (Active)</option>
              <option value="hired">Chấp nhận (Hired / Accept)</option>
              <option value="rejected">Từ chối (Rejected / Deny)</option>
            </select>
          </div>
          <p className="rc-header__sub">
            {totalActive} ứng viên đang xử lý · {positions.length} vị trí đang tuyển
          </p>
        </div>
        <div className="rc-header__actions">
          <button className="rc-btn rc-btn--ghost" onClick={loadBoard} title="Làm mới">
            {Icons.Refresh} Làm mới
          </button>
          <button className="rc-btn rc-btn--accent" onClick={() => setShowAdd(true)}>
            {Icons.User} Thêm ứng viên
          </button>
        </div>
      </div>

      {/* Stats */}
      <StatsBar stats={stats} total={totalActive} />

      {/* Kanban */}
      <div className="rc-board-wrap">
        {loading ? (
          <div className="rc-loading">
            <div className="rc-spinner" />
            <p>Đang tải dữ liệu...</p>
          </div>
        ) : (
          <div className="rc-board">
            {visibleStages.map((stage) => (
              <KanbanColumn
                key={stage.id}
                stage={stage}
                candidates={board[stage.id] || []}
                draggingId={dragging.id}
                selectedId={selected}
                dropTarget={dropTarget}
                onCardSelect={(id) => setSelected((s) => s === id ? null : id)}
                onDragStart={(cId, from) => setDragging({ id: cId, from })}
                onDragEnd={() => { setDragging({ id: null, from: null }); setDrop(null); }}
                onDragOver={() => { if (dropTarget !== stage.id) setDrop(stage.id); }}
                onDragLeave={() => { if (dropTarget === stage.id) setDrop(null); }}
                onDrop={() => handleDrop(stage.id)}
                onAddClick={() => setShowAdd(true)}
                onDelete={(c) => setDelTarget(c)}
                onAnalyze={(c) => setAiTarget(c)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      {selectedCandidate && (
        <CandidateDetailModal
          candidate={selectedCandidate}
          onClose={() => setSelected(null)}
          onSuccess={() => { loadBoard(); }}
          onDeleteClick={(c) => { setSelected(null); setDelTarget(c); }}
          pushToast={push}
        />
      )}
      {showAdd && (
        <AddCandidateModal
          positions={positions}
          onClose={() => setShowAdd(false)}
          onSuccess={() => { push('success', 'Đã thêm ứng viên mới vào pipeline!'); loadBoard(); }}
        />
      )}
      {delTarget && (
        <DeleteModal
          candidate={delTarget}
          onClose={() => setDelTarget(null)}
          onConfirm={handleDelete}
        />
      )}
      {aiTarget && (
        <AICVModal
          candidate={aiTarget}
          onClose={() => setAiTarget(null)}
          onSuccess={() => { loadBoard(); push('success', `✅ Phân tích CV ${aiTarget.name} thành công!`); }}
        />
      )}
    </div>
  );
}
