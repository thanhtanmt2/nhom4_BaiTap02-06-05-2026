import { useEffect, useMemo, useState } from 'react';
import { Search, Plus, Pencil, Trash2, X, ClipboardList } from 'lucide-react';
import { taskService } from '../../services/task.service';
import hrService from '../../services/hr.service';
import Avatar from '../../components/ui/Avatar';
import Badge from '../../components/ui/Badge';

const STATUS_BADGE = {
  todo:        { label: 'Cần làm',    variant: 'neutral' },
  in_progress: { label: 'Đang làm',   variant: 'brand' },
  review:      { label: 'Chờ duyệt',  variant: 'warning' },
  done:        { label: 'Hoàn thành', variant: 'success' },
  cancelled:   { label: 'Huỷ',        variant: 'danger' },
};

const PRIORITY_BADGE = {
  low:    { label: 'Thấp',  variant: 'neutral' },
  medium: { label: 'Vừa',   variant: 'info' },
  high:   { label: 'Cao',   variant: 'warning' },
  urgent: { label: 'Khẩn',  variant: 'danger' },
};

const EMPTY_FORM = {
  title: '', description: '', assigned_to_id: '',
  priority: 'medium', due_date: '', status: 'todo',
};

const inputClass = 'w-full h-10 px-3 text-[13px] border border-gray-300 rounded-md bg-white placeholder-gray-400 focus:outline-none focus:border-navy-700 focus:ring-2 focus:ring-navy-100 transition-colors';
const labelClass = 'block text-[12px] font-medium text-gray-700 mb-1.5';

const ManagerTasks = () => {
  const [tasks, setTasks]         = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading]     = useState(false);
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState('');
  const [query, setQuery]         = useState({ search: '', status: '', priority: '' });
  const [showForm, setShowForm]   = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [form, setForm]           = useState(EMPTY_FORM);

  // Chỉ lấy nhân viên có role employee/manager (không giao cho admin/hr/accountant)
  const assigneeOptions = useMemo(
    () => employees.filter(u => ['employee', 'manager', 'user'].includes(u.role) && u.status === 'active'),
    [employees]
  );

  const loadEmployees = async () => {
    try {
      const res = await hrService.getAllEmployees();
      const list = res.data?.employees || res.data?.data || res.data || [];
      setEmployees(Array.isArray(list) ? list : []);
    } catch { /* silent */ }
  };

  const loadTasks = async (filters = query) => {
    setLoading(true);
    setError('');
    try {
      const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== ''));
      const res = await taskService.getAllTasks(params);
      if (res.success) setTasks(res.data || []);
    } catch {
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadEmployees(); loadTasks(); }, []); // eslint-disable-line

  const openCreateForm = () => { setEditingTask(null); setForm(EMPTY_FORM); setShowForm(true); };
  const openEditForm   = (task) => {
    setEditingTask(task);
    setForm({
      title: task.title || '',
      description: task.description || '',
      assigned_to_id: task.assigned_to_id || '',
      priority: task.priority || 'medium',
      due_date: task.due_date ? task.due_date.slice(0, 10) : '',
      status: task.status || 'todo',
    });
    setShowForm(true);
  };
  const closeForm = () => { setShowForm(false); setEditingTask(null); setForm(EMPTY_FORM); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload = {
        ...form,
        assigned_to_id: Number(form.assigned_to_id),
        due_date: form.due_date || null,
      };
      const res = editingTask
        ? await taskService.updateTask(editingTask.id, payload)
        : await taskService.createTask(payload);
      if (res.success) { await loadTasks(); closeForm(); }
    } catch (err) {
      setError(err.response?.data?.message || 'Không lưu được task.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (task) => {
    if (!window.confirm(`Xoá task "${task.title}"?`)) return;
    try {
      const res = await taskService.deleteTask(task.id);
      if (res.success) setTasks(prev => prev.filter(t => t.id !== task.id));
    } catch (err) {
      setError(err.response?.data?.message || 'Không xoá được task.');
    }
  };

  const handleFilterChange = (e) => setQuery(p => ({ ...p, [e.target.name]: e.target.value }));
  const handleSearch = (e) => { e.preventDefault(); loadTasks(query); };
  const handleReset  = () => { const r = { search: '', status: '', priority: '' }; setQuery(r); loadTasks(r); };

  const stats = useMemo(() => ({
    total:    tasks.length,
    done:     tasks.filter(t => t.status === 'done').length,
    active:   tasks.filter(t => ['todo', 'in_progress', 'review'].includes(t.status)).length,
    overdue:  tasks.filter(t => t.due_date && new Date(t.due_date) < new Date() && t.status !== 'done' && t.status !== 'cancelled').length,
  }), [tasks]);

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-semibold text-gray-900 tracking-[-0.01em]">Giao việc team</h1>
          <p className="text-sm text-gray-500 mt-0.5">Tạo và quản lý task cho các thành viên trong nhóm</p>
        </div>
        <button
          onClick={openCreateForm}
          className="h-9 px-4 flex items-center gap-1.5 text-[13px] font-semibold bg-accent-600 hover:bg-accent-700 text-white rounded-md transition-colors active:scale-[.98] shrink-0"
        >
          <Plus size={15} strokeWidth={2.5} /> Tạo task
        </button>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Tổng task',    value: stats.total,   color: 'text-gray-900' },
          { label: 'Đang xử lý',  value: stats.active,  color: 'text-navy-700' },
          { label: 'Hoàn thành',  value: stats.done,    color: 'text-success-600' },
          { label: 'Quá hạn',     value: stats.overdue, color: 'text-danger-600' },
        ].map(k => (
          <div key={k.label} className="bg-white border border-gray-200 rounded-lg p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[.06em] text-gray-400 mb-2">{k.label}</p>
            <p className={`font-mono tabular-nums text-[28px] font-bold leading-none tracking-[-0.02em] ${k.color}`}>
              {k.value}
            </p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <form onSubmit={handleSearch} className="bg-white border border-gray-200 rounded-lg px-4 py-3 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={14} strokeWidth={2} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            name="search" value={query.search} onChange={handleFilterChange}
            placeholder="Tiêu đề hoặc mô tả..."
            className="w-full h-9 pl-9 pr-3 text-[13px] border border-gray-300 rounded-md bg-white placeholder-gray-400 focus:outline-none focus:border-navy-700 focus:ring-2 focus:ring-navy-100 transition-colors"
          />
        </div>
        <select name="status" value={query.status} onChange={handleFilterChange}
          className="h-9 px-3 text-[13px] border border-gray-300 rounded-md bg-white text-gray-700 focus:outline-none focus:border-navy-700 transition-colors">
          <option value="">Tất cả trạng thái</option>
          <option value="todo">Cần làm</option>
          <option value="in_progress">Đang làm</option>
          <option value="review">Chờ duyệt</option>
          <option value="done">Hoàn thành</option>
          <option value="cancelled">Huỷ</option>
        </select>
        <select name="priority" value={query.priority} onChange={handleFilterChange}
          className="h-9 px-3 text-[13px] border border-gray-300 rounded-md bg-white text-gray-700 focus:outline-none focus:border-navy-700 transition-colors">
          <option value="">Tất cả ưu tiên</option>
          <option value="low">Thấp</option>
          <option value="medium">Vừa</option>
          <option value="high">Cao</option>
          <option value="urgent">Khẩn</option>
        </select>
        <button type="submit" className="h-9 px-4 text-[13px] font-medium bg-navy-700 hover:bg-navy-800 text-white rounded-md transition-colors">Lọc</button>
        {(query.search || query.status || query.priority) && (
          <button type="button" onClick={handleReset} className="h-9 px-3 text-[12px] text-gray-500 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors">Xoá lọc</button>
        )}
      </form>

      {/* Error */}
      {error && (
        <div className="border-l-[3px] border-danger-500 bg-danger-50 rounded-md px-4 py-3 text-[13px] text-danger-700">{error}</div>
      )}

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                {['ID', 'Task', 'Nhân viên', 'Ưu tiên', 'Trạng thái', 'Hạn', ''].map(col => (
                  <th key={col} className="h-10 px-4 text-left text-[11px] font-semibold uppercase tracking-[.04em] text-gray-400 whitespace-nowrap">{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-gray-100 animate-pulse">
                    <td className="px-4 py-3"><div className="h-3 w-8 bg-gray-200 rounded" /></td>
                    <td className="px-4 py-3"><div className="h-3 w-40 bg-gray-200 rounded" /></td>
                    <td className="px-4 py-3"><div className="h-3 w-28 bg-gray-200 rounded" /></td>
                    <td className="px-4 py-3"><div className="h-5 w-14 bg-gray-200 rounded" /></td>
                    <td className="px-4 py-3"><div className="h-5 w-18 bg-gray-200 rounded" /></td>
                    <td className="px-4 py-3"><div className="h-3 w-16 bg-gray-200 rounded" /></td>
                    <td className="px-4 py-3" />
                  </tr>
                ))
              ) : tasks.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center">
                    <ClipboardList size={32} strokeWidth={1.25} className="text-gray-300 mx-auto mb-3" />
                    <p className="text-[13px] text-gray-400">Chưa có task nào. Bấm <strong>Tạo task</strong> để bắt đầu.</p>
                  </td>
                </tr>
              ) : (
                tasks.map(task => {
                  const stCfg = STATUS_BADGE[task.status]   || STATUS_BADGE.todo;
                  const prCfg = PRIORITY_BADGE[task.priority] || PRIORITY_BADGE.medium;
                  const isOverdue = task.due_date && new Date(task.due_date) < new Date()
                    && task.status !== 'done' && task.status !== 'cancelled';
                  return (
                    <tr key={task.id} className="h-14 border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="px-4">
                        <span className="font-mono tabular-nums text-[12px] text-gray-400">#{task.id}</span>
                      </td>
                      <td className="px-4 max-w-64">
                        <p className="text-[13px] font-medium text-gray-900 truncate">{task.title}</p>
                        {task.description && (
                          <p className="text-[11px] text-gray-400 truncate">{task.description}</p>
                        )}
                      </td>
                      <td className="px-4">
                        {task.assignee ? (
                          <div className="flex items-center gap-2">
                            <Avatar name={task.assignee.name || task.assignee.email} size="xs" />
                            <span className="text-[12px] text-gray-700">{task.assignee.name || task.assignee.email}</span>
                          </div>
                        ) : <span className="text-[12px] text-gray-400">—</span>}
                      </td>
                      <td className="px-4"><Badge variant={prCfg.variant} size="sm">{prCfg.label}</Badge></td>
                      <td className="px-4"><Badge variant={stCfg.variant} size="sm">{stCfg.label}</Badge></td>
                      <td className="px-4">
                        <span className={`font-mono tabular-nums text-[12px] ${isOverdue ? 'text-danger-600 font-semibold' : 'text-gray-500'}`}>
                          {task.due_date ? new Date(task.due_date).toLocaleDateString('vi-VN') : '—'}
                          {isOverdue && ' ⚠'}
                        </span>
                      </td>
                      <td className="px-4">
                        <div className="flex items-center gap-1">
                          <button onClick={() => openEditForm(task)}
                            className="w-8 h-8 flex items-center justify-center rounded-md text-gray-500 hover:bg-navy-50 hover:text-navy-700 transition-colors">
                            <Pencil size={13} strokeWidth={1.75} />
                          </button>
                          <button onClick={() => handleDelete(task)}
                            className="w-8 h-8 flex items-center justify-center rounded-md text-gray-500 hover:bg-danger-50 hover:text-danger-600 transition-colors">
                            <Trash2 size={13} strokeWidth={1.75} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal form */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-white rounded-lg shadow-xl overflow-hidden">
            <div className="flex items-start justify-between px-6 py-4 border-b border-gray-200">
              <div>
                <h2 className="text-[16px] font-semibold text-gray-900">
                  {editingTask ? 'Chỉnh sửa task' : 'Tạo task mới'}
                </h2>
                <p className="text-[12px] text-gray-400 mt-0.5">Giao việc cho thành viên trong nhóm</p>
              </div>
              <button onClick={closeForm}
                className="w-8 h-8 flex items-center justify-center rounded-md text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors">
                <X size={16} strokeWidth={2} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
              <div>
                <label className={labelClass}>Tiêu đề <span className="text-danger-500">*</span></label>
                <input
                  value={form.title}
                  onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                  required placeholder="Ví dụ: Báo cáo công việc tuần"
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Mô tả</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                  rows={3} placeholder="Mô tả ngắn gọn nội dung cần làm"
                  className="w-full px-3 py-2.5 text-[13px] border border-gray-300 rounded-md bg-white placeholder-gray-400 focus:outline-none focus:border-navy-700 focus:ring-2 focus:ring-navy-100 transition-colors resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Nhân viên <span className="text-danger-500">*</span></label>
                  <select
                    value={form.assigned_to_id}
                    onChange={e => setForm(p => ({ ...p, assigned_to_id: e.target.value }))}
                    required className={inputClass}
                  >
                    <option value="">Chọn nhân viên</option>
                    {assigneeOptions.map(u => (
                      <option key={u.id} value={u.id}>
                        {u.name || u.email}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Ưu tiên</label>
                  <select value={form.priority} onChange={e => setForm(p => ({ ...p, priority: e.target.value }))} className={inputClass}>
                    <option value="low">Thấp</option>
                    <option value="medium">Vừa</option>
                    <option value="high">Cao</option>
                    <option value="urgent">Khẩn</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Hạn hoàn thành</label>
                  <input
                    type="date" value={form.due_date}
                    onChange={e => setForm(p => ({ ...p, due_date: e.target.value }))}
                    className={inputClass}
                  />
                </div>
                {editingTask && (
                  <div>
                    <label className={labelClass}>Trạng thái</label>
                    <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))} className={inputClass}>
                      <option value="todo">Cần làm</option>
                      <option value="in_progress">Đang làm</option>
                      <option value="review">Chờ duyệt</option>
                      <option value="done">Hoàn thành</option>
                      <option value="cancelled">Huỷ</option>
                    </select>
                  </div>
                )}
              </div>

              {error && (
                <p className="text-[12px] text-danger-600 bg-danger-50 px-3 py-2 rounded-md">{error}</p>
              )}

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={closeForm}
                  className="flex-1 h-10 border border-gray-300 text-[13px] font-medium text-gray-600 rounded-md hover:bg-gray-50 transition-colors">
                  Hủy
                </button>
                <button type="submit" disabled={saving}
                  className="flex-1 h-10 bg-accent-600 hover:bg-accent-700 disabled:opacity-60 text-white text-[13px] font-semibold rounded-md transition-colors">
                  {saving ? 'Đang lưu...' : editingTask ? 'Cập nhật' : 'Tạo task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagerTasks;
