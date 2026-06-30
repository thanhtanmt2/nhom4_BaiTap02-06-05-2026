import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, Building2, CheckCircle } from 'lucide-react';
import { loginThunk } from '../redux/authSlice';

const FEATURES = [
  'Chấm công bằng GPS, lịch sử minh bạch',
  'Tính lương tự động cho Full-time / Intern / Freelancer',
  'Bảo mật 2FA, audit log toàn hệ thống',
];

const Login = () => {
  const [email, setEmail] = useState(localStorage.getItem('rememberedEmail') || '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(!!localStorage.getItem('rememberedEmail'));
  const [successMsg, setSuccessMsg] = useState('');
  const [redirectTarget, setRedirectTarget] = useState('');

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error } = useSelector((state) => state.auth);

  useEffect(() => {
    if (!successMsg || !redirectTarget) return;
    const timer = setTimeout(() => navigate(redirectTarget), 1200);
    return () => clearTimeout(timer);
  }, [successMsg, redirectTarget, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setSuccessMsg('');
    const result = await dispatch(loginThunk({ email, password }));
    if (loginThunk.fulfilled.match(result)) {
      if (rememberMe) {
        localStorage.setItem('rememberedEmail', email);
      } else {
        localStorage.removeItem('rememberedEmail');
      }
      const target = result.payload?.redirectUrl || '/user/profile';
      setRedirectTarget(target);
      setSuccessMsg('Đăng nhập thành công! Đang chuyển hướng...');
    }
  };

  return (
    <div className="min-h-screen flex" style={{ fontFamily: 'var(--font-jakarta)' }}>
      {/* Left panel — navy */}
      <div className="hidden lg:flex lg:w-[58%] bg-navy-950 flex-col relative overflow-hidden">
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-10 pt-9">
          <div className="w-8 h-8 bg-navy-700 rounded-md flex items-center justify-center text-[13px] font-bold text-white shrink-0">
            A
          </div>
          <span className="text-[15px] font-bold text-white tracking-tight">ATRIA</span>
        </div>

        {/* Headline */}
        <div className="flex-1 flex flex-col justify-center px-10 pb-16">
          <h1 className="text-[42px] font-bold italic leading-[1.15] text-white tracking-[-0.02em] mb-5">
            Quản lý nhân sự,<br />
            không quản lý sự phiền hà.
          </h1>
          <p className="text-[15px] text-white/60 leading-relaxed mb-8 max-w-95">
            ATRIA giúp công ty IT của bạn xử lý chấm công, lương,<br />
            đánh giá KPI trong một hệ thống duy nhất.
          </p>
          <ul className="space-y-3.5">
            {FEATURES.map((f) => (
              <li key={f} className="flex items-center gap-3">
                <CheckCircle size={18} strokeWidth={2} className="text-accent-500 shrink-0" />
                <span className="text-[14px] text-white/75">{f}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Footer */}
        <p className="px-10 pb-6 text-[12px] text-white/30">
          v1.0 · © 2026 Công ty XYZ
        </p>

        {/* Decorative circle */}
        <div
          className="absolute -bottom-20 -right-20 w-75 h-75 rounded-full opacity-[0.06]"
          style={{ background: 'var(--navy-500)' }}
        />
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex flex-col items-center justify-center bg-white px-8 py-12">
        <div className="w-full max-w-90">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-7 h-7 bg-navy-700 rounded-md flex items-center justify-center text-xs font-bold text-white">A</div>
            <span className="font-bold text-gray-900">ATRIA</span>
          </div>

          <h2 className="text-[24px] font-semibold text-gray-900 tracking-[-0.01em] mb-1">
            Đăng nhập
          </h2>
          <p className="text-[14px] text-gray-500 mb-7">
            Vào hệ thống ATRIA bằng tài khoản công ty
          </p>

          {/* Error */}
          {error && (
            <div className="mb-4 px-3.5 py-2.5 rounded-md bg-danger-50 border-l-[3px] border-danger-600">
              <p className="text-[13px] text-danger-700">{error}</p>
            </div>
          )}
          {successMsg && (
            <div className="mb-4 px-3.5 py-2.5 rounded-md bg-success-50 border-l-[3px] border-success-600">
              <p className="text-[13px] text-success-700">{successMsg}</p>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-[13px] font-medium text-gray-700 mb-1.5">
                Email công ty <span className="text-danger-600">*</span>
              </label>
              <div className="relative">
                <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ten@congty.com"
                  className="w-full h-10 pl-9 pr-3 text-[14px] border border-gray-300 rounded-md bg-white text-gray-900 placeholder-gray-400
                    hover:border-gray-400 focus:outline-none focus:border-navy-600 transition-colors"
                  style={{ boxShadow: 'none' }}
                  onFocus={(e) => (e.target.style.boxShadow = 'var(--focus-ring)')}
                  onBlur={(e) => (e.target.style.boxShadow = 'none')}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-[13px] font-medium text-gray-700 mb-1.5">
                Mật khẩu <span className="text-danger-600">*</span>
              </label>
              <div className="relative">
                <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Tối thiểu 8 ký tự"
                  className="w-full h-10 pl-9 pr-10 text-[14px] border border-gray-300 rounded-md bg-white text-gray-900 placeholder-gray-400
                    hover:border-gray-400 focus:outline-none focus:border-navy-600 transition-colors"
                  style={{ boxShadow: 'none' }}
                  onFocus={(e) => (e.target.style.boxShadow = 'var(--focus-ring)')}
                  onBlur={(e) => (e.target.style.boxShadow = 'none')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Remember + forgot */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded-sm border-gray-400"
                  style={{ accentColor: 'var(--navy-700)' }}
                />
                <span className="text-[13px] text-gray-700">Ghi nhớ đăng nhập</span>
              </label>
              <Link
                to="/forgot-password"
                className="text-[13px] font-medium text-accent-600 hover:text-accent-700 transition-colors"
              >
                Quên mật khẩu?
              </Link>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || !!successMsg}
              className="w-full h-10 bg-navy-700 hover:bg-navy-800 text-white text-[14px] font-semibold rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed active:scale-[.98]"
              style={{ transition: 'background 150ms, transform 100ms' }}
            >
              {loading ? 'Đang xử lý...' : 'Đăng nhập'}
            </button>


          </form>

          <p className="mt-6 text-center text-[13px] text-gray-500">
            Chưa có tài khoản?{' '}
            <span className="text-gray-500">Liên hệ HR hoặc Admin để được cấp.</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
