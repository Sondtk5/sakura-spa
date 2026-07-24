import { useState, useMemo } from 'react';
import { useAuth } from '../components/AuthProvider';
import type { AppUser, UserRole } from '../types/auth';
import { ROLE_LABELS, DEFAULT_ADMIN } from '../types/auth';
import { generateId } from '../components/Shared';
import { Shield, UserPlus, Edit3, Trash2, Search, Key, X, Check, Users } from 'lucide-react';

export function UserManagement() {
  const { users, addUser, updateUser, deleteUser } = useAuth();
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const emptyForm = { username: '', password: '', fullName: '', email: '', phone: '', role: 'SALES' as UserRole };
  const [form, setForm] = useState(emptyForm);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return users.filter(u =>
      u.username.toLowerCase().includes(q) ||
      u.fullName.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.phone.includes(q)
    );
  }, [search, users]);

  const handleAdd = () => {
    if (!form.username.trim() || !form.password.trim() || !form.fullName.trim()) return;
    const exists = users.find(u => u.username === form.username.trim());
    if (exists) return;
    const newUser: AppUser = {
      id: generateId(),
      username: form.username.trim(),
      password: form.password,
      fullName: form.fullName.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      role: form.role,
      active: true,
      createdAt: new Date().toISOString().split('T')[0],
    };
    addUser(newUser);
    setForm(emptyForm);
    setShowAdd(false);
  };

  const handleEdit = (u: AppUser) => {
    setForm({
      username: u.username,
      password: '',
      fullName: u.fullName,
      email: u.email,
      phone: u.phone,
      role: u.role,
    });
    setEditingId(u.id);
  };

  const handleSaveEdit = () => {
    if (!editingId) return;
    const data: Partial<AppUser> = {
      fullName: form.fullName,
      email: form.email,
      phone: form.phone,
      role: form.role,
    };
    if (form.password.trim()) data.password = form.password;
    updateUser(editingId, data);
    setEditingId(null);
    setForm(emptyForm);
  };

  const handleDelete = (id: string) => {
    if (id === DEFAULT_ADMIN.id) return;
    deleteUser(id);
    setDeleteConfirm(null);
  };

  const roleColors: Record<UserRole, string> = {
    ADMIN: 'gold',
    SALES: 'info',
    WAREHOUSE: 'warning',
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white font-serif flex items-center gap-2">
            <Shield className="w-6 h-6 text-gold-400" /> Quản lý nhân viên
          </h1>
          <p className="text-white/50 text-sm mt-1">{users.length} tài khoản</p>
        </div>
        <button
          onClick={() => { setForm(emptyForm); setShowAdd(true); }}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-sakura-500 to-rose-500 text-white rounded-xl text-sm font-medium hover:opacity-90 transition shadow-lg shadow-sakura-500/20"
        >
          <UserPlus className="w-4 h-4" /> Thêm nhân viên
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Tìm theo tên, tài khoản, email..."
          className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-sakura-400/50"
        />
      </div>

      <div className="bg-sakura-card rounded-2xl border border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-white/5 border-b border-white/10">
                <th className="text-left px-4 py-3 text-white/50 font-medium">Tài khoản</th>
                <th className="text-left px-4 py-3 text-white/50 font-medium">Họ tên</th>
                <th className="text-left px-4 py-3 text-white/50 font-medium hidden sm:table-cell">Email</th>
                <th className="text-left px-4 py-3 text-white/50 font-medium hidden md:table-cell">SĐT</th>
                <th className="text-left px-4 py-3 text-white/50 font-medium">Vai trò</th>
                <th className="text-left px-4 py-3 text-white/50 font-medium hidden md:table-cell">Trạng thái</th>
                <th className="text-right px-4 py-3 text-white/50 font-medium">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.map(u => (
                <tr key={u.id} className="hover:bg-white/5 transition">
                  <td className="px-4 py-3">
                    <div className="text-white font-medium">{u.username}</div>
                  </td>
                  <td className="px-4 py-3 text-white/80">{u.fullName}</td>
                  <td className="px-4 py-3 text-white/60 hidden sm:table-cell">{u.email || '—'}</td>
                  <td className="px-4 py-3 text-white/60 hidden md:table-cell">{u.phone || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      u.role === 'ADMIN' ? 'bg-gold-500/20 text-gold-400' :
                      u.role === 'SALES' ? 'bg-blue-500/20 text-blue-300' :
                      'bg-amber-500/20 text-amber-300'
                    }`}>
                      {ROLE_LABELS[u.role]}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className={`inline-flex items-center gap-1 text-xs ${u.active ? 'text-emerald-300' : 'text-rose-300'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${u.active ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                      {u.active ? 'Hoạt động' : 'Vô hiệu'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => handleEdit(u)}
                        className="p-1.5 rounded-lg bg-white/10 text-white/60 hover:text-white hover:bg-white/20 transition"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      {u.id !== DEFAULT_ADMIN.id && (
                        <button
                          onClick={() => setDeleteConfirm(u.id)}
                          className="p-1.5 rounded-lg bg-white/10 text-rose-400 hover:text-rose-300 hover:bg-rose-500/20 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="text-center py-12 text-white/40">
            <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Không tìm thấy nhân viên</p>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {(showAdd || editingId) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop" onClick={() => { setShowAdd(false); setEditingId(null); }}>
          <div className="bg-gradient-to-br from-[#2d1b2e] to-[#3d1f2e] border border-white/10 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-fade-in" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-white/10">
              <h3 className="text-lg font-semibold text-white font-serif">
                {editingId ? 'Sửa nhân viên' : 'Thêm nhân viên mới'}
              </h3>
              <button onClick={() => { setShowAdd(false); setEditingId(null); setForm(emptyForm); }} className="text-white/50 hover:text-white p-1 rounded-lg hover:bg-white/10 transition">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="col-span-1">
                  <label className="block text-sm text-white/60 mb-1">Tên đăng nhập *</label>
                  <input
                    type="text"
                    value={form.username}
                    onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                    placeholder="username"
                    disabled={!!editingId}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-sakura-400/50 disabled:opacity-50"
                  />
                </div>
                <div className="col-span-1">
                  <label className="block text-sm text-white/60 mb-1">{editingId ? 'Mật khẩu mới (để trống nếu giữ nguyên)' : 'Mật khẩu *'}</label>
                  <input
                    type="text"
                    value={form.password}
                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                    placeholder="••••••"
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-sakura-400/50"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-white/60 mb-1">Họ tên *</label>
                  <input
                    type="text"
                    value={form.fullName}
                    onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))}
                    placeholder="Nguyễn Văn A"
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-sakura-400/50"
                  />
                </div>
                <div>
                  <label className="block text-sm text-white/60 mb-1">Vai trò</label>
                  <select
                    value={form.role}
                    onChange={e => setForm(f => ({ ...f, role: e.target.value as UserRole }))}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-sakura-400/50"
                  >
                    <option value="ADMIN">Quản trị viên</option>
                    <option value="SALES">Nhân viên bán hàng</option>
                    <option value="WAREHOUSE">Nhân viên kho</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-white/60 mb-1">Email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    placeholder="email@example.com"
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-sakura-400/50"
                  />
                </div>
                <div>
                  <label className="block text-sm text-white/60 mb-1">Số điện thoại</label>
                  <input
                    type="text"
                    value={form.phone}
                    onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                    placeholder="0900 000 000"
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-sakura-400/50"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={editingId ? handleSaveEdit : handleAdd}
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-sakura-500 to-rose-500 text-white rounded-xl text-sm font-medium hover:opacity-90 transition shadow-lg shadow-sakura-500/20 flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4" /> {editingId ? 'Lưu thay đổi' : 'Thêm nhân viên'}
                </button>
                <button
                  onClick={() => { setShowAdd(false); setEditingId(null); setForm(emptyForm); }}
                  className="px-4 py-2.5 bg-white/10 text-white/70 rounded-xl text-sm hover:bg-white/20 transition"
                >
                  Hủy
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop" onClick={() => setDeleteConfirm(null)}>
          <div className="bg-gradient-to-br from-[#2d1b2e] to-[#3d1f2e] border border-white/10 rounded-2xl shadow-2xl w-full max-w-sm animate-fade-in" onClick={e => e.stopPropagation()}>
            <div className="p-5 text-center">
              <Trash2 className="w-10 h-10 text-rose-400 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-white mb-2">Xác nhận xóa</h3>
              <p className="text-sm text-white/60">Bạn có chắc chắn muốn xóa nhân viên này?</p>
              <div className="flex gap-3 mt-6">
                <button onClick={() => handleDelete(deleteConfirm)} className="flex-1 px-4 py-2.5 bg-rose-500/80 text-white rounded-xl text-sm font-medium hover:bg-rose-500 transition">
                  Xóa
                </button>
                <button onClick={() => setDeleteConfirm(null)} className="flex-1 px-4 py-2.5 bg-white/10 text-white/70 rounded-xl text-sm hover:bg-white/20 transition">
                  Hủy
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}