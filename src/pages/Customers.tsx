import { useState, useMemo } from "react";
import { customers, invoices, services, products } from "../data/site";
import type { Customer, Invoice, InvoiceItem } from "../data/site";
import { SearchInput, Modal, Badge, EmptyState, generateId, formatCurrency, formatDate } from "../components/Shared";
import { Plus, Search, UserPlus, Edit3, Trash2, Phone, Mail, MapPin, Tag, Calendar, DollarSign, Receipt, Users, Crown, Sparkles, Package, ShoppingCart, X, Minus, MessageCircle } from "lucide-react";

export function Customers({ onNavigate }: { onNavigate: (p: string) => void }) {
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState<string | null>(null);
  const [customerList, setCustomerList] = useState(customers);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const emptyForm = { code: "", name: "", phone: "", email: "", gender: "nữ" as "nam" | "nữ", birthDate: "", address: "", notes: "", tags: "", level: "Thường" as "VIP" | "Vàng" | "Thường" };
  const [form, setForm] = useState(emptyForm);

  // Sort: VIP first (by totalSpent desc), then Vàng, then Thường
  const sortedCustomers = useMemo(() => {
    const levelOrder: Record<string, number> = { VIP: 0, Vàng: 1, Thường: 2 };
    return [...customerList].sort((a, b) => {
      const la = levelOrder[a.level] ?? 2;
      const lb = levelOrder[b.level] ?? 2;
      if (la !== lb) return la - lb;
      return b.totalSpent - a.totalSpent;
    });
  }, [customerList]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return sortedCustomers.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.phone.includes(q) ||
      c.code.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q)
    );
  }, [search, sortedCustomers]);

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
      level: form.level,
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
      level: c.level,
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
        level: form.level,
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

  const levelBadge = (level: string) => {
    const colors: Record<string, { label: string; variant: "gold" | "info" | "default" }> = {
      VIP: { label: "VIP", variant: "gold" },
      Vàng: { label: "Vàng", variant: "info" },
      Thường: { label: "Thường", variant: "default" },
    };
    const info = colors[level] || { label: level, variant: "default" as const };
    return <Badge variant={info.variant}>{level === "VIP" && "👑 "}{info.label}</Badge>;
  };

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
                    <div className="text-white font-semibold flex items-center gap-2">
                      {c.name}
                      {c.level === "VIP" && <Crown className="w-4 h-4 text-gold-400" />}
                    </div>
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
                  <Phone className="w-3.5 h-3.5" />
                  <a href={`tel:${c.phone.replace(/\s/g, "")}`} onClick={e => { e.stopPropagation(); window.open(`tel:${c.phone.replace(/\s/g, "")}`); }}
                    className="text-white/60 hover:text-sakura-300 transition cursor-pointer">{c.phone}</a>
                  <a href={`https://zalo.me/${c.phone.replace(/\s/g, "")}`} target="_blank" rel="noopener noreferrer"
                    onClick={e => e.stopPropagation()}
                    className="text-blue-400 hover:text-blue-300 transition" title="Nhắn Zalo">
                    <MessageCircle className="w-3.5 h-3.5" />
                  </a>
                </div>
                <div className="flex items-center gap-2 text-white/60">
                  <Mail className="w-3.5 h-3.5" />
                  <a href={`mailto:${c.email}`} onClick={e => { e.stopPropagation(); window.open(`mailto:${c.email}`); }}
                    className="text-white/60 hover:text-sakura-300 transition cursor-pointer">{c.email}</a>
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
                <div className="flex gap-1 items-center">
                  {levelBadge(c.level)}
                  {c.tags.slice(0, 1).map(t => <Badge key={t} variant="gold">{t}</Badge>)}
                </div>
              </div>

              <button
                onClick={() => onNavigate(`/customer/${c.id}`)}
                className="mt-3 w-full text-center text-xs text-gold-400 hover:text-gold-300 transition py-1.5 rounded-lg bg-gold-500/5 hover:bg-gold-500/10"
              >
                Xem chi tiết →
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal open={showAdd || showEdit !== null} onClose={() => { setShowAdd(false); setShowEdit(null); }} title={showAdd ? "Thêm khách hàng mới" : "Sửa thông tin khách hàng"}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-white/50 mb-1 block">Họ tên *</label>
            <input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})}
              className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-sakura-400/50" />
          </div>
          <div>
            <label className="text-xs text-white/50 mb-1 block">Số điện thoại *</label>
            <input type="text" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})}
              className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-sakura-400/50" />
          </div>
          <div>
            <label className="text-xs text-white/50 mb-1 block">Email</label>
            <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})}
              className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-sakura-400/50" />
          </div>
          <div>
            <label className="text-xs text-white/50 mb-1 block">Giới tính</label>
            <select value={form.gender} onChange={e => setForm({...form, gender: e.target.value as "nam" | "nữ"})}
              className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-sakura-400/50">
              <option value="nữ">Nữ</option>
              <option value="nam">Nam</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-white/50 mb-1 block">Ngày sinh</label>
            <input type="date" value={form.birthDate} onChange={e => setForm({...form, birthDate: e.target.value})}
              className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-sakura-400/50" />
          </div>
          <div>
            <label className="text-xs text-white/50 mb-1 block">Cấp độ</label>
            <select value={form.level} onChange={e => setForm({...form, level: e.target.value as "VIP" | "Vàng" | "Thường"})}
              className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-sakura-400/50">
              <option value="Thường">Thường</option>
              <option value="Vàng">Vàng</option>
              <option value="VIP">VIP</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs text-white/50 mb-1 block">Địa chỉ</label>
            <input type="text" value={form.address} onChange={e => setForm({...form, address: e.target.value})}
              className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-sakura-400/50" />
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs text-white/50 mb-1 block">Tags (phân cách bằng dấu phẩy)</label>
            <input type="text" value={form.tags} onChange={e => setForm({...form, tags: e.target.value})}
              className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-sakura-400/50" />
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs text-white/50 mb-1 block">Ghi chú</label>
            <textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} rows={2}
              className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-sakura-400/50" />
          </div>
        </div>
        <div className="flex gap-3 mt-5">
          <button onClick={showAdd ? handleAdd : handleSaveEdit} className="flex-1 px-4 py-2.5 bg-gradient-to-r from-sakura-500 to-rose-500 text-white rounded-xl text-sm font-medium hover:opacity-90 transition">
            {showAdd ? "Thêm khách hàng" : "Lưu thay đổi"}
          </button>
          <button onClick={() => { setShowAdd(false); setShowEdit(null); setForm(emptyForm); }} className="px-4 py-2.5 bg-white/10 text-white/70 rounded-xl text-sm hover:bg-white/20 transition">
            Huỷ
          </button>
        </div>
      </Modal>

      {/* Delete confirm */}
      <Modal open={deleteConfirm !== null} onClose={() => setDeleteConfirm(null)} title="Xác nhận xoá" size="sm">
        <p className="text-white/70 text-sm mb-5">Bạn có chắc muốn xoá khách hàng này? Hành động này không thể hoàn tác.</p>
        <div className="flex gap-3">
          <button onClick={() => { if (deleteConfirm) handleDelete(deleteConfirm); }} className="flex-1 px-4 py-2.5 bg-rose-500/30 text-rose-300 rounded-xl text-sm hover:bg-rose-500/40 transition">Xoá</button>
          <button onClick={() => setDeleteConfirm(null)} className="flex-1 px-4 py-2.5 bg-white/10 text-white/70 rounded-xl text-sm hover:bg-white/20 transition">Huỷ</button>
        </div>
      </Modal>
    </div>
  );
}

// ─── Customer Detail ───
export function CustomerDetail({ customerId, onNavigate }: { customerId: string; onNavigate: (p: string) => void }) {
  const customer = customers.find(c => c.id === customerId);
  const [showQuickBuy, setShowQuickBuy] = useState(false);
  const [quickItems, setQuickItems] = useState<{ type: "service" | "product"; id: string; name: string; unitPrice: number; quantity: number }[]>([]);
  const [searchItem, setSearchItem] = useState("");
  const [itemType, setItemType] = useState<"service" | "product">("service");

  if (!customer) {
    return (
      <div className="space-y-6 animate-fade-in">
        <button onClick={() => onNavigate("/customers")} className="text-white/50 hover:text-white text-sm">← Quay lại</button>
        <EmptyState message="Không tìm thấy khách hàng" icon={<Users className="w-12 h-12" />} />
      </div>
    );
  }

  const customerInvList = invoices.filter(i => i.customerId === customerId).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Quick buy search
  const availableServices = services.filter(s => s.active);
  const availableProducts = products.filter(p => p.active && p.stock > 0);
  const currentItems = itemType === "service" ? availableServices : availableProducts;

  const filteredQuickItems = currentItems.filter(it => {
    const q = searchItem.toLowerCase();
    return it.name.toLowerCase().includes(q) || it.code.toLowerCase().includes(q);
  }).slice(0, 6);

  const addQuickItem = (type: "service" | "product", id: string, name: string, price: number) => {
    setQuickItems(prev => {
      const existing = prev.find(it => it.id === id && it.type === type);
      if (existing) return prev.map(it => it.id === id && it.type === type ? { ...it, quantity: it.quantity + 1 } : it);
      return [...prev, { type, id, name, unitPrice: price, quantity: 1 }];
    });
  };

  const updateQuickQty = (idx: number, delta: number) => {
    setQuickItems(prev => prev.map((it, i) => i === idx ? { ...it, quantity: Math.max(1, it.quantity + delta) } : it));
  };

  const removeQuickItem = (idx: number) => {
    setQuickItems(prev => prev.filter((_, i) => i !== idx));
  };

  const quickTotal = quickItems.reduce((s, it) => s + it.unitPrice * it.quantity, 0);

  const handleQuickCreateInvoice = () => {
    if (quickItems.length === 0) return;
    // Redirect to invoices page with prefill note
    alert(`✅ Đã tạo hóa đơn nhanh cho ${customer.name} — Tổng: ${new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(quickTotal)}`);
    setQuickItems([]);
    setShowQuickBuy(false);
  };

  const levelBadge = (level: string) => {
    if (level === "VIP") return <Badge variant="gold">👑 VIP</Badge>;
    if (level === "Vàng") return <Badge variant="info">Vàng</Badge>;
    return <Badge>Thường</Badge>;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <button onClick={() => onNavigate("/customers")} className="text-white/50 hover:text-white text-sm transition">← Danh sách khách hàng</button>

      {/* Customer info card */}
      <div className="bg-sakura-card rounded-2xl border border-white/10 p-6">
        <div className="flex flex-col sm:flex-row items-start gap-5">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-sakura-400 to-rose-400 flex items-center justify-center text-white font-bold text-2xl shadow-lg shrink-0">
            {customer.name.charAt(0)}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-xl font-bold text-white font-serif">{customer.name}</h2>
              {levelBadge(customer.level)}
            </div>
            <div className="text-sm text-white/40 mt-0.5">{customer.code} · Thành viên từ {formatDate(customer.memberSince)}</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-4">
              <div className="flex items-center gap-2 text-sm text-white/70">
                <Phone className="w-4 h-4 text-white/40" />
                <a href={`tel:${customer.phone.replace(/\s/g, "")}`} onClick={e => { e.stopPropagation(); window.open(`tel:${customer.phone.replace(/\s/g, "")}`); }}
                  className="hover:text-sakura-300 transition cursor-pointer">{customer.phone}</a>
                <a href={`https://zalo.me/${customer.phone.replace(/\s/g, "")}`} target="_blank" rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 transition" title="Nhắn Zalo">
                  <MessageCircle className="w-4 h-4" />
                </a>
              </div>
              <div className="flex items-center gap-2 text-sm text-white/70">
                <Mail className="w-4 h-4 text-white/40" />
                <a href={`mailto:${customer.email}`} onClick={e => { e.stopPropagation(); window.open(`mailto:${customer.email}`); }}
                  className="hover:text-sakura-300 transition cursor-pointer">{customer.email}</a>
              </div>
              <div className="flex items-center gap-2 text-sm text-white/70">
                <MapPin className="w-4 h-4 text-white/40" /> {customer.address}
              </div>
            </div>
            <div className="flex items-center gap-4 mt-3 text-sm">
              <span className="flex items-center gap-1 text-gold-400"><DollarSign className="w-4 h-4" /> {formatCurrency(customer.totalSpent)}</span>
              <span className="flex items-center gap-1 text-white/60"><Receipt className="w-4 h-4" /> {customerInvList.length} hóa đơn</span>
              <span className="flex items-center gap-1 text-white/60"><Calendar className="w-4 h-4" /> {customer.visitCount} lượt</span>
            </div>
            {customer.notes && <div className="mt-3 text-xs text-white/40 italic">📝 {customer.notes}</div>}
          </div>
        </div>
      </div>

      {/* Quick Buy Button */}
      <div className="flex gap-2">
        <button
          onClick={() => setShowQuickBuy(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl text-sm font-medium hover:opacity-90 transition shadow-lg shadow-emerald-500/20"
        >
          <ShoppingCart className="w-4 h-4" /> Mua nhanh cho {customer.name}
        </button>
      </div>

      {/* Quick Buy — Compact Search Popup */}
      {showQuickBuy && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 p-4 modal-backdrop" onClick={() => { setShowQuickBuy(false); setSearchItem(""); }}>
          <div className="w-[420px] max-w-full bg-gradient-to-br from-[#2d1b2e] to-[#3d1f2e] border border-white/10 rounded-2xl shadow-2xl animate-fade-in" onClick={e => e.stopPropagation()}>
            {/* Search bar */}
            <div className="p-4 pb-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <input
                  type="text"
                  value={searchItem}
                  onChange={e => setSearchItem(e.target.value)}
                  onBlur={() => setTimeout(() => setSearchItem(""), 200)}
                  placeholder="Tìm nhanh dịch vụ / sản phẩm..."
                  autoFocus
                  className="w-full pl-10 pr-10 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-sakura-400/50"
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1 bg-white/5 rounded-lg p-0.5">
                  <button onClick={() => { setItemType("service"); setSearchItem(""); }}
                    onMouseDown={e => e.preventDefault()}
                    className={`px-2 py-1 rounded-md text-[10px] transition ${itemType === "service" ? "bg-sakura-500/30 text-white" : "text-white/50"}`}>
                    DV
                  </button>
                  <button onClick={() => { setItemType("product"); setSearchItem(""); }}
                    onMouseDown={e => e.preventDefault()}
                    className={`px-2 py-1 rounded-md text-[10px] transition ${itemType === "product" ? "bg-sakura-500/30 text-white" : "text-white/50"}`}>
                    SP
                  </button>
                </div>
              </div>
              {/* Dropdown suggestions */}
              {searchItem && filteredQuickItems.length > 0 && (
                <div className="absolute z-50 w-[calc(420px-2rem)] max-w-[calc(100vw-3rem)] bg-[#1e1224]/95 border border-white/10 rounded-xl mt-1 overflow-hidden shadow-xl">
                  {filteredQuickItems.map(it => (
                    <button
                      key={it.id}
                      onMouseDown={e => { e.preventDefault(); addQuickItem(itemType, it.id, it.name, itemType === "service" ? (it as any).price : (it as any).sellingPrice); }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-left text-white/80 hover:bg-white/10 transition text-xs"
                    >
                      <div className="w-6 h-6 rounded bg-white/10 overflow-hidden flex items-center justify-center shrink-0">
                        {it.image ? <img src={it.image} alt="" className="w-full h-full object-cover" /> : <Package className="w-3 h-3 text-white/30" />}
                      </div>
                      <span className="flex-1 truncate text-white font-medium">{it.name}</span>
                      <span className="text-gold-400 font-semibold shrink-0">{formatCurrency(itemType === "service" ? (it as any).price : (it as any).sellingPrice)}</span>
                      <Plus className="w-3 h-3 text-sakura-300 shrink-0" />
                    </button>
                  ))}
                </div>
              )}
            </div>
            {/* Cart items */}
            <div className="px-4 pb-4 space-y-1.5 max-h-[240px] overflow-y-auto">
              {quickItems.length === 0 ? (
                <div className="text-center py-4 text-white/25 text-xs">Chưa chọn món nào</div>
              ) : (
                quickItems.map((it, i) => (
                  <div key={`${it.type}-${it.id}`} className="flex items-center gap-2 bg-white/5 rounded-lg px-3 py-2 border border-white/10">
                    <Badge variant={it.type === "service" ? "info" : "success"}>{it.type === "service" ? "DV" : "SP"}</Badge>
                    <span className="text-white text-xs flex-1 truncate">{it.name}</span>
                    <div className="flex items-center gap-1">
                      <button onClick={() => updateQuickQty(i, -1)} className="p-0.5 rounded bg-white/10 text-white/60 hover:text-white"><Minus className="w-2.5 h-2.5" /></button>
                      <span className="text-white text-xs w-5 text-center">{it.quantity}</span>
                      <button onClick={() => updateQuickQty(i, 1)} className="p-0.5 rounded bg-white/10 text-white/60 hover:text-white"><Plus className="w-2.5 h-2.5" /></button>
                    </div>
                    <span className="text-gold-400 text-xs font-medium w-16 text-right">{formatCurrency(it.unitPrice * it.quantity)}</span>
                    <button onClick={() => removeQuickItem(i)} className="p-0.5 rounded text-rose-400 hover:bg-rose-500/20"><X className="w-2.5 h-2.5" /></button>
                  </div>
                ))
              )}
              {quickItems.length > 0 && (
                <div className="flex items-center justify-between pt-2 border-t border-white/10 mt-2">
                  <span className="text-white/60 text-xs">Tổng</span>
                  <div className="flex items-center gap-2">
                    <span className="text-base font-bold text-gold-400">{formatCurrency(quickTotal)}</span>
                    <button onClick={handleQuickCreateInvoice} className="px-3 py-1.5 bg-gradient-to-r from-sakura-500 to-rose-500 text-white rounded-lg text-xs font-medium hover:opacity-90 transition shadow">
                      Tạo HD
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Invoice list */}
      <div>
        <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
          <Receipt className="w-4 h-4 text-gold-400" /> Lịch sử hóa đơn
        </h3>
        {customerInvList.length === 0 ? (
          <EmptyState message="Chưa có hóa đơn nào" icon={<Receipt className="w-12 h-12" />} />
        ) : (
          <div className="space-y-2">
            {customerInvList.map(inv => (
              <div key={inv.id} className="bg-white/5 rounded-xl border border-white/10 p-4 hover:border-white/20 transition">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-white font-medium text-sm">{inv.invoiceNo}</span>
                    <Badge variant={inv.status === "completed" ? "success" : inv.status === "pending" ? "warning" : "danger"}>
                      {inv.status === "completed" ? "Hoàn thành" : inv.status === "pending" ? "Chờ" : "Đã huỷ"}
                    </Badge>
                  </div>
                  <span className="text-gold-400 font-semibold">{formatCurrency(inv.total)}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-white/40">
                  <span>{formatDate(inv.date)} · {inv.items.length} món</span>
                  <span>{inv.paymentMethod}</span>
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {inv.items.slice(0, 3).map((it, i) => (
                    <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-white/50">
                      {it.name} x{it.quantity}
                    </span>
                  ))}
                  {inv.items.length > 3 && <span className="text-[10px] text-white/30">+{inv.items.length - 3}</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}