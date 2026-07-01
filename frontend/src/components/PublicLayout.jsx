import { Link, Outlet } from 'react-router-dom';

const PublicLayout = () => {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50 text-gray-900">
      <header style={{ background: '#fff', boxShadow: '0 1px 0 #e5e7eb', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Logo */}
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <div style={{ width: 32, height: 32, background: 'linear-gradient(135deg, #0ea5e9, #6366f1)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 800, color: '#fff' }}>A</div>
            <span style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>ATRIA</span>
          </Link>

          {/* Nav */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: 28, fontSize: 14, fontWeight: 500 }}>
            <Link to="/" style={{ color: '#6b7280', textDecoration: 'none' }}>Trang chủ</Link>
            <Link to="/jobs" style={{ color: '#6b7280', textDecoration: 'none' }}>Việc làm</Link>
            <Link
              to="/login"
              style={{ background: 'linear-gradient(135deg, #0ea5e9, #6366f1)', color: '#fff', padding: '8px 20px', borderRadius: 8, textDecoration: 'none', fontWeight: 600 }}
            >
              Đăng nhập →
            </Link>
          </nav>
        </div>
      </header>

      <main style={{ flexGrow: 1 }}>
        <Outlet />
      </main>

      <footer style={{ background: '#0f172a', color: 'rgba(255,255,255,0.45)', padding: '40px 24px', textAlign: 'center', fontSize: 13 }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#fff', marginBottom: 8 }}>ATRIA</div>
          <p>© 2026 Atria. Nền tảng quản lý nhân sự thế hệ mới.</p>
          <p style={{ marginTop: 8 }}>
            <Link to="/jobs" style={{ color: '#38bdf8', textDecoration: 'none' }}>Tuyển dụng</Link>
            {' · '}
            <Link to="/login" style={{ color: '#38bdf8', textDecoration: 'none' }}>Đăng nhập nội bộ</Link>
          </p>
        </div>
      </footer>
    </div>
  );
};

export default PublicLayout;
