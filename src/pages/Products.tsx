import { useState, useMemo, useRef, useEffect } from "react";
import { products as initialProducts, defaultSettings } from "../data/site";
import type { Product } from "../data/site";
import { getSettings } from "./Settings";
import { SearchInput, Modal, EmptyState, Badge, generateId, formatCurrency } from "../components/Shared";
import { Package, Plus, Edit3, Search, Barcode, Tag, AlertTriangle, Percent, DollarSign, Eye, EyeOff, Camera, X } from "lucide-react";

export function Products({ onNavigate }: { onNavigate: (p: string) => void }) {
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState<string>("all");
  const [productList, setProductList] = useState(initialProducts);
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [showCostPrice, setShowCostPrice] = useState(false);
  const [scanBarcode, setScanBarcode] = useState("");
  const [quickSaleMode, setQuickSaleMode] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Load settings for categories & images
  const settings = getSettings();
  const settingsCategories = settings.productCategories.map(c => c.name);

  const emptyForm = { code: "", barcode: "", name: "", category: settingsCategories[0] || "Skincare", description: "", costPrice: 0, sellingPrice: 0, originalPrice: 0, stock: 0, minStock: 0, discount: 0, image: "" };
  const [form, setForm] = useState(emptyForm);

  const categories = useMemo(() => {
    // Merge default categories from settings + existing products
    const fromProducts = [...new Set(productList.map(p => p.category))];
    const all = new Set([...settingsCategories, ...fromProducts]);
    return Array.from(all);
  }, [productList, settingsCategories]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return productList.filter(p =>
      p.active &&
      (filterCat === "all" || p.category === filterCat) &&
      (p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q) || p.barcode.includes(q) || p.description.toLowerCase().includes(q))
    );
  }, [search, filterCat, productList]);

  // Suggestions for fuzzy search
  const suggestions = useMemo(() => {
    if (!search.trim()) return [];
    const q = search.toLowerCase();
    return productList
      .filter(p => p.active && (p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q) || p.barcode.includes(q)))
      .slice(0, 6);
  }, [search, productList]);

  // Barcode scan quick search
  const scannedProduct = useMemo(() => {
    if (!scanBarcode.trim()) return null;
    return productList.find(p => p.barcode === scanBarcode.trim() && p.active) || null;
  }, [scanBarcode, productList]);

  // Get category image for auto-fill
  const getCategoryImage = (catName: string): string => {
    const cat = settings.productCategories.find(c => c.name === catName);
    return cat?.image || "";
  };

  const handleAdd = () => {
    const catImg = form.image || getCategoryImage(form.category);
    const newP: Product = {
      id: generateId(),
      code: form.code || `SP${String(productList.length + 1).padStart(3, "0")}`,
      barcode: form.barcode || `8935000${String(Date.now()).slice(-6)}`,
      name: form.name,
      category: form.category,
      description: form.description,
      costPrice: form.costPrice,
      sellingPrice: form.sellingPrice,
      originalPrice: form.originalPrice,
      stock: form.stock,
      minStock: form.minStock,
      discount: form.discount,
      image: catImg,
      active: true,
    };
    setProductList([newP, ...productList]);
    setShowAdd(false);
    setForm(emptyForm);
  };

  const handleEdit = (id: string) => {
    const p = productList.find(x => x.id === id);
    if (!p) return;
    setForm({
      code: p.code, barcode: p.barcode, name: p.name, category: p.category,
      description: p.description, costPrice: p.costPrice, sellingPrice: p.sellingPrice,
      originalPrice: p.originalPrice, stock: p.stock, minStock: p.minStock,
      discount: p.discount, image: p.image || "",
    });
    setShowEdit(id);
  };

  const handleSaveEdit = () => {
    if (!showEdit) return;
    setProductList(prev => prev.map(p =>
      p.id === showEdit ? { ...p, ...form } : p
    ));
    setShowEdit(null);
    setForm(emptyForm);
  };

  const handleDelete = (id: string) => {
    setProductList(prev => prev.filter(p => p.id !== id));
    setDeleteConfirm(null);
  };

  const handleSelectSuggestion = (p: Product) => {
    setSearch(p.name);
    setShowSuggestions(false);
  };

  // Close suggestions on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const lowStock = useMemo(() => productList.filter(p => p.active && p.stock <= p.minStock), [productList]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white font-serif">Sản phẩm</h1>
          <p className="text-white/50 text-sm mt-1">{productList.filter(p => p.active).length} sản phẩm</p>
        </div>
        <button
          onClick={() => { setForm(emptyForm); setShowAdd(true); }}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-sakura-500 to-rose-500 text-white rounded-xl text-sm font-medium hover:opacity-90 transition shadow-lg shadow-sakura-500/20"
        >
          <Plus className="w-4 h-4" /> Thêm sản phẩm
        </button>
      </div>

      {/* Filter row */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="flex-1 w-full flex gap-2 relative" ref={searchRef}>
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <input
              type="text"
              value={search}
              onChange={e => { setSearch(e.target.value); setShowSuggestions(true); }}
              onFocus={() => setShowSuggestions(true)}
              placeholder="Tìm theo tên, mã SP, barcode..."
              className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-sakura-400/50"
            />
            {/* Suggestions dropdown */}
            {showSuggestions && search && suggestions.length > 0 && (
              <div className="absolute z-50 w-full bg-[#2d1b2e]/95 border border-white/10 rounded-xl mt-1 overflow-hidden shadow-lg">
                {suggestions.map(p => (
                  <button
                    key={p.id}
                    onClick={() => handleSelectSuggestion(p)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-white/80 hover:bg-white/10 transition text-sm"
                  >
                    <div className="w-8 h-8 rounded-lg bg-white/10 overflow-hidden flex items-center justify-center shrink-0">
                      {p.image ? <img src={p.image} alt={p.name} className="w-full h-full object-cover" /> : <Package className="w-4 h-4 text-white/30" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-white font-medium truncate">{p.name}</div>
                      <div className="text-[10px] text-white/40">{p.code} · {p.category}</div>
                    </div>
                    <span className="text-gold-400 font-semibold text-xs whitespace-nowrap">{formatCurrency(p.sellingPrice)}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          {!quickSaleMode ? (
            <input
              value={scanBarcode}
              onChange={e => setScanBarcode(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && scannedProduct) setSearch(scannedProduct.name); }}
              onFocus={() => setQuickSaleMode(true)}
              onBlur={() => setTimeout(() => setQuickSaleMode(false), 200)}
              placeholder="📷 Quét barcode / Mã SP..."
              className="max-w-[200px] px-3 py-2.5 bg-gold-500/10 border border-gold-500/30 rounded-xl text-white text-sm placeholder:text-gold-400/50 focus:outline-none focus:border-gold-500/60"
            />
          ) : (
            <div className="flex-1"></div>
          )}
        </div>
        <button
          onClick={() => setShowCostPrice(!showCostPrice)}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs transition ${
            showCostPrice ? "bg-sakura-500/30 text-white border border-sakura-500/30" : "bg-white/5 text-white/60 border border-white/10 hover:bg-white/10"
          }`}
        >
          {showCostPrice ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          {showCostPrice ? "Ẩn giá nhập" : "Hiện giá nhập"}
        </button>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setFilterCat("all")} className={`px-3 py-2 rounded-xl text-sm transition ${filterCat === "all" ? "bg-sakura-500/30 text-white border border-sakura-500/30" : "bg-white/5 text-white/60 border border-white/10 hover:bg-white/10"}`}>Tất cả</button>
          {categories.map(cat => (
            <button key={cat} onClick={() => setFilterCat(cat)} className={`px-3 py-2 rounded-xl text-sm transition ${filterCat === cat ? "bg-sakura-500/30 text-white border border-sakura-500/30" : "bg-white/5 text-white/60 border border-white/10 hover:bg-white/10"}`}>{cat}</button>
          ))}
        </div>
      </div>

      {/* Quick view after barcode scan */}
      {scannedProduct && !quickSaleMode && (
        <div className="bg-gold-500/10 border border-gold-500/30 rounded-2xl p-4 flex items-center gap-4 animate-fade-in">
          <Camera className="w-8 h-8 text-gold-400 shrink-0" />
          <div className="flex-1 flex items-center gap-4">
            {scannedProduct.image && <img src={scannedProduct.image} alt={scannedProduct.name} className="w-12 h-12 rounded-lg object-cover" />}
            <div>
              <div className="text-white font-medium">{scannedProduct.name}</div>
              <div className="text-xs text-white/40">{scannedProduct.code} · {scannedProduct.barcode}</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-gold-400 font-bold">{formatCurrency(scannedProduct.sellingPrice)}</div>
            <div className="text-xs text-white/40">Tồn: {scannedProduct.stock}</div>
          </div>
        </div>
      )}

      {/* Product grid */}
      {filtered.length === 0 ? (
        <EmptyState message="Không tìm thấy sản phẩm" icon={<Package className="w-12 h-12" />} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(p => {
            const isLowStock = p.stock <= p.minStock;
            return (
              <div key={p.id} className="bg-sakura-card rounded-2xl border border-white/10 overflow-hidden hover:border-white/20 transition group">
                <div className="h-32 bg-gradient-to-br from-sakura-600/30 to-rose-600/20 flex items-center justify-center overflow-hidden relative">
                  {p.image ? (
                    <img src={p.image} alt={p.name} className="w-full h-full object-cover opacity-70" />
                  ) : (
                    <Package className="w-10 h-10 text-white/20" />
                  )}
                  {p.discount > 0 && (
                    <Badge variant="danger" children={`-${p.discount}%`} />
                  )}
                  <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition">
                    <button onClick={() => handleEdit(p.id)} className="p-1.5 rounded-lg bg-black/50 text-white/80 hover:text-white hover:bg-black/70"><Edit3 className="w-3 h-3" /></button>
                    <button onClick={() => setDeleteConfirm(p.id)} className="p-1.5 rounded-lg bg-black/50 text-rose-400 hover:text-rose-300 hover:bg-black/70">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between mb-1">
                    <h3 className="text-white font-semibold text-sm">{p.name}</h3>
                  </div>
                  <div className="text-xs text-white/40 mb-1">{p.code} · {p.category}</div>
                  <p className="text-xs text-white/60 mb-2 line-clamp-1">{p.description}</p>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs text-white/40 flex items-center gap-1"><Barcode className="w-3 h-3" />{p.barcode}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-base font-bold text-gold-400">{formatCurrency(p.sellingPrice)}</span>
                      {p.originalPrice > p.sellingPrice && (
                        <span className="text-xs text-white/30 line-through ml-2">{formatCurrency(p.originalPrice)}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      {isLowStock ? (
                        <span className="flex items-center gap-1 text-xs text-rose-300"><AlertTriangle className="w-3 h-3" />{p.stock}</span>
                      ) : (
                        <span className="text-xs text-white/50">Tồn: {p.stock}</span>
                      )}
                    </div>
                  </div>
                  {showCostPrice && (
                    <div className="mt-2 pt-2 border-t border-white/10 text-xs text-white/40">
                      Giá nhập: {formatCurrency(p.costPrice)} · Lợi nhuận: {formatCurrency(p.sellingPrice - p.costPrice)}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal open={showAdd || showEdit !== null} onClose={() => { setShowAdd(false); setShowEdit(null); }} title={showAdd ? "Thêm sản phẩm mới" : "Sửa sản phẩm"} size="lg">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="text-xs text-white/50 mb-1 block">Tên sản phẩm *</label>
            <input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})}
              className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-sakura-400/50" />
          </div>
          <div>
            <label className="text-xs text-white/50 mb-1 block">Mã sản phẩm</label>
            <input type="text" value={form.code} onChange={e => setForm({...form, code: e.target.value})}
              className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-sakura-400/50" />
          </div>
          <div>
            <label className="text-xs text-white/50 mb-1 block">Barcode</label>
            <input type="text" value={form.barcode} onChange={e => setForm({...form, barcode: e.target.value})}
              className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-sakura-400/50" />
          </div>
          <div>
            <label className="text-xs text-white/50 mb-1 block">Nhóm sản phẩm</label>
            <select value={form.category} onChange={e => setForm({...form, category: e.target.value})}
              className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-sakura-400/50">
              {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-white/50 mb-1 block">Giá nhập</label>
            <input type="number" value={form.costPrice || ""} onChange={e => setForm({...form, costPrice: Number(e.target.value)})}
              className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-sakura-400/50" />
          </div>
          <div>
            <label className="text-xs text-white/50 mb-1 block">Giá bán *</label>
            <input type="number" value={form.sellingPrice || ""} onChange={e => setForm({...form, sellingPrice: Number(e.target.value)})}
              className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-sakura-400/50" />
          </div>
          <div>
            <label className="text-xs text-white/50 mb-1 block">Giá gốc (niêm yết)</label>
            <input type="number" value={form.originalPrice || ""} onChange={e => setForm({...form, originalPrice: Number(e.target.value)})}
              className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-sakura-400/50" />
          </div>
          <div>
            <label className="text-xs text-white/50 mb-1 block">Giảm giá (%)</label>
            <input type="number" value={form.discount || ""} onChange={e => setForm({...form, discount: Number(e.target.value)})}
              className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-sakura-400/50" />
          </div>
          <div>
            <label className="text-xs text-white/50 mb-1 block">Tồn kho</label>
            <input type="number" value={form.stock || ""} onChange={e => setForm({...form, stock: Number(e.target.value)})}
              className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-sakura-400/50" />
          </div>
          <div>
            <label className="text-xs text-white/50 mb-1 block">Tồn tối thiểu</label>
            <input type="number" value={form.minStock || ""} onChange={e => setForm({...form, minStock: Number(e.target.value)})}
              className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-sakura-400/50" />
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs text-white/50 mb-1 block">Mô tả</label>
            <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows={2}
              className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-sakura-400/50" />
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs text-white/50 mb-1 block">URL ảnh sản phẩm (để trống sẽ dùng ảnh nhóm)</label>
            <input type="text" value={form.image} onChange={e => setForm({...form, image: e.target.value})}
              className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-sakura-400/50" />
            {!form.image && form.category && (
              <p className="text-[10px] text-gold-400/60 mt-1">💡 Sẽ dùng ảnh đại diện của nhóm "{form.category}"</p>
            )}
          </div>
        </div>
        <div className="flex gap-3 mt-5">
          <button onClick={showAdd ? handleAdd : handleSaveEdit} className="flex-1 px-4 py-2.5 bg-gradient-to-r from-sakura-500 to-rose-500 text-white rounded-xl text-sm font-medium hover:opacity-90 transition">
            {showAdd ? "Thêm sản phẩm" : "Lưu thay đổi"}
          </button>
          <button onClick={() => { setShowAdd(false); setShowEdit(null); setForm(emptyForm); }} className="px-4 py-2.5 bg-white/10 text-white/70 rounded-xl text-sm hover:bg-white/20 transition">Huỷ</button>
        </div>
      </Modal>

      {/* Delete confirm */}
      <Modal open={deleteConfirm !== null} onClose={() => setDeleteConfirm(null)} title="Xác nhận xoá" size="sm">
        <p className="text-white/70 text-sm mb-5">Bạn có chắc muốn xoá sản phẩm này?</p>
        <div className="flex gap-3">
          <button onClick={() => { if (deleteConfirm) handleDelete(deleteConfirm); }} className="flex-1 px-4 py-2.5 bg-rose-500/30 text-rose-300 rounded-xl text-sm hover:bg-rose-500/40 transition">Xoá</button>
          <button onClick={() => setDeleteConfirm(null)} className="flex-1 px-4 py-2.5 bg-white/10 text-white/70 rounded-xl text-sm hover:bg-white/20 transition">Huỷ</button>
        </div>
      </Modal>
    </div>
  );
}