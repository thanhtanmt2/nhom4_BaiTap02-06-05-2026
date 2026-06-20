import { useState, useEffect } from 'react';
import { Download, Mail, Search, CheckCircle, AlertCircle, RefreshCw, Loader2 } from 'lucide-react';
import accountantService from '../../services/accountant.service';
import Avatar from '../../components/ui/Avatar';
import Badge from '../../components/ui/Badge';

const currentYear = new Date().getFullYear();
const toNum = (v) => Number(v) || 0;

const AccountantPayroll = () => {
  const [payrolls, setPayrolls] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [sendingId, setSendingId] = useState(null); // Track which row is sending
  const [batchSending, setBatchSending] = useState(false);
  
  const currentDate = new Date();
  const [month, setMonth] = useState(currentDate.getMonth() + 1);
  const [year, setYear] = useState(currentDate.getFullYear());
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchPayrolls();
  }, [month, year]);

  const fetchPayrolls = async () => {
    setLoading(true);
    setError('');
    setSuccessMsg('');
    try {
      const res = await accountantService.getPayrolls(month, year);
      setPayrolls(res.data?.payrolls || []);
    } catch (err) {
      console.error(err);
      setError('Lỗi khi tải danh sách bảng lương');
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = async () => {
    try {
      setSuccessMsg('');
      setError('');
      const res = await accountantService.exportBankFile(month, year);
      const url = window.URL.createObjectURL(res.data);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Bank_Export_T${month}_${year}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      setSuccessMsg('Xuất file Excel thành công!');
    } catch (err) {
      console.error(err);
      setError('Lỗi khi xuất file hoặc không có dữ liệu hợp lệ.');
    }
  };

  const handleSendPayslip = async (id) => {
    try {
      setSendingId(id); // Show spinner on this row
      setSuccessMsg('');
      setError('');
      await accountantService.sendPayslip(id);
      setSuccessMsg('Gửi phiếu lương thành công!');
      fetchPayrolls();
    } catch (err) {
      console.error(err);
      setError('Lỗi khi gửi phiếu lương.');
    } finally {
      setSendingId(null);
    }
  };

  const handleSendBatch = async () => {
    if (!window.confirm(`Bạn có chắc muốn gửi toàn bộ phiếu lương tháng ${month}/${year} chưa được gửi không?`)) return;
    
    try {
      setBatchSending(true);
      setSuccessMsg('');
      setError('');
      const res = await accountantService.sendBatchPayslips(month, year);
      setSuccessMsg(res.data.message || 'Gửi hàng loạt thành công!');
      fetchPayrolls();
    } catch (err) {
      console.error(err);
      setError('Lỗi khi gửi phiếu lương hàng loạt.');
    } finally {
      setBatchSending(false);
    }
  };

  const filtered = payrolls.filter(p => {
    const q = search.toLowerCase();
    const name = p.user?.Profile?.full_name || p.user?.email || '';
    return !q || name.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-semibold text-gray-900 tracking-[-0.01em]">Quản lý bảng lương</h1>
          <p className="text-sm text-gray-500 mt-0.5">Tháng {month}/{year}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button 
            onClick={handleExportCSV}
            className="h-9 px-3 flex items-center gap-1.5 text-[13px] font-medium border border-gray-300 rounded-md bg-white text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Download size={14} /> Xuất Excel Ngân hàng
          </button>
          <button 
            onClick={handleSendBatch}
            disabled={batchSending}
            className="h-9 px-4 flex items-center gap-1.5 text-[13px] font-semibold bg-accent-600 hover:bg-accent-700 text-white rounded-md transition-colors disabled:opacity-60"
          >
            {batchSending ? <Loader2 size={14} className="animate-spin" /> : <Mail size={14} />}
            {batchSending ? 'Đang gửi...' : 'Gửi tất cả Payslip'}
          </button>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="border-l-[3px] border-danger-500 bg-danger-50 rounded-md px-4 py-3 text-[13px] text-danger-700 flex items-center gap-2">
          <AlertCircle size={16} /> {error}
        </div>
      )}
      {successMsg && (
        <div className="border-l-[3px] border-success-500 bg-success-50 rounded-md px-4 py-3 text-[13px] text-success-700 flex items-center gap-2">
          <CheckCircle size={16} /> {successMsg}
        </div>
      )}

      {/* Toolbar */}
      <div className="bg-white border border-gray-200 rounded-lg px-4 py-3 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
            placeholder="Tìm theo tên nhân viên..."
            className="w-full h-9 pl-9 pr-3 text-[13px] border border-gray-300 rounded-md focus:outline-none focus:border-navy-700 transition-colors" 
          />
        </div>
        <div className="flex items-center gap-2">
          <select value={month} onChange={e => setMonth(Number(e.target.value))} className="h-9 px-3 text-[13px] border border-gray-300 rounded-md">
            {Array.from({length: 12}).map((_, i) => (
              <option key={i+1} value={i+1}>Tháng {i+1}</option>
            ))}
          </select>
          <select value={year} onChange={e => setYear(Number(e.target.value))} className="h-9 px-3 text-[13px] border border-gray-300 rounded-md">
            {[currentYear - 1, currentYear, currentYear + 1].map(y => (
              <option key={y} value={y}>Năm {y}</option>
            ))}
          </select>
          <button onClick={fetchPayrolls} className="h-9 w-9 flex items-center justify-center text-gray-500 border border-gray-300 rounded-md hover:bg-gray-50">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                {['Nhân viên', 'Lương CB', 'Phụ cấp', 'Khấu trừ', 'Thực lãnh', 'Trạng thái', 'Payslip', ''].map(col => (
                  <th key={col} className="h-10 px-4 text-left text-[11px] font-semibold uppercase tracking-[.04em] text-gray-400 whitespace-nowrap">{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400 text-sm">Đang tải...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400 text-sm">Chưa có dữ liệu bảng lương tháng này.</td></tr>
              ) : (
                filtered.map(p => {
                  const displayName = p.user?.Profile?.full_name || p.user?.email || 'N/A';
                  const isSending = sendingId === p.id;
                  return (
                    <tr key={p.id} className="h-14 border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="px-4">
                        <div className="flex items-center gap-2.5">
                          <Avatar name={displayName} size="sm" />
                          <span className="text-[13px] font-medium text-gray-900">{displayName}</span>
                        </div>
                      </td>
                      <td className="px-4 text-[13px] text-gray-600">{Number(p.base_salary).toLocaleString()} đ</td>
                      <td className="px-4 text-[13px] text-gray-600">{(toNum(p.allowances) + toNum(p.bonuses)).toLocaleString()} đ</td>
                      <td className="px-4 text-[13px] text-danger-600">-{(toNum(p.deductions) + toNum(p.tax) + toNum(p.insurance)).toLocaleString()} đ</td>
                      <td className="px-4 text-[13px] font-semibold text-success-600">{Number(p.net_salary).toLocaleString()} đ</td>
                      <td className="px-4">
                        <Badge variant={p.status === 'approved' ? 'success' : p.status === 'paid' ? 'brand' : 'neutral'} size="sm">
                          {p.status === 'approved' ? 'Đã duyệt' : p.status === 'paid' ? 'Đã thanh toán' : 'Chờ duyệt'}
                        </Badge>
                      </td>
                      <td className="px-4">
                        {p.is_payslip_sent ? (
                          <Badge variant="success" size="sm">Đã gửi</Badge>
                        ) : (
                          <Badge variant="warning" size="sm">Chưa gửi</Badge>
                        )}
                      </td>
                      <td className="px-4 text-right">
                        <button 
                          onClick={() => handleSendPayslip(p.id)}
                          className="inline-flex items-center gap-1 text-[12px] text-accent-600 hover:text-accent-700 font-medium transition-colors disabled:opacity-50"
                          disabled={p.is_payslip_sent || isSending}
                        >
                          {isSending ? (
                            <>
                              <Loader2 size={12} className="animate-spin" />
                              Đang gửi...
                            </>
                          ) : (
                            'Gửi Mail'
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AccountantPayroll;
