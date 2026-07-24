import { useState, useMemo } from "react";
import { services } from "../data/site";
import type { Service } from "../data/site";
import { SearchInput, Modal, EmptyState, Badge, generateId, formatCurrency } from "../components/Shared";
import { Sparkles, Edit3, Plus, Clock, Search, Tag } from "lucide-react";

export function Services({ onNavigate }: { onNavigate: (p: string) => void }) {
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState<string>("all");
  const [serviceList, setServiceList] = useState(services);
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const emptyForm = { code: "", name: "", category: "Massage", description: "", price: 0, duration: 60 };
  const [form, setForm] = useState(emptyForm);

  const categories = useMemo(() => [...new Set(services.map(s => s.category))], []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return serviceList.filter(s =>
      (s.active) &&
      (filterCat === "all" || s.category === filterCat) &&
      (s.name.toLowerCase().includes(q) || s.code.toLowerCase().includes(q) || s.description.toLowerCase().includes(q))
    );
  }, [search, filterCat, serviceList]);

  const handleAdd = () => {
    const newS: Service = {
      id: generateId(),
      code: `SV${String(serviceList.length + 1).padStart(3, "0")}`,
      name: form.name,
      category: form.category,
      description: form.description,
      price: form.price,
      duration: form.duration,
      image: "",
      active: true,
    };
    setServiceList([newS, ...serviceList]);
    setShowAdd(false);
    setForm(emptyForm);
  };

  const handleEdit = (id: string) => {
    const s = serviceList.find(x => x.id === id);
    if (!s) return;
    setForm({ code: s.code, name: s.name, category: s.category, description: s.description, price: s.price, duration: s.duration });
    setShowEdit(id);
  };

  const handleSaveEdit = () => {
    if (!showEdit) return;
    setServiceList(prev => prev.map(s =>
      s.id === showEdit ? { ...s, name: form.name, category: form.category, description: form.description, price: form.price, duration: form.duration } : s
    ));
    setShowEdit(null);
    setForm(emptyForm);
  };

  const handleDelete = (id: string) => {
    setServiceList(prev => prev.filter(s => s.id !== id));
    setDeleteConfirm(null);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white font-serif">Dịch vụ</h1>
          <p className="text-white/50 text-sm mt-1">{serviceList.filter(s => s.active).length} dịch vụ</p>
        </div>
        <button
          onClick={() => { setForm(emptyForm); setShowAdd(true); }}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-sakura-500 to-rose-500 text-white rounded-xl text-sm font-medium hover:opacity-90 transition shadow-lg shadow-sakura-500/20"
        >
          <Plus className="w-4 h-4" /> Thêm dịch vụ
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <SearchInput value={search} onChange={setSearch} placeholder="Tìm dịch vụ..." />
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setFilterCat("all")} className={`px-3 py-2 rounded-xl text-sm transition ${filterCat === "all" ? "bg-sakura-500/30 text-white border border-sakura-500/30" : "bg-white/5 text-white/60 border border-white/10 hover:bg-white/10"}`}>
            Tất cả
          </button>
          {categories.map(cat => (
            <button key={cat} onClick={() => setFilterCat(cat)} className={`px-3 py-2 rounded-xl text-sm transition ${filterCat === cat ? "bg-sakura-500/30 text-white border border-sakura-500/30" : "bg-white/5 text-white/60 border border-white/10 hover:bg-white/10"}`}>
              {cat}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState message="Không tìm thấy dịch vụ" icon={<Sparkles className="w-12 h-12" />} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(s => (
            <div key={s.id} className="bg-sakura-card rounded-2xl border border-white/10 overflow-hidden hover:border-white/20 transition group">
              <div className="h-32 bg-gradient-to-br from-sakura-600/30 to-rose-600/20 flex items-center justify-center overflow-hidden">
                {s.image ? (
                  <img src={s.image} alt={s.name} className="w-full h-full object-cover opacity-70" />
                ) : (
                  <Sparkles className="w-10 h-10 text-white/20" />
                )}
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between mb-1">
                  <h3 className="text-white font-semibold text-sm">{s.name}</h3>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                    <button onClick={() => handleEdit(s.id)} className="p-1 rounded bg-white/10 text-white/60 hover:text-white">
                      <Edit3 className="w-3 h-3" />
                    </button>
                    <button onClick={() => setDeleteConfirm(s.id)} className="p-1 rounded bg-white/10 text-rose-400 hover:text-rose-300">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                  </div>
                </div>
                <div className="text-xs text-white/40 mb-1">{s.code} · {s.category}</div>
                <p className="text-xs text-white/60 mb-3 line-clamp-2">{s.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-base font-bold text-gold-400">{formatCurrency(s.price)}</span>
                  <span className="flex items-center gap-1 text-xs text-white/50"><Clock className="w-3 h-3" /> {s.duration} ph</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal open={showAdd || showEdit !== null} onClose={() => { setShowAdd(false); setShowEdit(null); }} title={showAdd ? "Thêm dịch vụ mới" : "Sửa dịch vụ"}>
        <ServiceForm form={form} setForm={setForm} categories={categories} />
        <div className="flex gap-3 mt-5">
          <button onClick={showAdd ? handleAdd : handleSaveEdit} className="flex-1 px-4 py-2.5 bg-gradient-to-r from-sakura-500 to-rose-500 text-white rounded-xl text-sm font-medium hover:opacity-90 transition">
            {showAdd ? "Thêm dịch vụ" : "Lưu thay đổi"}
          </button>
          <button onClick={() => { setShowAdd(false); setShowEdit(null); }} className="px-4 py-2.5 bg-white/10 text-white rounded-xl text-sm hover:bg-white/20 transition">Hủy</button>
        </div>
      </Modal>

      {/* Delete Confirm */}
      <Modal open={deleteConfirm !== null} onClose={() => setDeleteConfirm(null)} title="Xác nhận xóa" size="sm">
        <p className="text-white/70 text-sm mb-5">Xóa dịch vụ này? Hành động không thể hoàn tác.</p>
        <div className="flex gap-3">
          <button onClick={() => deleteConfirm && handleDelete(deleteConfirm)} className="flex-1 px-4 py-2.5 bg-rose-500 text-white rounded-xl text-sm font-medium hover:bg-rose-600 transition">Xóa</button>
          <button onClick={() => setDeleteConfirm(null)} className="px-4 py-2.5 bg-white/10 text-white rounded-xl text-sm hover:bg-white/20 transition">Hủy</button>
        </div>
      </Modal>
    </div>
  );
}

function ServiceForm({ form, setForm, categories }: { form: any; setForm: (f: any) => void; categories: string[] }) {
  const update = (k: string, v: any) => setForm({ ...form, [k]: v });
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="sm:col-span-2">
        <label className="text-xs text-white/50 mb-1 block">Tên dịch vụ *</label>
        <input value={form.name} onChange={e => update("name", e.target.value)} className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm" />
      </div>
      <div>
        <label className="text-xs text-white/50 mb-1 block">Danh mục</label>
        <select value={form.category} onChange={e => update("category", e.target.value)} className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm">
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>
      <div>
        <label className="text-xs text-white/50 mb-1 block">Thời gian (phút)</label>
        <input type="number" value={form.duration} onChange={e => update("duration", Number(e.target.value))} className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm" />
      </div>
      <div className="sm:col-span-2">
        <label className="text-xs text-white/50 mb-1 block">Mô tả</label>
        <textarea value={form.description} onChange={e => update("description", e.target.value)} rows={2} className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm" />
      </div>
      <div className="sm:col-span-2">
        <label className="text-xs text-white/50 mb-1 block">Giá (VNĐ) *</label>
        <input type="number" value={form.price} onChange={e => update("price", Number(e.target.value))} className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm" />
      </div>
    </div>
  );
}