import { useState, useMemo } from "react";
import { products as initialProducts } from "../data/site";
import type { Product } from "../data/site";
import { SearchInput, Modal, EmptyState, Badge, generateId, formatCurrency } from "../components/Shared";
import { Package, Plus, Edit3, Search, Barcode, Tag, AlertTriangle, Percent, DollarSign, Eye, EyeOff, Camera } from "lucide-react";

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

  const emptyForm = { code: "", barcode: "", name: "", category: "Skincare", description: "", costPrice: 0, sellingPrice: 0, originalPrice: 0, stock: 0, minStock: 0, discount: 0, image: "" };
  const [form, setForm] = useState(emptyForm);

  const categories = useMemo(() => [...new Set(productList.map(p => p.category))], [productList]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return productList.filter(p =>
      p.active &&
      (filterCat === "all" || p.category === filterCat) &&
      (p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q) || p.barcode.includes(q) || p.description.toLowerCase().includes(q))
    );
  }, [search, filterCat, productList]);

  // Barcode scan quick search
  const scannedProduct = useMemo(() => {
    if (!scanBarcode.trim()) return null;
    return productList.find(p => p.barcode === scanBarcode.trim() && p.active) || null;
  }, [scanBarcode, productList]);

  const handleAdd = () => {
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
      image: form.image || "",
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
        <div className="flex-1 w-full flex gap-2">
          <SearchInput value={search} onChange={setSearch} placeholder="Tìm theo tên, mã SP..." />
          {!quickSaleMode ? (
            <input
              value={scanBarcode}
              onChange={e => setScanBarcode(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && scannedProduct) handleQuickView(scannedProduct); }}
              onFocus={() => setQuickSaleMode(true)}
              onBlur={() => setTimeout(() => setQuickSaleMode(false), 200)}
              placeholder="📷 Quét barcode / Mã SP..."
              autoFocus
              className="flex-1 max-w-[240px] px-3 py-2.5 bg-gold-500/10 border border-gold-500/30 rounded-xl text-white text-sm placeholder:text-gold-400/50 focus:outline-none focus:border-gold-500/60 focus:ring-1 focus:ring-gold-500/30 transition"
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
            {scannedProduct.image ? (
              <img src={scannedProduct.image} alt="" className="w-14 h-14 rounded-xl object-cover" />
            ) : (
              <div className="w-14 h-14 rounded-xl bg-gold-500/20 flex items-center justify-center"><Package className="w-6 h-6 text-gold-400" /></div>
            )}
            <div className="flex-1">
              <div className="text-white font-semibold">{scannedProduct.name}</div>
              <div className="text-sm text-gold-400">{formatCurrency(scannedProduct.sellingPrice)}</div>
            </div>
            <div className="text-right">
              <div className="text-sm text-white/60">Tồn: <span className="font-semibold">{scannedProduct.stock}</span></div>
              <div className="text-xs text-white/40">{scannedProduct.code} · {scannedProduct.barcode}</div>
            </div>
          </div>
          <button onClick={() => setScanBarcode("")} className="text-white/40 hover:text-white">✕</button>
        </div>
      )}

      {/* Low stock warning */}
      {lowStock.length > 0 && (
        <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-4 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-300 shrink-0" />
          <div className="text-sm text-rose-200">
            <strong>{lowStock.length} sản phẩm</strong> sắp hết hàng (dưới ngưỡng tồn kho tối thiểu)
          </div>
        </div>
      )}

      {filtered.length === 0 ? (
        <EmptyState message="Không tìm thấy sản phẩm" icon={<Package className="w-12 h-12" />} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(p => {
            const isLow = p.stock <= p.minStock;
            return (
              <div key={p.id} className="bg-sakura-card rounded-2xl border border-white/10 overflow-hidden hover:border-white/20 transition group">
                <div className="h-36 bg-gradient-to-br from-sakura-600/30 to-gold-600/20 flex items-center justify-center overflow-hidden relative">
                  {p.image ? (
                    <img src={p.image} alt={p.name} className="w-full h-full object-cover opacity-70" />
                  ) : (
                    <Package className="w-10 h-10 text-white/20" />
                  )}
                  {/* Code badge */}
                  <div className="absolute top-2 left-2 bg-black/50 backdrop-blur-sm rounded-lg px-2 py-1 text-[10px] text-gold-400 font-mono">
                    {p.code}
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between mb-1">
                    <div className="min-w-0">
                      <h3 className="text-white font-semibold text-sm truncate">{p.name}</h3>
                      <div className="text-[10px] text-white/30 font-mono mt-0.5">{'\u{E2C7}'}{p.barcode}</div>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition shrink-0 ml-2">
                      <button onClick={() => handleEdit(p.id)} className="p-1.5 rounded-lg bg-white/10 text-white/60 hover:text-white transition"><Edit3 className="w-3.5 h-3.5" /></button>
                      <button onClick={() => setDeleteConfirm(p.id)} className="p-1.5 rounded-lg bg-white/10 text-rose-400 hover:text-rose-300 transition"><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                    </div>
                  </div>
                  <div className="text-xs text-white/40 mb-2">{p.category}</div>
                  <p className="text-xs text-white/60 mb-2 line-clamp-2">{p.description}</p>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-base font-bold text-gold-400">{formatCurrency(p.sellingPrice)}</span>
                    {p.discount > 0 && <Badge variant="danger">-{p.discount}%</Badge>}
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className={`flex items-center gap-1 ${isLow ? "text-rose-300" : "text-white/50"}`}>
                      <Package className="w-3 h-3" /> Tồn: {p.stock}{isLow && " ⚠️"}
                    </span>
                  </div>
                  {showCostPrice && (
                    <div className="mt-1 pt-1.5 border-t border-white/10 flex items-center justify-between text-xs">
                      <span className="text-white/40">Giá nhập:</span>
                      <span className="text-emerald-300 font-medium">{formatCurrency(p.costPrice)}</span>
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
        <ProductForm form={form} setForm={setForm} categories={categories} />
        <div className="flex gap-3 mt-5">
          <button onClick={showAdd ? handleAdd : handleSaveEdit} className="flex-1 px-4 py-2.5 bg-gradient-to-r from-sakura-500 to-rose-500 text-white rounded-xl text-sm font-medium hover:opacity-90 transition">
            {showAdd ? "Thêm sản phẩm" : "Lưu thay đổi"}
          </button>
          <button onClick={() => { setShowAdd(false); setShowEdit(null); }} className="px-4 py-2.5 bg-white/10 text-white rounded-xl text-sm hover:bg-white/20 transition">Hủy</button>
        </div>
      </Modal>

      {/* Delete Confirm */}
      <Modal open={deleteConfirm !== null} onClose={() => setDeleteConfirm(null)} title="Xác nhận xóa" size="sm">
        <p className="text-white/70 text-sm mb-5">Xóa sản phẩm này? Hành động không thể hoàn tác.</p>
        <div className="flex gap-3">
          <button onClick={() => deleteConfirm && handleDelete(deleteConfirm)} className="flex-1 px-4 py-2.5 bg-rose-500 text-white rounded-xl text-sm font-medium hover:bg-rose-600 transition">Xóa</button>
          <button onClick={() => setDeleteConfirm(null)} className="px-4 py-2.5 bg-white/10 text-white rounded-xl text-sm hover:bg-white/20 transition">Hủy</button>
        </div>
      </Modal>
    </div>
  );

  function handleQuickView(p: Product) {
    // just use existing barcode logic; handled inline with the scanned product overlay above
  }
}

function ProductForm({ form, setForm, categories }: { form: any; setForm: (f: any) => void; categories: string[] }) {
  const update = (k: string, v: any) => setForm({ ...form, [k]: v });
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="sm:col-span-2">
        <label className="text-xs text-white/50 mb-1 block">Tên sản phẩm *</label>
        <input value={form.name} onChange={e => update("name", e.target.value)} className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm" />
      </div>
      <div>
        <label className="text-xs text-white/50 mb-1 block">Mã sản phẩm</label>
        <input value={form.code} onChange={e => update("code", e.target.value)} placeholder="Tự động nếu để trống" className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm" />
      </div>
      <div>
        <label className="text-xs text-white/50 mb-1 block">Mã Barcode / QR *</label>
        <input value={form.barcode} onChange={e => update("barcode", e.target.value)} placeholder="Dùng để quét khi bán hàng" className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm" />
      </div>
      <div>
        <label className="text-xs text-white/50 mb-1 block">URL hình ảnh</label>
        <input value={form.image} onChange={e => update("image", e.target.value)} placeholder="https://... hoặc để trống dùng mặc định" className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm" />
      </div>
      <div>
        <label className="text-xs text-white/50 mb-1 block">Danh mục</label>
        <select value={form.category} onChange={e => update("category", e.target.value)} className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm">
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>
      <div>
        <label className="text-xs text-white/50 mb-1 block">Giảm giá (%)</label>
        <input type="number" value={form.discount} onChange={e => update("discount", Number(e.target.value))} className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm" />
      </div>
      <div className="sm:col-span-2">
        <label className="text-xs text-white/50 mb-1 block">Mô tả</label>
        <textarea value={form.description} onChange={e => update("description", e.target.value)} rows={2} className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm" />
      </div>
      <div>
        <label className="text-xs text-white/50 mb-1 block">Giá nhập (VNĐ)</label>
        <input type="number" value={form.costPrice} onChange={e => update("costPrice", Number(e.target.value))} className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm" />
      </div>
      <div>
        <label className="text-xs text-white/50 mb-1 block">Giá bán (VNĐ) *</label>
        <input type="number" value={form.sellingPrice} onChange={e => update("sellingPrice", Number(e.target.value))} className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm" />
      </div>
      <div>
        <label className="text-xs text-white/50 mb-1 block">Giá gốc / niêm yết (VNĐ)</label>
        <input type="number" value={form.originalPrice} onChange={e => update("originalPrice", Number(e.target.value))} className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm" />
      </div>
      <div>
        <label className="text-xs text-white/50 mb-1 block">Số lượng tồn kho</label>
        <input type="number" value={form.stock} onChange={e => update("stock", Number(e.target.value))} className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm" />
      </div>
      <div>
        <label className="text-xs text-white/50 mb-1 block">Ngưỡng cảnh báo còn lại</label>
        <input type="number" value={form.minStock} onChange={e => update("minStock", Number(e.target.value))} className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm" />
      </div>
      {/* Image preview */}
      {(form.image || "") !== "" && (
        <div className="sm:col-span-2 mt-2">
          <label className="text-xs text-white/50 mb-1 block">Xem trước hình ảnh</label>
          <img src={form.image} alt="Preview" className="w-24 h-24 rounded-xl object-cover border border-white/10" onError={(e) => { e.currentTarget.style.display='none'; }} />
        </div>
      )}
    </div>
  );
}
