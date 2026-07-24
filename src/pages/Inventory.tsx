import { useState, useMemo } from "react";
import { products, inventoryTransactions } from "../data/site";
import type { InventoryTransaction } from "../data/site";
import { SearchInput, Modal, Badge, EmptyState, generateId, formatCurrency, formatDate } from "../components/Shared";
import { Warehouse, Plus, Search, ArrowDown, ArrowUp, ClipboardList, AlertTriangle, Package, List, Grid3X3 } from "lucide-react";

export function Inventory({ onNavigate }: { onNavigate: (p: string) => void }) {
  const [search, setSearch] = useState("");
  const [transactions, setTransactions] = useState(inventoryTransactions);
  const [showAdd, setShowAdd] = useState(false);
  const [filterType, setFilterType] = useState<"all" | "inbound" | "outbound">("all");
  const [form, setForm] = useState({ productId: "", type: "inbound" as "inbound" | "outbound", quantity: 1, note: "" });
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const productList = useMemo(() => products.filter(p => p.active), []);

  const filteredTransactions = useMemo(() => {
    const q = search.toLowerCase();
    return transactions.filter(t =>
      (filterType === "all" || t.type === filterType) &&
      (t.productName.toLowerCase().includes(q) || t.productCode.toLowerCase().includes(q) || t.ref.toLowerCase().includes(q))
    ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [search, filterType, transactions]);

  const lowStock = useMemo(() => productList.filter(p => p.stock <= p.minStock), [productList]);

  const handleAddTransaction = () => {
    if (!form.productId) return;
    const p = productList.find(x => x.id === form.productId);
    if (!p) return;

    const t: InventoryTransaction = {
      id: generateId(),
      productId: form.productId,
      productName: p.name,
      productCode: p.code,
      type: form.type,
      quantity: form.quantity,
      date: new Date().toISOString().split("T")[0],
      note: form.note,
      ref: form.type === "inbound" ? `NK-${Date.now().toString().slice(-6)}` : `XK-${Date.now().toString().slice(-6)}`,
    };
    setTransactions([t, ...transactions]);
    setShowAdd(false);
    setForm({ productId: "", type: "inbound", quantity: 1, note: "" });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white font-serif">Kho hàng</h1>
          <p className="text-white/50 text-sm mt-1">Quản lý xuất nhập tồn kho</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-sakura-500 to-rose-500 text-white rounded-xl text-sm font-medium hover:opacity-90 transition shadow-lg shadow-sakura-500/20"
        >
          <Plus className="w-4 h-4" /> Giao dịch mới
        </button>
      </div>

      {/* Low stock alerts */}
      {lowStock.length > 0 && (
        <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-4">
          <div className="flex items-center gap-2 text-rose-300 font-medium mb-3">
            <AlertTriangle className="w-4 h-4" /> Sản phẩm cần nhập thêm
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {lowStock.map(p => (
              <div key={p.id} className="flex items-center justify-between text-sm bg-rose-500/10 rounded-xl px-3 py-2">
                <div>
                  <span className="text-white/80">{p.name}</span>
                  <span className="text-white/40 text-xs ml-2">{p.code}</span>
                </div>
                <span className="text-rose-300 font-medium">Còn {p.stock} (min: {p.minStock})</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <SearchInput value={search} onChange={setSearch} placeholder="Tìm theo tên SP, mã, phiếu..." />
        <div className="flex gap-2">
          <button onClick={() => setFilterType("all")} className={`px-3 py-2 rounded-xl text-sm transition ${filterType === "all" ? "bg-sakura-500/30 text-white border border-sakura-500/30" : "bg-white/5 text-white/60 border border-white/10 hover:bg-white/10"}`}>Tất cả</button>
          <button onClick={() => setFilterType("inbound")} className={`px-3 py-2 rounded-xl text-sm transition ${filterType === "inbound" ? "bg-emerald-500/30 text-emerald-300 border border-emerald-500/30" : "bg-white/5 text-white/60 border border-white/10 hover:bg-white/10"}`}>
            <ArrowDown className="w-3 h-3 inline mr-1" />Nhập
          </button>
          <button onClick={() => setFilterType("outbound")} className={`px-3 py-2 rounded-xl text-sm transition ${filterType === "outbound" ? "bg-rose-500/30 text-rose-300 border border-rose-500/30" : "bg-white/5 text-white/60 border border-white/10 hover:bg-white/10"}`}>
            <ArrowUp className="w-3 h-3 inline mr-1" />Xuất
          </button>
        </div>
      </div>

      {/* Stock Overview */}
      <div className="bg-sakura-card rounded-2xl border border-white/10 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-semibold flex items-center gap-2">
            <Package className="w-4 h-4 text-gold-400" /> Tồn kho hiện tại
          </h3>
          <div className="flex gap-1 bg-white/5 rounded-lg p-0.5">
            <button onClick={() => setViewMode("grid")} className={`p-1.5 rounded-md transition ${viewMode === "grid" ? "bg-sakura-500/30 text-white" : "text-white/40 hover:text-white"}`}>
              <Grid3X3 className="w-4 h-4" />
            </button>
            <button onClick={() => setViewMode("list")} className={`p-1.5 rounded-md transition ${viewMode === "list" ? "bg-sakura-500/30 text-white" : "text-white/40 hover:text-white"}`}>
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        {viewMode === "grid" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {productList.map(p => {
              const isLow = p.stock <= p.minStock;
              return (
                <div key={p.id} className={`rounded-xl p-3 border ${isLow ? "border-rose-500/30 bg-rose-500/5" : "border-white/10 bg-white/5"}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-white font-medium truncate">{p.name}</span>
                    <span className="text-xs text-white/40">{p.code}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={`text-lg font-bold ${isLow ? "text-rose-300" : "text-gold-400"}`}>{p.stock}</span>
                    <span className="text-xs text-white/40">Min: {p.minStock}</span>
                  </div>
                  {isLow && <div className="mt-1 text-[10px] text-rose-300 flex items-center gap-1"><AlertTriangle className="w-2.5 h-2.5" />Sắp hết hàng</div>}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-white/10">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-white/5 border-b border-white/10">
                  <th className="text-left px-4 py-3 text-white/50 font-medium">Mã SP</th>
                  <th className="text-left px-4 py-3 text-white/50 font-medium">Tên sản phẩm</th>
                  <th className="text-left px-4 py-3 text-white/50 font-medium">Danh mục</th>
                  <th className="text-right px-4 py-3 text-white/50 font-medium">Giá nhập</th>
                  <th className="text-right px-4 py-3 text-white/50 font-medium">Giá bán</th>
                  <th className="text-right px-4 py-3 text-white/50 font-medium">Giá gốc</th>
                  <th className="text-right px-4 py-3 text-white/50 font-medium">Tồn kho</th>
                  <th className="text-right px-4 py-3 text-white/50 font-medium">Tồn tối thiểu</th>
                  <th className="text-right px-4 py-3 text-white/50 font-medium">Giảm giá</th>
                  <th className="text-center px-4 py-3 text-white/50 font-medium">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {productList.map(p => {
                  const isLow = p.stock <= p.minStock;
                  return (
                    <tr key={p.id} className="hover:bg-white/5 transition">
                      <td className="px-4 py-3 text-white/60 text-xs">{p.code}</td>
                      <td className="px-4 py-3 text-white font-medium">{p.name}</td>
                      <td className="px-4 py-3 text-white/60">{p.category}</td>
                      <td className="px-4 py-3 text-right text-emerald-300">{formatCurrency(p.costPrice)}</td>
                      <td className="px-4 py-3 text-right text-gold-400 font-medium">{formatCurrency(p.sellingPrice)}</td>
                      <td className="px-4 py-3 text-right text-white/60">{formatCurrency(p.originalPrice)}</td>
                      <td className={`px-4 py-3 text-right font-medium ${isLow ? "text-rose-300" : "text-white"}`}>{p.stock}</td>
                      <td className="px-4 py-3 text-right text-white/50">{p.minStock}</td>
                      <td className="px-4 py-3 text-right text-rose-300">{p.discount > 0 ? `${p.discount}%` : "-"}</td>
                      <td className="px-4 py-3 text-center">
                        {isLow ? (
                          <span className="inline-flex items-center gap-1 text-[10px] text-rose-300 bg-rose-500/20 px-2 py-0.5 rounded-full">
                            <AlertTriangle className="w-2.5 h-2.5" /> Sắp hết
                          </span>
                        ) : (
                          <span className="text-[10px] text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded-full">Đủ hàng</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Transaction History */}
      <div className="bg-sakura-card rounded-2xl border border-white/10 p-5">
        <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
          <ClipboardList className="w-4 h-4 text-sakura-400" /> Lịch sử giao dịch
        </h3>
        {filteredTransactions.length === 0 ? (
          <EmptyState message="Chưa có giao dịch" icon={<ClipboardList className="w-12 h-12" />} />
        ) : (
          <div className="space-y-2">
            {filteredTransactions.map(t => (
              <div key={t.id} className="flex items-center justify-between py-2.5 border-b border-white/5 last:border-0">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${t.type === "inbound" ? "bg-emerald-500/20 text-emerald-300" : "bg-rose-500/20 text-rose-300"}`}>
                    {t.type === "inbound" ? <ArrowDown className="w-4 h-4" /> : <ArrowUp className="w-4 h-4" />}
                  </div>
                  <div>
                    <div className="text-sm text-white font-medium">{t.productName}</div>
                    <div className="text-xs text-white/40">{t.productCode} · {t.ref}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-white font-medium">
                    <span className={t.type === "inbound" ? "text-emerald-300" : "text-rose-300"}>
                      {t.type === "inbound" ? "+" : "-"}{t.quantity}
                    </span>
                  </div>
                  <div className="text-xs text-white/40">{formatDate(t.date)}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Transaction Modal */}
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Giao dịch xuất/nhập kho">
        <div className="space-y-4">
          <div>
            <label className="text-xs text-white/50 mb-1 block">Loại giao dịch</label>
            <div className="flex gap-2">
              <button onClick={() => setForm({ ...form, type: "inbound" })} className={`flex-1 px-4 py-3 rounded-xl text-sm transition ${form.type === "inbound" ? "bg-emerald-500/30 text-emerald-300 border border-emerald-500/30" : "bg-white/5 text-white/60 border border-white/10"}`}>
                <ArrowDown className="w-4 h-4 inline mr-1" /> Nhập kho
              </button>
              <button onClick={() => setForm({ ...form, type: "outbound" })} className={`flex-1 px-4 py-3 rounded-xl text-sm transition ${form.type === "outbound" ? "bg-rose-500/30 text-rose-300 border border-rose-500/30" : "bg-white/5 text-white/60 border border-white/10"}`}>
                <ArrowUp className="w-4 h-4 inline mr-1" /> Xuất kho
              </button>
            </div>
          </div>
          <div>
            <label className="text-xs text-white/50 mb-1 block">Sản phẩm *</label>
            <select value={form.productId} onChange={e => setForm({ ...form, productId: e.target.value })} className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm">
              <option value="">Chọn sản phẩm</option>
              {productList.map(p => (
                <option key={p.id} value={p.id}>{p.name} ({p.code}) - Tồn: {p.stock}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-white/50 mb-1 block">Số lượng *</label>
            <input type="number" min={1} value={form.quantity} onChange={e => setForm({ ...form, quantity: Number(e.target.value) })} className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm" />
          </div>
          <div>
            <label className="text-xs text-white/50 mb-1 block">Ghi chú</label>
            <input value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} placeholder="Lý do nhập/xuất..." className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm" />
          </div>
        </div>
        <div className="flex gap-3 mt-5">
          <button onClick={handleAddTransaction} disabled={!form.productId} className="flex-1 px-4 py-2.5 bg-gradient-to-r from-sakura-500 to-rose-500 text-white rounded-xl text-sm font-medium hover:opacity-90 transition disabled:opacity-40">
            Xác nhận
          </button>
          <button onClick={() => setShowAdd(false)} className="px-4 py-2.5 bg-white/10 text-white rounded-xl text-sm hover:bg-white/20 transition">Hủy</button>
        </div>
      </Modal>
    </div>
  );
}