import React, { useState, useEffect } from 'react';
import { AlertCircle, Save, ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import performanceService from '../../services/performance.service';
import Avatar from '../../components/ui/Avatar';
import Badge from '../../components/ui/Badge';

const RATING_CONFIG = {
  A: { label: 'Xuất sắc', variant: 'success' },
  B: { label: 'Tốt',       variant: 'brand' },
  C: { label: 'Khá',       variant: 'info' },
  D: { label: 'Cần cố gắng', variant: 'warning' },
};

const FILTER_TABS = ['Tất cả', 'Chờ đánh giá', 'Đã chốt', 'Cần chú ý'];

const EmployeeEvaluation = () => {
  const [formData, setFormData] = useState({
    user_id: '',
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    rating: 'A',
    kpi_score: '',
    comments: ''
  });
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('success');
  const [employees, setEmployees] = useState([]);
  const [filterTab, setFilterTab] = useState('Tất cả');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { fetchEmployees(); }, [formData.month, formData.year]);

  const fetchEmployees = async () => {
    try {
      const res = await performanceService.getAllEmployees({ month: formData.month, year: formData.year });
      if (res.data?.employees) setEmployees(res.data.employees);
      else if (res.data?.success && Array.isArray(res.data.data)) setEmployees(res.data.data);
      else if (Array.isArray(res.data)) setEmployees(res.data);
      else setEmployees([]);
    } catch {
      setEmployees([]);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    let updates = { [name]: value };

    // Tự động tính xếp loại dựa trên điểm KPI
    if (name === 'kpi_score') {
      const kpi = parseFloat(value);
      if (!isNaN(kpi)) {
        if (kpi >= 90) updates.rating = 'A';
        else if (kpi >= 70) updates.rating = 'B';
        else if (kpi >= 50) updates.rating = 'C';
        else updates.rating = 'D';
      }
    }

    setFormData(prev => ({ ...prev, ...updates }));
  };

  const handleMonthChange = (delta) => {
    setFormData(prev => {
      let m = prev.month + delta;
      let y = prev.year;
      if (m > 12) { m = 1; y += 1; }
      else if (m < 1) { m = 12; y -= 1; }
      return { ...prev, month: m, year: y };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage('');

    const kpi = parseFloat(formData.kpi_score);
    if (isNaN(kpi) || kpi < 0 || kpi > 100) {
      setMessage('Điểm KPI phải trong khoảng từ 0 đến 100.');
      setMessageType('error');
      setSubmitting(false);
      return;
    }

    try {
      await performanceService.submitReview({
        ...formData,
        user_id: parseInt(formData.user_id),
        month: parseInt(formData.month),
        year: parseInt(formData.year),
        kpi_score: kpi
      });
      setMessage('Đánh giá đã được lưu thành công!');
      setMessageType('success');
      setFormData(prev => ({ ...prev, user_id: '', kpi_score: '', comments: '' }));
      
      // Reload danh sách nhân viên để cập nhật trạng thái mới
      fetchEmployees();
    } catch (error) {
      console.error(error);
      setMessage('Có lỗi xảy ra khi lưu đánh giá.');
      setMessageType('error');
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass = "w-full h-10 px-3 text-[13px] border border-gray-300 rounded-md bg-white placeholder-gray-400 focus:outline-none focus:border-navy-700 focus:ring-2 focus:ring-navy-100 transition-colors";
  const labelClass = "block text-[12px] font-medium text-gray-700 mb-1.5";

  const now = new Date();
  const deadlineDays = 25 - now.getDate();
  const isNearDeadline = deadlineDays >= 0 && deadlineDays <= 7;

  const filteredEmployees = employees.filter(emp => {
    if (filterTab === 'Tất cả') return true;
    if (filterTab === 'Chờ đánh giá') return !emp.latest_rating;
    if (filterTab === 'Đã chốt') return !!emp.latest_rating;
    if (filterTab === 'Cần chú ý') return emp.latest_rating === 'D' || (emp.latest_kpi_score != null && emp.latest_kpi_score < 50);
    return true;
  });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-semibold text-gray-900 tracking-[-0.01em]">Đánh giá KPI</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Tháng {formData.month}/{formData.year} · Nhận xét và chốt điểm nhân viên
          </p>
        </div>
        <div className="flex items-center bg-white border border-gray-200 rounded-lg p-1 shadow-sm shrink-0">
          <button 
            type="button"
            onClick={() => handleMonthChange(-1)}
            className="p-1.5 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
          >
            <ChevronLeft size={16} />
          </button>
          
          <div className="flex items-center justify-center gap-1.5 px-3 min-w-[110px]">
            <Calendar size={14} className="text-gray-400" />
            <span className="text-[13px] font-semibold text-gray-700 tracking-wide">
              Tháng {formData.month}/{formData.year}
            </span>
          </div>

          <button 
            type="button"
            onClick={() => handleMonthChange(1)}
            className="p-1.5 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Deadline callout */}
      {isNearDeadline && (
        <div className="flex items-center gap-2 border-l-[3px] border-warning-500 bg-warning-50 rounded-md px-4 py-3 text-[13px] text-warning-700">
          <AlertCircle size={14} strokeWidth={2} className="shrink-0" />
          Còn <strong>{deadlineDays} ngày</strong> đến hạn chốt KPI tháng {formData.month} — hạn chót: 25/{formData.month}
        </div>
      )}

      {/* KPI stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Tổng nhân viên',   value: employees.length,  sub: 'cần đánh giá' },
          { label: 'Đã đánh giá',       value: employees.filter(e => e.latest_rating).length, sub: 'kỳ này', neutral: true },
          { label: 'Chưa đánh giá',     value: employees.length - employees.filter(e => e.latest_rating).length, sub: 'còn lại', warning: (employees.length - employees.filter(e => e.latest_rating).length) > 0 },
        ].map(k => (
          <div key={k.label} className="bg-white border border-gray-200 rounded-lg p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[.06em] text-gray-400 mb-2">{k.label}</p>
            <p className={`font-mono tabular-nums text-[28px] font-bold leading-none tracking-[-0.02em]
              ${k.warning ? 'text-warning-600' : 'text-gray-900'}`}>
              {k.value}
            </p>
            <p className="text-[11px] text-gray-400 mt-1">{k.sub}</p>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1">
        {FILTER_TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setFilterTab(tab)}
            className={`h-8 px-4 text-[12px] font-medium rounded-md transition-colors
              ${filterTab === tab ? 'bg-navy-700 text-white' : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'}`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Message */}
      {message && (
        <div className={`border-l-[3px] rounded-md px-4 py-3 text-[13px]
          ${messageType === 'success'
            ? 'border-success-500 bg-success-50 text-success-700'
            : 'border-danger-500 bg-danger-50 text-danger-700'
          }`}>
          {message}
        </div>
      )}

      <div className="grid grid-cols-3 gap-5 items-start">
        {/* Employee table (left 2 cols) */}
        <div className="col-span-2 bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  {['Nhân viên', 'Email', 'Phòng ban', 'Đánh giá', 'Điểm KPI'].map(col => (
                    <th key={col} className="h-10 px-4 text-left text-[11px] font-semibold uppercase tracking-[.04em] text-gray-400 whitespace-nowrap">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredEmployees.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-[13px] text-gray-400">
                      Không có nhân viên nào.
                    </td>
                  </tr>
                ) : (
                  filteredEmployees.map(emp => (
                    <tr
                      key={emp.id}
                      onClick={() => setFormData(p => ({ ...p, user_id: String(emp.id) }))}
                      className={`h-14 border-b border-gray-100 cursor-pointer transition-colors
                        ${formData.user_id === String(emp.id) ? 'bg-navy-50 border-l-2 border-l-navy-700' : 'hover:bg-gray-50'}`}
                    >
                      <td className="px-4">
                        <div className="flex items-center gap-2.5">
                          <Avatar name={emp.name || emp.email || 'U'} size="sm" />
                          <p className="text-[13px] font-medium text-gray-900">
                            {emp.name || emp.username || '—'}
                          </p>
                        </div>
                      </td>
                      <td className="px-4">
                        <span className="text-[12px] text-gray-500">{emp.email}</span>
                      </td>
                      <td className="px-4">
                        <span className="text-[12px] text-gray-600">{emp.department?.name || emp.department || '—'}</span>
                      </td>
                      <td className="px-4">
                        {emp.latest_rating ? (
                          <Badge variant={RATING_CONFIG[emp.latest_rating]?.variant || 'neutral'} size="sm">
                            {RATING_CONFIG[emp.latest_rating]?.label || emp.latest_rating}
                          </Badge>
                        ) : (
                          <Badge variant="neutral" size="sm">Chưa đánh giá</Badge>
                        )}
                      </td>
                      <td className="px-4">
                        <span className="font-mono tabular-nums text-[13px] font-medium text-gray-800">
                          {emp.latest_kpi_score != null ? emp.latest_kpi_score : '—'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Evaluation form (right 1 col) */}
        <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-lg p-5 space-y-4">
          <h2 className="text-[15px] font-semibold text-gray-900">Nhập đánh giá</h2>

          <div>
            <label className={labelClass}>Nhân viên <span className="text-danger-500">*</span></label>
            <select
              name="user_id"
              value={formData.user_id}
              onChange={handleChange}
              required
              className={inputClass}
            >
              <option value="">-- Chọn nhân viên --</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>
                  {emp.name || emp.username} · #{emp.id}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Xếp loại</label>
              <select
                name="rating"
                value={formData.rating}
                onChange={handleChange}
                disabled
                className={`${inputClass} bg-gray-100 cursor-not-allowed`}
              >
                <option value="A">A · Xuất sắc (≥ 90)</option>
                <option value="B">B · Tốt (70 - 89)</option>
                <option value="C">C · Khá (50 - 69)</option>
                <option value="D">D · Cần cố gắng (&lt; 50)</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Điểm KPI <span className="text-danger-500">*</span></label>
              <input
                type="number"
                name="kpi_score"
                min={0} max={100} step={0.1}
                value={formData.kpi_score}
                onChange={handleChange}
                required
                placeholder="0–100"
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>Nhận xét</label>
            <textarea
              name="comments"
              value={formData.comments}
              onChange={handleChange}
              rows={4}
              placeholder="Điểm mạnh, điểm yếu, cần khắc phục..."
              className="w-full px-3 py-2.5 text-[13px] border border-gray-300 rounded-md bg-white placeholder-gray-400 focus:outline-none focus:border-navy-700 focus:ring-2 focus:ring-navy-100 transition-colors resize-none"
            />
          </div>

          {formData.user_id && formData.rating && (
            <div className="flex items-center gap-2 py-2 px-3 bg-gray-50 border border-gray-200 rounded-md">
              <span className="text-[12px] text-gray-500">Xem trước:</span>
              <Badge variant={RATING_CONFIG[formData.rating]?.variant || 'neutral'} size="sm">
                {RATING_CONFIG[formData.rating]?.label || formData.rating}
              </Badge>
              {formData.kpi_score && (
                <span className="font-mono tabular-nums text-[13px] font-bold text-gray-900 ml-1">
                  {formData.kpi_score} điểm
                </span>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || !formData.user_id || !formData.kpi_score}
            className="w-full h-10 flex items-center justify-center gap-2 bg-accent-600 hover:bg-accent-700 disabled:opacity-60 text-white text-[13px] font-semibold rounded-md transition-colors"
          >
            {submitting ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Save size={14} strokeWidth={2} />
            )}
            {submitting ? 'Đang lưu...' : 'Lưu đánh giá'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default EmployeeEvaluation;
