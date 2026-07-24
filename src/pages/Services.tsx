import { useState, useMemo, useRef, useEffect } from "react";
import { services as initialServices } from "../data/site";
import type { Service } from "../data/site";
import { getSettings } from "./Settings";
import { SearchInput, Modal, EmptyState, Badge, generateId, formatCurrency } from "../components/Shared";
import { Sparkles, Edit3, Plus, Clock, Search, Tag, X } from "lucide-react";

export function Services({ onNavigate }: { onNavigate: (p: string) => void }) {
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState<string>("all");
  const [serviceList, setServiceList] = useState(initialServices);
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const settings = getSettings();
  const settingsCategories = settings.serviceCategories.map(c => c.name);

  const emptyForm = { code: "", name: "", category: settingsCategories[0] || "Massage", description: "", price: 0, duration: 60, image: "" };
  const [form, setForm] = useState(emptyForm);

  const categories = useMemo(() => {
    const fromServices = [...new Set(serviceList.map(s => s.category))];
    const all = new Set([...settingsCategories, ...fromServices]);
    return Array.from(all);
  }, [serviceList, settingsCategories]);

  const getCategoryImage = (catName: string): string => {
    const cat = settings.serviceCategories.find(c => c.name === catName);
    return cat?.image || "";
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return serviceList.filter(s =>
      (s.active) &&
      (filterCat === "all" || s.category === filterCat) &&
      (s.name.toLowerCase().includes(q) || s.code.toLowerCase().includes(q) || s.description.toLowerCase().includes(q))
    );
  }, [search, filterCat, serviceList]);

  // Suggestions for fuzzy search
  const suggestions = useMemo(() => {
    if (!search.trim()) return [];
    const q = search.toLowerCase();
    return serviceList
      .filter(s => s.active && (s.name.toLowerCase().includes(q) || s.code.toLowerCase().includes(q)))
      .slice(0, 6);
  }, [search, serviceList]);

  const handleAdd = () => {
    const catImg = form.image || getCategoryImage(form.category);
    const newS: Service = {
      id: generateId(),
      code: `SV${String(serviceList.length + 1).padStart(3, "0")}`,
      name: form.name,
      category: form.category,
      description: form.description,
      price: form.price,
      duration: form.duration,
      image: catImg,
      active: true,
    };
    setServiceList([newS, ...serviceList]);
    setShowAdd(false);
    setForm(emptyForm);
  };

  const handleEdit = (id: string) => {
    const s = serviceList.find(x => x.id === id);
    if (!s) return;
    setForm({ code: s.code, name: s.name, category: s.category, description: s.description, price: s.price, duration: s.duration, image: s.image || "" });
    setShowEdit(id);
  };

  const handleSaveEdit = () => {
    if (!showEdit) return;
    setServiceList(prev => prev.map(s =>
      s.id === showEdit ? { ...s, name: form.name, category: form.category, description: form.description, price: form.price, duration: form.duration, image: form.image || getCategoryImage(form.category) } : s
    ));
    setShowEdit(null);
    setForm(emptyForm);
  };

  const handleDelete = (id: string) => {
    setServiceList(prev => prev.filter(s => s.id !== id));
    setDeleteConfirm(null);
  };

  const handleSelectSuggestion = (s: Service) => {
    setSearch(s.name);
    setShowSuggestions(false);
  };

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

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

      <div className="flex flex-col sm:flex-row gap-3" ref={searchRef}>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <input
            type="text"
            value={search}
            onChange={e => { setSearch(e.target.value); setShowSuggestions(true); }}
            onFocus={() => setShowSuggestions(true)}
            placeholder="Tìm dịch vụ..."
            className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-sakura-400/50"
          />
          {/* Suggestions dropdown */}
          {showSuggestions && search && suggestions.length > 0 && (
            <div className="absolute z-50 w-full bg-[#2d1b2e]/95 border border-white/10 rounded-xl mt-1 overflow-hidden shadow-lg">
              {suggestions.map(s => (
                <button
                  key={s.id}
                  onClick={() => handleSelectSuggestion(s)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-white/80 hover:bg-white/10 transition text-sm"
                >
                  <div className="w-8 h-8 rounded-lg bg-white/10 overflow-hidden flex items-center justify-center shrink-0">
                    {s.image ? <img src={s.image} alt={s.name} className="w-full h-full object-cover" /> : <Sparkles className="w-4 h-4 text-white/30" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-white font-medium truncate">{s.name}</div>
                    <div className="text-[10px] text-white/40">{s.code} · {s.category}</div>
                  </div>
                  <span className="text-gold-400 font-semibold text-xs whitespace-nowrap">{formatCurrency(s.price)}</span>
                </button>
              ))}
            </div>
          )}
        </div>
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="text-xs text-white/50 mb-1 block">Tên dịch vụ *</label>
            <input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})}
              className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-sakura-400/50" />
          </div>
          <div>
            <label className="text-xs text-white/50 mb-1 block">Nhóm dịch vụ</label>
            <select value={form.category} onChange={e => setForm({...form, category: e.target.value})}
              className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-sakura-400/50">
              {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-white/50 mb-1 block">Thời gian (phút)</label>
            <input type="number" value={form.duration} onChange={e => setForm({...form, duration: Number(e.target.value)})}
              className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-sakura-400/50" />
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs text-white/50 mb-1 block">Giá *</label>
            <input type="number" value={form.price || ""} onChange={e => setForm({...form, price: Number(e.target.value)})}
              className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-sakura-400/50" />
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs text-white/50 mb-1 block">Mô tả</label>
            <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows={2}
              className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-sakura-400/50" />
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs text-white/50 mb-1 block">URL ảnh (để trống sẽ dùng ảnh nhóm)</label>
            <input type="text" value={form.image} onChange={e => setForm({...form, image: e.target.value})}
              className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-sakura-400/50" />
            {!form.image && form.category && (
              <p className="text-[10px] text-gold-400/60 mt-1">💡 Sẽ dùng ảnh đại diện của nhóm "{form.category}"</p>
            )}
          </div>
        </div>
        <div className="flex gap-3 mt-5">
          <button onClick={showAdd ? handleAdd : handleSaveEdit} className="flex-1 px-4 py-2.5 bg-gradient-to-r from-sakura-500 to-rose-500 text-white rounded-xl text-sm font-medium hover:opacity-90 transition">
            {showAdd ? "Thêm dịch vụ" : "Lưu thay đổi"}
          </button>
          <button onClick={() => { setShowAdd(false); setShowEdit(null); setForm(emptyForm); }} className="px-4 py-2.5 bg-white/10 text-white/70 rounded-xl text-sm hover:bg-white/20 transition">Huỷ</button>
        </div>
      </Modal>

      {/* Delete confirm */}
      <Modal open={deleteConfirm !== null} onClose={() => setDeleteConfirm(null)} title="Xác nhận xoá" size="sm">
        <p className="text-white/70 text-sm mb-5">Bạn có chắc muốn xoá dịch vụ này?</p>
        <div className="flex gap-3">
          <button onClick={() => { if (deleteConfirm) handleDelete(deleteConfirm); }} className="flex-1 px-4 py-2.5 bg-rose-500/30 text-rose-300 rounded-xl text-sm hover:bg-rose-500/40 transition">Xoá</button>
          <button onClick={() => setDeleteConfirm(null)} className="flex-1 px-4 py-2.5 bg-white/10 text-white/70 rounded-xl text-sm hover:bg-white/20 transition">Huỷ</button>
        </div>
      </Modal>
    </div>
  );
}