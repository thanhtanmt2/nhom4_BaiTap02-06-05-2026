import { useState, useEffect, useRef, useCallback } from "react";
import { Calculator, RefreshCw, Users, CheckCircle, CheckSquare, CreditCard, Banknote, Sparkles, X } from "lucide-react";
import Badge from "../../components/ui/Badge";
import Avatar from "../../components/ui/Avatar";
import payrollService from "../../services/payroll.service";

const TYPE_BADGE = {
  "Full-time":  { label: "Full-time",  variant: "brand" },
  "Intern":     { label: "Thực tập",  variant: "info" },
  "Freelancer": { label: "Freelancer", variant: "accent" },
};

const STATUS_BADGE = {
  draft:    { label: "Nháp",           variant: "warning" },
  approved: { label: "Đã duyệt",       variant: "success" },
  paid:     { label: "Đã thanh toán",  variant: "neutral" },
};

const formatMoney = (val) =>
  new Intl.NumberFormat("vi-VN").format(Math.round(Number(val)));

// ─── Confetti Canvas ────────────────────────────────────────────────────────────
function ConfettiCanvas({ active }) {
  const canvasRef = useRef(null);
  const animRef   = useRef(null);
  const particles = useRef([]);
  const COLORS = ["#6366f1","#a855f7","#ec4899","#f59e0b","#10b981","#3b82f6","#f97316","#14b8a6"];
  const rnd = (a, b) => Math.random() * (b - a) + a;

  const init = useCallback(() => {
    const c = canvasRef.current;
    if (!c) return;
    c.width  = window.innerWidth;
    c.height = window.innerHeight;
    particles.current = Array.from({ length: 130 }, () => ({
      x: rnd(0, c.width), y: rnd(-20, -250),
      vx: rnd(-2.5, 2.5), vy: rnd(2.5, 8),
      size: rnd(6, 15), color: COLORS[Math.floor(Math.random() * COLORS.length)],
      angle: rnd(0, Math.PI * 2), spin: rnd(-0.18, 0.18),
      shape: Math.random() > 0.5 ? "rect" : "circle", opacity: 1,
    }));
  }, []);

  const draw = useCallback(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    ctx.clearRect(0, 0, c.width, c.height);
    let alive = false;
    particles.current.forEach(p => {
      p.x += p.vx; p.y += p.vy; p.vy += 0.13; p.angle += p.spin;
      if (p.y < c.height + 20) alive = true;
      if (p.y > c.height - 120) p.opacity = Math.max(0, p.opacity - 0.025);
      ctx.save();
      ctx.globalAlpha = p.opacity;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.angle);
      ctx.fillStyle = p.color;
      if (p.shape === "rect") {
        ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
      } else {
        ctx.beginPath(); ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2); ctx.fill();
      }
      ctx.restore();
    });
    if (alive) animRef.current = requestAnimationFrame(draw);
  }, []);

  useEffect(() => {
    if (active) { init(); animRef.current = requestAnimationFrame(draw); }
    return () => cancelAnimationFrame(animRef.current);
  }, [active, init, draw]);

  if (!active) return null;
  return <canvas ref={canvasRef} style={{ position:"fixed", inset:0, pointerEvents:"none", zIndex:9999, width:"100%", height:"100%" }} />;
}

// ─── Payment Modal ──────────────────────────────────────────────────────────────
function PaymentModal({ visible, count, totalNet, onConfirm, onClose, paying }) {
  const [step, setStep]       = useState("idle");
  const [progress, setProgress] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (visible) { setStep("idle"); setProgress(0); setShowConfetti(false); }
  }, [visible]);

  const handleConfirm = async () => {
    setStep("processing");
    setProgress(0);
    const steps = [8, 22, 40, 58, 76, 92, 100];
    let i = 0;
    const iv = setInterval(() => {
      if (i < steps.length) { setProgress(steps[i]); i++; }
      else {
        clearInterval(iv);
        // Gọi API thực
        onConfirm().then(() => {
          setStep("done");
          setShowConfetti(true);
          setTimeout(() => setShowConfetti(false), 4500);
        }).catch(() => {
          setStep("idle");
        });
      }
    }, 260);
  };

  if (!visible) return null;

  return (
    <>
      <ConfettiCanvas active={showConfetti} />
      <div style={{ position:"fixed", inset:0, zIndex:500, display:"flex", alignItems:"center", justifyContent:"center", padding:16, background:"rgba(15,23,42,.7)", backdropFilter:"blur(5px)" }}>
        <div style={{ width:"100%", maxWidth:440, background:"#fff", borderRadius:20, boxShadow:"0 25px 60px rgba(0,0,0,.25)", overflow:"hidden", animation:"pmScaleIn 280ms cubic-bezier(.34,1.56,.64,1)" }}>

          {/* Header */}
          {step !== "done" && (
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"18px 24px", borderBottom:"1px solid #f1f5f9" }}>
              <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                <div style={{ width:34, height:34, borderRadius:10, background:"linear-gradient(135deg,#6366f1,#8b5cf6)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                  <CreditCard size={16} color="#fff" />
                </div>
                <span style={{ fontSize:16, fontWeight:700, color:"#0f172a" }}>Xác nhận thanh toán lương</span>
              </div>
              {step === "idle" && (
                <button onClick={onClose} style={{ width:32, height:32, borderRadius:8, border:"none", background:"transparent", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:"#94a3b8" }}>
                  <X size={16} />
                </button>
              )}
            </div>
          )}

          {/* IDLE */}
          {step === "idle" && (
            <div style={{ padding:24, display:"flex", flexDirection:"column", gap:20 }}>
              <div style={{ borderRadius:14, background:"linear-gradient(135deg,#eef2ff,#f5f3ff)", border:"1px solid #c7d2fe", padding:18 }}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:10 }}>
                  <span style={{ fontSize:11, fontWeight:600, textTransform:"uppercase", letterSpacing:.06, color:"#6366f1" }}>Số nhân viên</span>
                  <span style={{ fontSize:26, fontWeight:800, color:"#4338ca", fontFamily:"monospace" }}>{count}</span>
                </div>
                <div style={{ display:"flex", justifyContent:"space-between" }}>
                  <span style={{ fontSize:11, fontWeight:600, textTransform:"uppercase", letterSpacing:.06, color:"#6366f1" }}>Tổng chi trả</span>
                  <span style={{ fontSize:20, fontWeight:700, color:"#059669", fontFamily:"monospace" }}>{formatMoney(totalNet)} đ</span>
                </div>
              </div>
              <p style={{ fontSize:13, color:"#64748b", lineHeight:1.6, margin:0 }}>
                Thao tác này sẽ đánh dấu <strong style={{ color:"#1e293b" }}>{count} phiếu lương</strong> là&nbsp;
                <span style={{ color:"#059669", fontWeight:600 }}>Đã thanh toán</span>. Hành động không thể hoàn tác.
              </p>
              <div style={{ display:"flex", gap:12 }}>
                <button onClick={onClose} style={{ flex:1, height:42, border:"1px solid #e2e8f0", borderRadius:10, fontSize:13, fontWeight:600, color:"#64748b", background:"#fff", cursor:"pointer" }}>
                  Hủy
                </button>
                <button
                  onClick={handleConfirm}
                  style={{ flex:1, height:42, border:"none", borderRadius:10, fontSize:13, fontWeight:700, color:"#fff", cursor:"pointer", background:"linear-gradient(135deg,#6366f1,#a855f7)", boxShadow:"0 4px 14px rgba(99,102,241,.35)" }}
                >
                  <span style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
                    <Banknote size={15} /> Xác nhận thanh toán
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* PROCESSING */}
          {step === "processing" && (
            <div style={{ padding:"48px 32px", display:"flex", flexDirection:"column", alignItems:"center", gap:24 }}>
              <div style={{ position:"relative", width:80, height:80 }}>
                <div style={{ position:"absolute", inset:0, borderRadius:"50%", background:"conic-gradient(#6366f1,#a855f7,#ec4899,#f59e0b,#10b981,#6366f1)", animation:"pmSpin 1.1s linear infinite" }} />
                <div style={{ position:"absolute", inset:4, borderRadius:"50%", background:"#fff", display:"flex", alignItems:"center", justifyContent:"center" }}>
                  <Banknote size={28} color="#6366f1" />
                </div>
              </div>
              <div style={{ width:"100%" }}>
                <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, fontWeight:600, color:"#64748b", marginBottom:8 }}>
                  <span>Đang xử lý...</span>
                  <span style={{ color:"#6366f1" }}>{progress}%</span>
                </div>
                <div style={{ height:10, background:"#f1f5f9", borderRadius:99, overflow:"hidden" }}>
                  <div style={{ height:"100%", borderRadius:99, transition:"width 300ms ease", width:`${progress}%`, background:"linear-gradient(90deg,#6366f1,#a855f7,#ec4899)", boxShadow:"0 0 12px rgba(99,102,241,.5)" }} />
                </div>
                <p style={{ fontSize:11, color:"#94a3b8", textAlign:"center", marginTop:8 }}>
                  {progress < 30 ? "Đang xác minh danh sách nhân viên..." :
                   progress < 60 ? "Đang ghi nhận giao dịch ngân hàng..." :
                   progress < 90 ? "Đang cập nhật trạng thái phiếu lương..." :
                   "Hoàn tất xử lý..."}
                </p>
              </div>
            </div>
          )}

          {/* DONE */}
          {step === "done" && (
            <div style={{ padding:"48px 32px", display:"flex", flexDirection:"column", alignItems:"center", gap:18, textAlign:"center" }}>
              <div style={{ width:80, height:80, borderRadius:"50%", background:"linear-gradient(135deg,#10b981,#059669)", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 8px 24px rgba(16,185,129,.4)", animation:"pmBounceIn 420ms cubic-bezier(.34,1.56,.64,1)" }}>
                <CheckCircle size={38} color="#fff" />
              </div>
              <div>
                <h3 style={{ fontSize:22, fontWeight:800, color:"#0f172a", margin:0 }}>Thanh toán thành công! 🎉</h3>
                <p style={{ fontSize:13, color:"#64748b", marginTop:6 }}>
                  Đã chi trả&nbsp;
                  <strong style={{ color:"#059669" }}>{formatMoney(totalNet)} đ</strong>
                  &nbsp;cho&nbsp;
                  <strong style={{ color:"#1e293b" }}>{count} nhân viên</strong>
                </p>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, width:"100%" }}>
                <div style={{ borderRadius:12, background:"#f0fdf4", border:"1px solid #bbf7d0", padding:14, textAlign:"center" }}>
                  <p style={{ fontSize:10, fontWeight:700, textTransform:"uppercase", letterSpacing:.06, color:"#16a34a", margin:"0 0 4px" }}>Nhân viên</p>
                  <p style={{ fontSize:26, fontWeight:800, color:"#15803d", fontFamily:"monospace", margin:0 }}>{count}</p>
                </div>
                <div style={{ borderRadius:12, background:"#eef2ff", border:"1px solid #c7d2fe", padding:14, textAlign:"center" }}>
                  <p style={{ fontSize:10, fontWeight:700, textTransform:"uppercase", letterSpacing:.06, color:"#4f46e5", margin:"0 0 4px" }}>Tổng chi</p>
                  <p style={{ fontSize:14, fontWeight:800, color:"#3730a3", fontFamily:"monospace", margin:0 }}>{formatMoney(totalNet)}đ</p>
                </div>
              </div>
              <button
                onClick={onClose}
                style={{ width:"100%", height:44, border:"none", borderRadius:12, fontSize:14, fontWeight:700, color:"#fff", cursor:"pointer", background:"linear-gradient(135deg,#6366f1,#8b5cf6)", boxShadow:"0 4px 14px rgba(99,102,241,.35)", display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}
              >
                <Sparkles size={15} /> Hoàn thành
              </button>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes pmScaleIn  { from{transform:scale(.8);opacity:0} to{transform:scale(1);opacity:1} }
        @keyframes pmBounceIn { from{transform:scale(.4);opacity:0} to{transform:scale(1);opacity:1} }
        @keyframes pmSpin     { to{transform:rotate(360deg)} }
        @keyframes shimmerBtn {
          0%{background-position:-200% center}
          100%{background-position:200% center}
        }
      `}</style>
    </>
  );
}

// ─── Main ───────────────────────────────────────────────────────────────────────
export default function PayrollPage() {
  const today = new Date();
  const [month, setMonth]         = useState(today.toISOString().slice(0, 7));
  const [payrolls, setPayrolls]   = useState([]);
  const [loading, setLoading]     = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [approving, setApproving] = useState(false);
  const [paying, setPaying]       = useState(false);
  const [message, setMessage]     = useState({ type: "", text: "" });
  const [showPayModal, setShowPayModal] = useState(false);

  useEffect(() => { fetchPayrolls(); }, [month]);

  const fetchPayrolls = async () => {
    try { setLoading(true); const r = await payrollService.getPayrolls(month); if (r.data.success) setPayrolls(r.data.data); }
    catch { setPayrolls([]); }
    finally { setLoading(false); }
  };

  const handleCalculate = async () => {
    const [y, m] = month.split("-");
    if (!window.confirm(`Tính lương nháp cho Tháng ${m}/${y}?\nDữ liệu nháp cũ sẽ bị ghi đè.`)) return;
    try {
      setCalculating(true); setMessage({ type: "", text: "" });
      const r = await payrollService.calculatePayroll(month);
      if (r.data.success) { setMessage({ type: "success", text: r.data.message }); fetchPayrolls(); }
    } catch (e) {
      setMessage({ type: "error", text: e.response?.data?.message || "Có lỗi xảy ra khi tính lương" });
    } finally { setCalculating(false); }
  };

  const handleApprove = async () => {
    const [y, m] = month.split("-");
    if (!window.confirm(`Duyệt toàn bộ bảng lương nháp Tháng ${m}/${y}?`)) return;
    try {
      setApproving(true); setMessage({ type: "", text: "" });
      const r = await payrollService.approvePayroll(month);
      if (r.data.success) { setMessage({ type: "success", text: r.data.message }); fetchPayrolls(); }
    } catch (e) {
      setMessage({ type: "error", text: e.response?.data?.message || "Có lỗi xảy ra khi duyệt lương" });
    } finally { setApproving(false); }
  };

  const handlePay = async () => {
    setPaying(true);
    try {
      const r = await payrollService.payPayroll(month);
      if (r.data.success) { setMessage({ type: "success", text: r.data.message }); fetchPayrolls(); }
    } catch (e) {
      setMessage({ type: "error", text: e.response?.data?.message || "Lỗi khi thanh toán lương" });
      throw e;
    } finally { setPaying(false); }
  };

  const [y, m] = month.split("-");
  const monthLabel  = `Tháng ${m}/${y}`;
  const totalNet    = payrolls.reduce((s, p) => s + Number(p.net_salary || 0), 0);
  const totalTax    = payrolls.reduce((s, p) => s + Number(p.tax || 0), 0);
  const hasDraft    = payrolls.some(p => p.status === "draft");
  const approvedList = payrolls.filter(p => p.status === "approved");
  const hasApproved = approvedList.length > 0;
  const approvedNet = approvedList.reduce((s, p) => s + Number(p.net_salary || 0), 0);
  const busy = calculating || approving || paying;

  return (
    <>
      <style>{`
        @keyframes shimmerBtn {
          0%{background-position:-200% center} 100%{background-position:200% center}
        }
        .pay-btn-active {
          background: linear-gradient(90deg,#6366f1 0%,#a855f7 40%,#ec4899 60%,#6366f1 100%);
          background-size: 200% auto;
          animation: shimmerBtn 2.2s linear infinite;
          box-shadow: 0 4px 16px rgba(99,102,241,.4);
        }
        .pay-btn-active:hover { filter: brightness(1.08); }
        .pay-btn-active:active { transform: scale(.96); }
        @keyframes pmScaleIn  { from{transform:scale(.8);opacity:0} to{transform:scale(1);opacity:1} }
        @keyframes pmBounceIn { from{transform:scale(.4);opacity:0} to{transform:scale(1);opacity:1} }
      `}</style>

      <PaymentModal
        visible={showPayModal}
        count={approvedList.length}
        totalNet={approvedNet}
        onConfirm={handlePay}
        onClose={() => { if (!paying) { setShowPayModal(false); fetchPayrolls(); } }}
        paying={paying}
      />

      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-[22px] font-semibold text-gray-900 tracking-[-0.01em]">Tính lương tháng</h1>
            <p className="text-sm text-gray-500 mt-0.5">Hệ thống tự nhận loại nhân sự và áp dụng công thức tương ứng</p>
          </div>
          <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
            <input type="month" value={month} onChange={e => setMonth(e.target.value)}
              className="h-9 px-3 text-[13px] border border-gray-300 rounded-md bg-white focus:outline-none focus:border-navy-700" />

            <button onClick={handleCalculate} disabled={busy}
              className="h-9 px-4 flex items-center gap-1.5 text-[13px] font-semibold bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-md transition-colors disabled:opacity-60">
              {calculating ? <RefreshCw size={14} className="animate-spin" /> : <Calculator size={14} />}
              Tính nháp
            </button>

            <button onClick={handleApprove} disabled={busy || !hasDraft}
              className="h-9 px-4 flex items-center gap-1.5 text-[13px] font-semibold bg-navy-700 hover:bg-navy-800 text-white rounded-md transition-colors disabled:opacity-60">
              {approving ? <RefreshCw size={14} className="animate-spin" /> : <CheckSquare size={14} />}
              Duyệt bảng lương
            </button>

            {/* ── Thanh toán lương ── */}
            <button
              onClick={() => setShowPayModal(true)}
              disabled={busy || !hasApproved}
              className={`h-9 px-4 flex items-center gap-1.5 text-[13px] font-bold text-white rounded-md transition-all disabled:opacity-40 disabled:cursor-not-allowed ${hasApproved && !busy ? "pay-btn-active" : "bg-gray-300"}`}
            >
              <CreditCard size={14} />
              Thanh toán lương
              {hasApproved && (
                <span className="ml-1 bg-white/30 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">
                  {approvedList.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Message */}
        {message.text && (
          <div className={`flex items-center gap-2 border-l-[3px] rounded-md px-4 py-3 text-[13px] ${message.type === "success" ? "border-success-500 bg-success-50 text-success-700" : "border-danger-500 bg-danger-50 text-danger-700"}`}>
            {message.type === "success" && <CheckCircle size={14} />}
            {message.text}
          </div>
        )}

        {/* KPI cards */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <p className="text-[10px] font-semibold uppercase tracking-[.06em] text-gray-500 mb-2">Số nhân viên</p>
            <p className="font-mono tabular-nums text-[32px] font-bold text-gray-900 leading-none">{payrolls.length}</p>
            <p className="text-[12px] text-gray-400 mt-1">nhân sự được tính lương</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <p className="text-[10px] font-semibold uppercase tracking-[.06em] text-gray-500 mb-2">Tổng thực nhận</p>
            <p className="font-mono tabular-nums text-[22px] font-bold text-success-700 leading-none">
              {payrolls.length > 0 ? `${formatMoney(totalNet)} đ` : "—"}
            </p>
            <p className="text-[12px] text-gray-400 mt-1">sau khấu trừ thuế & bảo hiểm</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <p className="text-[10px] font-semibold uppercase tracking-[.06em] text-gray-500 mb-2">Tổng thuế TNCN</p>
            <p className="font-mono tabular-nums text-[22px] font-bold text-danger-600 leading-none">
              {payrolls.length > 0 ? `${formatMoney(totalTax)} đ` : "—"}
            </p>
            <p className="text-[12px] text-gray-400 mt-1">phải khấu trừ nộp ngân sách</p>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <Users size={15} strokeWidth={1.75} className="text-gray-500" />
              <h2 className="text-[15px] font-semibold text-gray-900">Bảng lương {monthLabel}</h2>
            </div>
            <Badge variant="neutral">{payrolls.length} nhân viên</Badge>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  {["Nhân viên","Loại NS","Lương cơ bản","BH nhân viên","Thuế TNCN","Khấu trừ khác","Thực nhận","Trạng thái"].map((col, i) => (
                    <th key={col} className={`h-11 px-4 text-[11px] font-semibold uppercase tracking-[.04em] text-gray-400 whitespace-nowrap ${i > 1 ? "text-right" : ""}`}>{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={8} className="px-5 py-10 text-center text-[13px] text-gray-400">
                    <RefreshCw size={18} className="animate-spin mx-auto mb-2 text-gray-300" />Đang tải dữ liệu...
                  </td></tr>
                ) : payrolls.length === 0 ? (
                  <tr><td colSpan={8} className="px-5 py-10 text-center text-[13px] text-gray-400">
                    Chưa có dữ liệu lương cho {monthLabel}.<br />
                    <span className="text-[12px]">Bấm <strong>"Tính nháp"</strong> để tính toán.</span>
                  </td></tr>
                ) : (
                  payrolls.map(pr => {
                    const empType   = pr.employee_type || "Full-time";
                    const typeCfg   = TYPE_BADGE[empType]  || TYPE_BADGE["Full-time"];
                    const statusCfg = STATUS_BADGE[pr.status] || STATUS_BADGE.draft;
                    return (
                      <tr key={pr.id} className={`h-14 border-b border-gray-100 transition-colors ${pr.status === "paid" ? "bg-emerald-50/50" : "hover:bg-gray-50"}`}>
                        <td className="px-4">
                          <div className="flex items-center gap-2.5">
                            <Avatar name={pr.user?.name || pr.user?.email} size="sm" />
                            <div>
                              <p className="text-[13px] font-medium text-gray-900">{pr.user?.name || "Chưa có tên"}</p>
                              <p className="text-[11px] text-gray-400">{pr.user?.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4"><Badge variant={typeCfg.variant}>{typeCfg.label}</Badge></td>
                        <td className="px-4 text-right font-mono text-[13px] text-gray-700">{formatMoney(pr.base_salary)}</td>
                        <td className="px-4 text-right font-mono text-[13px] text-danger-600">{Number(pr.insurance_employee) > 0 ? `-${formatMoney(pr.insurance_employee)}` : "—"}</td>
                        <td className="px-4 text-right font-mono text-[13px] text-danger-600">{Number(pr.tax) > 0 ? `-${formatMoney(pr.tax)}` : "—"}</td>
                        <td className="px-4 text-right font-mono text-[13px] text-danger-600">{Number(pr.deduction) > 0 ? `-${formatMoney(pr.deduction)}` : "—"}</td>
                        <td className="px-4 text-right font-mono text-[13px] font-semibold text-success-700">{formatMoney(pr.net_salary)} đ</td>
                        <td className="px-4 text-center"><Badge variant={statusCfg.variant}>{statusCfg.label}</Badge></td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
