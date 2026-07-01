import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getPublicJobs } from '../../services/publicJob.service';

const HomePage = () => {
  const [jobs, setJobs] = useState([]);
  const [loadingJobs, setLoadingJobs] = useState(true);

  useEffect(() => {
    getPublicJobs()
      .then((res) => setJobs(res.data || []))
      .catch(() => {})
      .finally(() => setLoadingJobs(false));
  }, []);

  return (
    <div className="font-sans">

      {/* ── HERO ─────────────────────────────────────────────── */}
      <section
        style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 60%, #0ea5e9 100%)',
          minHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          textAlign: 'center',
          padding: '80px 24px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* decorative blur blobs */}
        <div style={{ position: 'absolute', top: '10%', left: '5%', width: 300, height: 300, background: 'rgba(14,165,233,0.12)', borderRadius: '50%', filter: 'blur(80px)' }} />
        <div style={{ position: 'absolute', bottom: '10%', right: '5%', width: 400, height: 400, background: 'rgba(99,102,241,0.12)', borderRadius: '50%', filter: 'blur(100px)' }} />

        <div style={{ position: 'relative', maxWidth: 740, margin: '0 auto' }}>
          <span style={{ display: 'inline-block', background: 'rgba(14,165,233,0.18)', color: '#38bdf8', border: '1px solid rgba(14,165,233,0.3)', borderRadius: 999, padding: '6px 20px', fontSize: 13, fontWeight: 600, letterSpacing: '0.05em', marginBottom: 28 }}>
            🚀 Đang tuyển dụng {jobs.length > 0 ? `${jobs.length} vị trí` : ''}
          </span>

          <h1 style={{ fontSize: 'clamp(36px, 6vw, 68px)', fontWeight: 800, color: '#fff', lineHeight: 1.1, margin: '0 0 24px', letterSpacing: '-0.02em' }}>
            Hãy cùng nhau xây dựng <span style={{ background: 'linear-gradient(90deg, #38bdf8, #818cf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>tương lai</span>
          </h1>

          <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.68)', lineHeight: 1.8, maxWidth: 560, margin: '0 auto 44px' }}>
            Atria là nền tảng quản lý nhân sự thế hệ mới. Chúng tôi đang tìm kiếm những tài năng đam mê công nghệ, sáng tạo và muốn tạo ra giá trị thực sự.
          </p>

          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="#jobs" style={{ background: 'linear-gradient(135deg, #0ea5e9, #6366f1)', color: '#fff', padding: '14px 36px', borderRadius: 12, fontWeight: 700, fontSize: 15, textDecoration: 'none', boxShadow: '0 4px 24px rgba(14,165,233,0.35)', transition: 'transform 0.2s' }}>
              Xem vị trí tuyển dụng ↓
            </a>
            <Link to="/login" style={{ background: 'rgba(255,255,255,0.08)', color: '#fff', padding: '14px 36px', borderRadius: 12, fontWeight: 600, fontSize: 15, textDecoration: 'none', border: '1px solid rgba(255,255,255,0.18)', backdropFilter: 'blur(8px)' }}>
              Đăng nhập nội bộ →
            </Link>
          </div>
        </div>
      </section>

      {/* ── STATS ────────────────────────────────────────────── */}
      <section style={{ background: '#fff', borderBottom: '1px solid #e5e7eb', padding: '48px 24px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 32, textAlign: 'center' }}>
          {[
            { num: '5+', label: 'Năm hoạt động' },
            { num: '200+', label: 'Nhân viên toàn cầu' },
            { num: '98%', label: 'Tỷ lệ hài lòng' },
            { num: jobs.length > 0 ? String(jobs.length) : '...', label: 'Vị trí đang tuyển' },
          ].map((s) => (
            <div key={s.label}>
              <div style={{ fontSize: 40, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>{s.num}</div>
              <div style={{ fontSize: 14, color: '#6b7280', marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── ABOUT ────────────────────────────────────────────── */}
      <section style={{ background: '#f8fafc', padding: '80px 24px' }}>
        <div style={{ maxWidth: 960, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 64, alignItems: 'center' }}>
          <div>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#0ea5e9', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Về chúng tôi</span>
            <h2 style={{ fontSize: 36, fontWeight: 800, color: '#0f172a', margin: '12px 0 20px', lineHeight: 1.2 }}>Môi trường làm việc hiện đại, con người là trung tâm</h2>
            <p style={{ fontSize: 15, color: '#6b7280', lineHeight: 1.9, marginBottom: 16 }}>
              Tại Atria, chúng tôi tin rằng một sản phẩm xuất sắc bắt đầu từ những con người xuất sắc. Chúng tôi xây dựng văn hóa cởi mở, luôn khuyến khích sáng tạo và học hỏi không ngừng.
            </p>
            <p style={{ fontSize: 15, color: '#6b7280', lineHeight: 1.9 }}>
              Mỗi thành viên đều có cơ hội thăng tiến rõ ràng, được trang bị đầy đủ công cụ hiện đại và làm chủ công việc của mình.
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {[
              { icon: '💰', title: 'Lương & thưởng hấp dẫn', desc: 'Cạnh tranh theo thị trường, review 2 lần/năm' },
              { icon: '🏖️', title: 'Nghỉ phép linh hoạt', desc: '15 ngày phép/năm + các ngày lễ đầy đủ' },
              { icon: '📚', title: 'Học tập & phát triển', desc: 'Ngân sách đào tạo 10 triệu/năm/người' },
              { icon: '🏥', title: 'Bảo hiểm sức khỏe', desc: 'BHYT, BHXH + bảo hiểm sức khoẻ tư nhân' },
            ].map((b) => (
              <div key={b.title} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 16, padding: '20px 16px' }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>{b.icon}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>{b.title}</div>
                <div style={{ fontSize: 12, color: '#9ca3af', lineHeight: 1.6 }}>{b.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── JOBS ─────────────────────────────────────────────── */}
      <section id="jobs" style={{ background: '#fff', padding: '80px 24px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 52 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#0ea5e9', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Tuyển dụng</span>
            <h2 style={{ fontSize: 36, fontWeight: 800, color: '#0f172a', margin: '12px 0 12px' }}>Cơ hội đang chờ đón bạn</h2>
            <p style={{ fontSize: 15, color: '#6b7280' }}>Tất cả vị trí đều có thể làm việc kết hợp (hybrid)</p>
          </div>

          {loadingJobs ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
              <div style={{ width: 36, height: 36, border: '3px solid #e5e7eb', borderTopColor: '#0ea5e9', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            </div>
          ) : jobs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#9ca3af' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🔍</div>
              <p>Hiện chưa có vị trí nào đang tuyển. Vui lòng quay lại sau!</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: 16 }}>
              {jobs.map((job) => (
                <div
                  key={job.id}
                  style={{ border: '1px solid #e5e7eb', borderRadius: 16, padding: '24px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24, flexWrap: 'wrap', background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', transition: 'box-shadow 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 20px rgba(14,165,233,0.12)'}
                  onMouseLeave={e => e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.04)'}
                >
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <h3 style={{ fontSize: 17, fontWeight: 700, color: '#0f172a', margin: '0 0 6px' }}>{job.title}</h3>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
                      {job.department && <span style={{ fontSize: 12, color: '#6b7280' }}>🏢 {job.department}</span>}
                      {job.location && <span style={{ fontSize: 12, color: '#6b7280' }}>📍 {job.location}</span>}
                      {job.type && <span style={{ fontSize: 12, color: '#6b7280' }}>⏰ {job.type}</span>}
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {job.salary_range && (
                        <span style={{ fontSize: 12, fontWeight: 600, background: '#f0fdf4', color: '#16a34a', padding: '3px 10px', borderRadius: 999, border: '1px solid #bbf7d0' }}>
                          💵 {job.salary_range}
                        </span>
                      )}
                      {job.deadline && (
                        <span style={{ fontSize: 12, background: '#fefce8', color: '#a16207', padding: '3px 10px', borderRadius: 999, border: '1px solid #fde68a' }}>
                          Hạn: {new Date(job.deadline).toLocaleDateString('vi-VN')}
                        </span>
                      )}
                    </div>
                  </div>
                  <Link
                    to={`/jobs/${job.id}/apply`}
                    style={{ background: 'linear-gradient(135deg, #0ea5e9, #6366f1)', color: '#fff', padding: '12px 28px', borderRadius: 10, fontWeight: 700, fontSize: 14, textDecoration: 'none', whiteSpace: 'nowrap', boxShadow: '0 2px 12px rgba(14,165,233,0.3)' }}
                  >
                    Ứng tuyển →
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────── */}
      <section style={{ background: 'linear-gradient(135deg, #0f172a, #1e3a5f)', padding: '80px 24px', textAlign: 'center' }}>
        <h2 style={{ fontSize: 34, fontWeight: 800, color: '#fff', margin: '0 0 16px' }}>Không thấy vị trí phù hợp?</h2>
        <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.6)', marginBottom: 36 }}>Gửi hồ sơ tự do cho chúng tôi — chúng tôi sẽ liên hệ khi có vị trí phù hợp!</p>
        <a href="mailto:careers@atria.vn" style={{ background: 'linear-gradient(135deg, #0ea5e9, #6366f1)', color: '#fff', padding: '14px 40px', borderRadius: 12, fontWeight: 700, fontSize: 15, textDecoration: 'none' }}>
          Gửi hồ sơ tự do →
        </a>
      </section>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default HomePage;
