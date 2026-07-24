import { useState, useMemo } from "react";
import { customers, invoices } from "../data/site";
import type { Customer } from "../data/site";
import { SearchInput, Modal, Badge, EmptyState, generateId, formatCurrency, formatDate } from "../components/Shared";
import { Plus, Search, UserPlus, Edit3, Trash2, Phone, Mail, MapPin, Tag, Calendar, DollarSign, Receipt, Users } from "lucide-react";

export function Customers({ onNavigate }: { onNavigate: (p: string) => void }) {
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState<string | null>(null);
  const [customerList, setCustomerList] = useState(customers);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // New customer form
  const emptyForm = { code: "", name: "", phone: "", email: "", gender: "nữ" as "nam" | "nữ", birthDate: "", address: "", notes: "", tags: "" };
  const [form, setForm] = useState(emptyForm);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return customerList.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.phone.includes(q) ||
      c.code.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q)
    );
  }, [search, customerList]);

  const handleAdd = () => {
    const newC: Customer = {
      id: generateId(),
      code: `KH${String(customerList.length + 1).padStart(3, "0")}`,
      name: form.name,
      phone: form.phone,
      email: form.email,
      gender: form.gender,
      birthDate: form.birthDate,
      address: form.address,
      memberSince: new Date().toISOString().split("T")[0],
      totalSpent: 0,
      visitCount: 0,
      notes: form.notes,
      tags: form.tags ? form.tags.split(",").map(t => t.trim()).filter(Boolean) : [],
    };
    setCustomerList([newC, ...customerList]);
    setShowAdd(false);
    setForm(emptyForm);
  };

  const handleEdit = (id: string) => {
    const c = customerList.find(x => x.id === id);
    if (!c) return;
    setForm({
      code: c.code,
      name: c.name,
      phone: c.phone,
      email: c.email,
      gender: c.gender,
      birthDate: c.birthDate,
      address: c.address,
      notes: c.notes,
      tags: c.tags.join(", "),
    });
    setShowEdit(id);
  };

  const handleSaveEdit = () => {
    if (!showEdit) return;
    setCustomerList(prev => prev.map(c =>
      c.id === showEdit ? {
        ...c,
        name: form.name,
        phone: form.phone,
        email: form.email,
        gender: form.gender,
        birthDate: form.birthDate,
        address: form.address,
        notes: form.notes,
        tags: form.tags ? form.tags.split(",").map(t => t.trim()).filter(Boolean) : [],
      } : c
    ));
    setShowEdit(null);
    setForm(emptyForm);
  };

  const handleDelete = (id: string) => {
    setCustomerList(prev => prev.filter(c => c.id !== id));
    setDeleteConfirm(null);
  };

  const customerInvoices = (customerId: string) => invoices.filter(i => i.customerId === customerId);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white font-serif">Khách hàng</h1>
          <p className="text-white/50 text-sm mt-1">{customerList.length} khách hàng</p>
        </div>
        <button
          onClick={() => { setForm(emptyForm); setShowAdd(true); }}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-sakura-500 to-rose-500 text-white rounded-xl text-sm font-medium hover:opacity-90 transition shadow-lg shadow-sakura-500/20"
        >
          <UserPlus className="w-4 h-4" /> Thêm khách hàng
        </button>
      </div>

      <SearchInput value={search} onChange={setSearch} placeholder="Tìm theo tên, mã, SĐT, email..." />

      {filtered.length === 0 ? (
        <EmptyState message="Không tìm thấy khách hàng" icon={<Users className="w-12 h-12" />} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(c => (
            <div key={c.id} className="bg-sakura-card rounded-2xl border border-white/10 p-5 hover:border-white/20 transition group">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-sakura-400 to-rose-400 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                    {c.name.charAt(0)}
                  </div>
                  <div>
                    <div className="text-white font-semibold">{c.name}</div>
                    <div className="text-xs text-white/40">{c.code}</div>
                  </div>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                  <button onClick={() => handleEdit(c.id)} className="p-1.5 rounded-lg bg-white/10 text-white/60 hover:text-white hover:bg-white/20 transition">
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => setDeleteConfirm(c.id)} className="p-1.5 rounded-lg bg-white/10 text-rose-400 hover:text-rose-300 hover:bg-rose-500/20 transition">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="space-y-1.5 text-sm">
                <div className="flex items-center gap-2 text-white/60">
                  <Phone className="w-3.5 h-3.5" /> {c.phone}
                </div>
                <div className="flex items-center gap-2 text-white/60">
                  <Mail className="w-3.5 h-3.5" /> {c.email}
                </div>
                <div className="flex items-center gap-2 text-white/60">
                  <MapPin className="w-3.5 h-3.5" /> {c.address}
                </div>
              </div>

              <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/10">
                <div className="flex items-center gap-3 text-xs text-white/50">
                  <span className="flex items-center gap-1"><Receipt className="w-3 h-3" /> {customerInvoices(c.id).length} hóa đơn</span>
                  <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" /> {formatCurrency(c.totalSpent)}</span>
                </div>
                <div className="flex gap-1">
                  {c.tags.map(t => <Badge key={t} variant="gold">{t}</Badge>)}
                </div>
              </div>

              <button
                onClick={() => onNavigate(`/customer/${c.id}`)}
                className="mt-3 w-full text-center text-xs text-gold-400 hover:text-gold-300 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition"
              >
                Chi tiết & lịch sử
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add Modal */}
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Thêm khách hàng mới">
        <CustomerForm form={form} setForm={setForm} />
        <div className="flex gap-3 mt-5">
          <button onClick={handleAdd} className="flex-1 px-4 py-2.5 bg-gradient-to-r from-sakura-500 to-rose-500 text-white rounded-xl text-sm font-medium hover:opacity-90 transition">
            Thêm khách hàng
          </button>
          <button onClick={() => setShowAdd(false)} className="px-4 py-2.5 bg-white/10 text-white rounded-xl text-sm hover:bg-white/20 transition">
            Hủy
          </button>
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal open={showEdit !== null} onClose={() => setShowEdit(null)} title="Chỉnh sửa thông tin">
        <CustomerForm form={form} setForm={setForm} />
        <div className="flex gap-3 mt-5">
          <button onClick={handleSaveEdit} className="flex-1 px-4 py-2.5 bg-gradient-to-r from-sakura-500 to-rose-500 text-white rounded-xl text-sm font-medium hover:opacity-90 transition">
            Lưu thay đổi
          </button>
          <button onClick={() => setShowEdit(null)} className="px-4 py-2.5 bg-white/10 text-white rounded-xl text-sm hover:bg-white/20 transition">
            Hủy
          </button>
        </div>
      </Modal>

      {/* Delete Confirm */}
      <Modal open={deleteConfirm !== null} onClose={() => setDeleteConfirm(null)} title="Xác nhận xóa" size="sm">
        <p className="text-white/70 text-sm mb-5">Bạn có chắc chắn muốn xóa khách hàng này? Hành động này không thể hoàn tác.</p>
        <div className="flex gap-3">
          <button onClick={() => deleteConfirm && handleDelete(deleteConfirm)} className="flex-1 px-4 py-2.5 bg-rose-500 text-white rounded-xl text-sm font-medium hover:bg-rose-600 transition">
            Xóa
          </button>
          <button onClick={() => setDeleteConfirm(null)} className="px-4 py-2.5 bg-white/10 text-white rounded-xl text-sm hover:bg-white/20 transition">
            Hủy
          </button>
        </div>
      </Modal>
    </div>
  );
}

function CustomerForm({ form, setForm }: { form: any; setForm: (f: any) => void }) {
  const update = (k: string, v: string) => setForm({ ...form, [k]: v });
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="sm:col-span-2">
        <label className="text-xs text-white/50 mb-1 block">Họ tên *</label>
        <input value={form.name} onChange={e => update("name", e.target.value)} className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-sakura-400/50" />
      </div>
      <div>
        <label className="text-xs text-white/50 mb-1 block">Số điện thoại *</label>
        <input value={form.phone} onChange={e => update("phone", e.target.value)} className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-sakura-400/50" />
      </div>
      <div>
        <label className="text-xs text-white/50 mb-1 block">Email</label>
        <input value={form.email} onChange={e => update("email", e.target.value)} className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-sakura-400/50" />
      </div>
      <div>
        <label className="text-xs text-white/50 mb-1 block">Giới tính</label>
        <select value={form.gender} onChange={e => update("gender", e.target.value)} className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-sakura-400/50">
          <option value="nữ">Nữ</option>
          <option value="nam">Nam</option>
        </select>
      </div>
      <div>
        <label className="text-xs text-white/50 mb-1 block">Ngày sinh</label>
        <input type="date" value={form.birthDate} onChange={e => update("birthDate", e.target.value)} className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-sakura-400/50" />
      </div>
      <div className="sm:col-span-2">
        <label className="text-xs text-white/50 mb-1 block">Địa chỉ</label>
        <input value={form.address} onChange={e => update("address", e.target.value)} className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-sakura-400/50" />
      </div>
      <div className="sm:col-span-2">
        <label className="text-xs text-white/50 mb-1 block">Ghi chú</label>
        <textarea value={form.notes} onChange={e => update("notes", e.target.value)} rows={2} className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-sakura-400/50" />
      </div>
      <div className="sm:col-span-2">
        <label className="text-xs text-white/50 mb-1 block">Tags (cách nhau bằng dấu phẩy)</label>
        <input value={form.tags} onChange={e => update("tags", e.target.value)} placeholder="VD: VIP, Thân thiết, Vàng" className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-sakura-400/50" />
      </div>
    </div>
  );
}

export function CustomerDetail({ customerId, onNavigate }: { customerId: string; onNavigate: (p: string) => void }) {
  const c = customers.find(x => x.id === customerId);
  if (!c) return <EmptyState message="Không tìm thấy khách hàng" />;

  const customerInvoicesList = invoices.filter(i => i.customerId === customerId).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="space-y-6 animate-fade-in">
      <button onClick={() => onNavigate("/customers")} className="text-sm text-white/50 hover:text-white transition flex items-center gap-1">
        ← Quay lại danh sách
      </button>

      <div className="bg-sakura-card rounded-2xl border border-white/10 p-6">
        <div className="flex items-start gap-4 flex-wrap">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-sakura-400 to-rose-400 flex items-center justify-center text-white font-bold text-2xl shadow-lg">
            {c.name.charAt(0)}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-xl font-bold text-white font-serif">{c.name}</h2>
              <span className="text-xs text-white/40">{c.code}</span>
              {c.tags.map(t => <Badge key={t} variant="gold">{t}</Badge>)}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3 text-sm">
              <div className="flex items-center gap-2 text-white/60"><Phone className="w-3.5 h-3.5" /> {c.phone}</div>
              <div className="flex items-center gap-2 text-white/60"><Mail className="w-3.5 h-3.5" /> {c.email}</div>
              <div className="flex items-center gap-2 text-white/60"><MapPin className="w-3.5 h-3.5" /> {c.address}</div>
              <div className="flex items-center gap-2 text-white/60"><Calendar className="w-3.5 h-3.5" /> Tham gia: {formatDate(c.memberSince)}</div>
              <div className="flex items-center gap-2 text-white/60"><DollarSign className="w-3.5 h-3.5" /> Tổng chi: {formatCurrency(c.totalSpent)}</div>
              <div className="flex items-center gap-2 text-white/60"><Receipt className="w-3.5 h-3.5" /> {c.visitCount} lượt</div>
            </div>
            {c.notes && <div className="mt-3 text-sm text-white/50 italic">📝 {c.notes}</div>}
          </div>
        </div>
      </div>

      <div className="bg-sakura-card rounded-2xl border border-white/10 p-5">
        <h3 className="text-white font-semibold mb-4">Lịch sử hóa đơn</h3>
        {customerInvoicesList.length === 0 ? (
          <p className="text-sm text-white/40">Chưa có hóa đơn</p>
        ) : (
          <div className="space-y-2">
            {customerInvoicesList.map(inv => (
              <div key={inv.id} className="flex items-center justify-between py-2.5 border-b border-white/5 last:border-0">
                <div>
                  <div className="text-sm text-white font-medium">{inv.invoiceNo}</div>
                  <div className="text-xs text-white/50">{formatDate(inv.date)} · {inv.items.length} dịch vụ/Sản phẩm</div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-white">{formatCurrency(inv.total)}</div>
                  <Badge variant={inv.status === "completed" ? "success" : inv.status === "pending" ? "warning" : "danger"}>
                    {inv.status === "completed" ? "Đã thanh toán" : inv.status === "pending" ? "Chờ" : "Hủy"}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}