import { useState, useEffect } from 'react';
import { getMyAdvances, requestAdvance } from '../../services/advance.service';
import { Plus, X, Loader2, Ban, Clock, CheckCircle, Banknote } from 'lucide-react';
import Badge from '../../components/ui/Badge';

const STATUS_CONFIG = {
  pending: { label: 'Chờ duyệt', variant: 'warning', icon: Clock },
  approved: { label: 'Đã duyệt (Chờ chi)', variant: 'success', icon: CheckCircle },
  deducting: { label: 'Đang khấu trừ', variant: 'brand', icon: CheckCircle },
  completed: { label: 'Hoàn tất', variant: 'success', icon: CheckCircle },
  rejected: { label: 'Từ chối', variant: 'danger', icon: Ban },
};

const fmtDate = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const fmtMoney = (val) => {
  if (!val) return '0';
  return Number(val).toLocaleString('vi-VN');
};

const MyAdvances = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [formData, setFormData] = useState({
    amount: '',
    reason: '',
    urgent: false
  });

  const fetchAdvances = async () => {
    try {
      setLoading(true);
      const res = await getMyAdvances();
      setRequests(res.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdvances();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSubmitting(true);
    try {
      await requestAdvance(formData);
      setShowModal(false);
      setFormData({ amount: '', reason: '', urgent: false });
      fetchAdvances();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Có lỗi xảy ra, vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass = "w-full h-10 px-3 text-[13px] border border-gray-300 rounded-md bg-white focus:outline-none focus:border-navy-700 transition-colors";
  const labelClass = "block text-[12px] font-medium text-gray-700 mb-1.5";

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-[22px] font-semibold text-gray-900 tracking-[-0.01em]">Tạm ứng lương</h1>
          <p className="text-[13px] text-gray-500 mt-1">Lịch sử và gửi yêu cầu tạm ứng lương</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="h-9 px-4 flex items-center gap-1.5 text-[13px] font-semibold bg-accent-600 hover:bg-accent-700 text-white rounded-md transition-colors shadow-sm"
        >
          <Plus size={16} />
          Tạo đơn ứng lương
        </button>
      </div>

      {/* List */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="h-10 px-5 text-left text-[11px] font-semibold uppercase tracking-[.04em] text-gray-400 whitespace-nowrap w-32">Mã đơn</th>
                <th className="h-10 px-5 text-left text-[11px] font-semibold uppercase tracking-[.04em] text-gray-400 whitespace-nowrap w-32">Ngày tạo</th>
                <th className="h-10 px-5 text-left text-[11px] font-semibold uppercase tracking-[.04em] text-gray-400 whitespace-nowrap">Số tiền</th>
                <th className="h-10 px-5 text-left text-[11px] font-semibold uppercase tracking-[.04em] text-gray-400 whitespace-nowrap">Lý do</th>
                <th className="h-10 px-5 text-left text-[11px] font-semibold uppercase tracking-[.04em] text-gray-400 whitespace-nowrap w-40">Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="px-5 py-8 text-center text-sm text-gray-400">Đang tải...</td></tr>
              ) : requests.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-[13px] text-gray-400">
                    <Banknote size={32} className="mx-auto mb-3 opacity-20" />
                    Chưa có đơn ứng lương nào.
                  </td>
                </tr>
              ) : (
                requests.map(req => {
                  const st = STATUS_CONFIG[req.status] || STATUS_CONFIG.pending;
                  return (
                    <tr key={req.id} className="h-14 border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="px-5">
                        <span className="font-mono tabular-nums text-[12px] font-medium text-gray-900">{req.code || req.id}</span>
                        {req.urgent && <span className="ml-2 text-[9px] font-bold bg-red-100 text-red-700 px-1.5 py-0.5 rounded">KHẨN</span>}
                      </td>
                      <td className="px-5">
                        <span className="font-mono tabular-nums text-[12px] text-gray-500">{fmtDate(req.created_at)}</span>
                      </td>
                      <td className="px-5">
                        <span className="font-mono tabular-nums text-[13px] font-semibold text-amber-600">{fmtMoney(req.amount)} đ</span>
                      </td>
                      <td className="px-5">
                        <span className="text-[12px] text-gray-600 max-w-[250px] truncate block" title={req.reason}>
                          {req.reason}
                        </span>
                      </td>
                      <td className="px-5">
                        <Badge variant={st.variant} size="sm">{st.label}</Badge>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal create */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-lg shadow-xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
              <h2 className="text-[16px] font-semibold text-gray-900">Tạo đơn ứng lương</h2>
              <button onClick={() => setShowModal(false)} className="w-8 h-8 flex items-center justify-center rounded-md text-gray-400 hover:bg-gray-100 transition-colors">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {errorMsg && (
                <div className="p-3 bg-red-50 text-red-600 text-[13px] rounded-md border border-red-100">
                  {errorMsg}
                </div>
              )}
              
              <div>
                <label className={labelClass}>Số tiền (VNĐ) <span className="text-red-500">*</span></label>
                <input 
                  type="number" 
                  name="amount" 
                  value={formData.amount} 
                  onChange={handleChange} 
                  required 
                  min="1000"
                  placeholder="Ví dụ: 2000000"
                  className={inputClass} 
                />
              </div>

              <div>
                <label className={labelClass}>Lý do <span className="text-red-500">*</span></label>
                <textarea 
                  name="reason" 
                  value={formData.reason} 
                  onChange={handleChange} 
                  required 
                  rows={3}
                  placeholder="Ghi rõ lý do tạm ứng..."
                  className="w-full p-3 text-[13px] border border-gray-300 rounded-md bg-white placeholder-gray-400 focus:outline-none focus:border-navy-700 transition-colors resize-none" 
                />
              </div>

              <div className="flex items-center gap-2 mt-2">
                <input 
                  type="checkbox" 
                  id="urgent" 
                  name="urgent" 
                  checked={formData.urgent} 
                  onChange={handleChange}
                  className="w-4 h-4 text-accent-600 rounded border-gray-300 focus:ring-accent-600"
                />
                <label htmlFor="urgent" className="text-[13px] font-medium text-gray-700 cursor-pointer">
                  Đánh dấu khẩn cấp (Cần gấp)
                </label>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 h-9 border border-gray-300 text-[13px] font-medium text-gray-600 rounded-md hover:bg-gray-50 transition-colors">
                  Hủy
                </button>
                <button type="submit" disabled={submitting} className="flex-1 h-9 bg-accent-600 hover:bg-accent-700 text-white text-[13px] font-semibold rounded-md transition-colors disabled:opacity-60 flex items-center justify-center">
                  {submitting ? <Loader2 size={16} className="animate-spin" /> : 'Gửi yêu cầu'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyAdvances;
