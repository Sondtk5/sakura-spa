import { useState, useMemo } from "react";
import { products } from "../data/site";
import type { Product } from "../data/site";
import { SearchInput, Modal, EmptyState, Badge, generateId, formatCurrency } from "../components/Shared";
import { Package, Plus, Edit3, Search, Barcode, Tag, AlertTriangle, Percent, DollarSign } from "lucide-react";

export function Products({ onNavigate }: { onNavigate: (p: string) => void }) {
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState<string>("all");
  const [productList, setProductList] = useState(products);
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const emptyForm = { code: "", barcode: "", name: "", category: "Skincare", description: "", costPrice: 0, sellingPrice: 0, originalPrice: 0, stock: 0, minStock: 0, discount: 0 };
  const [form, setForm] = useState(emptyForm);

  const categories = useMemo(() => [...new Set(products.map(p => p.category))], []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return productList.filter(p =>
      p.active &&
      (filterCat === "all" || p.category === filterCat) &&
      (p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q) || p.barcode.includes(q) || p.description.toLowerCase().includes(q))
    );
  }, [search, filterCat, productList]);

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
      image: "",
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
      originalPrice: p.originalPrice, stock: p.stock, minStock: p.minStock, discount: p.discount,
    });
    setShowEdit(id);
  };

  const handleSaveEdit = () => {
    if (!showEdit) return;
    setProductList(prev => prev.map(p =>
      p.id === showEdit ? { ...p, ...form, discount: Number(form.discount) } : p
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

      <div className="flex flex-col sm:flex-row gap-3">
        <SearchInput value={search} onChange={setSearch} placeholder="Tìm theo tên, mã SP, barcode..." />
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setFilterCat("all")} className={`px-3 py-2 rounded-xl text-sm transition ${filterCat === "all" ? "bg-sakura-500/30 text-white border border-sakura-500/30" : "bg-white/5 text-white/60 border border-white/10 hover:bg-white/10"}`}>Tất cả</button>
          {categories.map(cat => (
            <button key={cat} onClick={() => setFilterCat(cat)} className={`px-3 py-2 rounded-xl text-sm transition ${filterCat === cat ? "bg-sakura-500/30 text-white border border-sakura-500/30" : "bg-white/5 text-white/60 border border-white/10 hover:bg-white/10"}`}>{cat}</button>
          ))}
        </div>
      </div>

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
                <div className="h-32 bg-gradient-to-br from-sakura-600/30 to-gold-600/20 flex items-center justify-center overflow-hidden">
                  {p.image ? (
                    <img src={p.image} alt={p.name} className="w-full h-full object-cover opacity-70" />
                  ) : (
                    <Package className="w-10 h-10 text-white/20" />
                  )}
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between mb-1">
                    <div>
                      <h3 className="text-white font-semibold text-sm">{p.name}</h3>
                      <div className="text-xs text-white/40 flex items-center gap-1">
                        <Barcode className="w-3 h-3" /> {p.barcode}
                      </div>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                      <button onClick={() => handleEdit(p.id)} className="p-1 rounded bg-white/10 text-white/60 hover:text-white"><Edit3 className="w-3 h-3" /></button>
                      <button onClick={() => setDeleteConfirm(p.id)} className="p-1 rounded bg-white/10 text-rose-400 hover:text-rose-300">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  </div>
                  <div className="text-xs text-white/40 mb-1">{p.code} · {p.category}</div>
                  <p className="text-xs text-white/60 mb-2 line-clamp-2">{p.description}</p>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-base font-bold text-gold-400">{formatCurrency(p.sellingPrice)}</span>
                    {p.discount > 0 && (
                      <span className="flex items-center gap-1 text-xs text-rose-300"><Percent className="w-3 h-3" /> -{p.discount}%</span>
                    )}
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className={`flex items-center gap-1 ${isLow ? "text-rose-300" : "text-white/50"}`}>
                      <Package className="w-3 h-3" /> Tồn: {p.stock}
                      {isLow && <AlertTriangle className="w-3 h-3" />}
                    </span>
                    <span className="text-white/40">Giá gốc: {formatCurrency(p.originalPrice)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal open={showAdd || showEdit !== null} onClose={() => { setShowAdd(false); setShowEdit(null); }} title={showAdd ? "Thêm sản phẩm mới" : "Sửa sản phẩm"} size="lg">
        <ProductForm form={form} setForm={setForm} categories={categories} />
        <div className="flex gap-3 mt-5">
          <button onClick={showAdd ? handleAdd : handleSaveEdit} className="flex-1 px-4 py-2.5 bg-gradient-to-r from-sakura-500 to-rose-500 text-white rounded-xl text-sm font-medium hover:opacity-90 transition">
            {showAdd ? "Thêm sản phẩm" : "Lưu thay đổi"}
          </button>
          <button onClick={() => { setShowAdd(false); setShowEdit(null); }} className="px-4 py-2.5 bg-white/10 text-white rounded-xl text-sm hover:bg-white/20 transition">Hủy</button>
        </div>
      </Modal>

      <Modal open={deleteConfirm !== null} onClose={() => setDeleteConfirm(null)} title="Xác nhận xóa" size="sm">
        <p className="text-white/70 text-sm mb-5">Xóa sản phẩm này? Hành động không thể hoàn tác.</p>
        <div className="flex gap-3">
          <button onClick={() => deleteConfirm && handleDelete(deleteConfirm)} className="flex-1 px-4 py-2.5 bg-rose-500 text-white rounded-xl text-sm font-medium hover:bg-rose-600 transition">Xóa</button>
          <button onClick={() => setDeleteConfirm(null)} className="px-4 py-2.5 bg-white/10 text-white rounded-xl text-sm hover:bg-white/20 transition">Hủy</button>
        </div>
      </Modal>
    </div>
  );
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
        <label className="text-xs text-white/50 mb-1 block">Mã sản phẩm *</label>
        <input value={form.code} onChange={e => update("code", e.target.value)} placeholder="Tự động nếu để trống" className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm" />
      </div>
      <div>
        <label className="text-xs text-white/50 mb-1 block">Mã Barcode / QR</label>
        <input value={form.barcode} onChange={e => update("barcode", e.target.value)} placeholder="8935..." className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm" />
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
        <label className="text-xs text-white/50 mb-1 block">Giá nhập</label>
        <input type="number" value={form.costPrice} onChange={e => update("costPrice", Number(e.target.value))} className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm" />
      </div>
      <div>
        <label className="text-xs text-white/50 mb-1 block">Giá bán *</label>
        <input type="number" value={form.sellingPrice} onChange={e => update("sellingPrice", Number(e.target.value))} className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm" />
      </div>
      <div>
        <label className="text-xs text-white/50 mb-1 block">Giá gốc (niêm yết)</label>
        <input type="number" value={form.originalPrice} onChange={e => update("originalPrice", Number(e.target.value))} className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm" />
      </div>
      <div>
        <label className="text-xs text-white/50 mb-1 block">Tồn kho</label>
        <input type="number" value={form.stock} onChange={e => update("stock", Number(e.target.value))} className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm" />
      </div>
      <div>
        <label className="text-xs text-white/50 mb-1 block">Ngưỡng cảnh báo tồn</label>
        <input type="number" value={form.minStock} onChange={e => update("minStock", Number(e.target.value))} className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm" />
      </div>
    </div>
  );
}