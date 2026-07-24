import { useState, useMemo } from "react";
import { products } from "../data/site";
import type { Product } from "../data/site";
import { SearchInput, EmptyState, formatCurrency } from "../components/Shared";
import { Printer, Search, X, Package, Check } from "lucide-react";

interface LabelItem {
  product: Product;
  barcode: string;
  serial: number;
}

function generateBarcode(productId: string, index: number): string {
  const hash = productId.split("").reduce((s, c) => s + c.charCodeAt(0), 0);
  const seed = (hash * 1000 + index) % 10000000;
  return `8935${String(seed).padStart(7, "0")}`;
}

export function LabelPrintViewer({ items, onClose, title }: {
  items: LabelItem[];
  onClose: () => void;
  title?: string;
}) {
  const handlePrint = () => {
    const pw = window.open("", "_blank");
    if (!pw) return;
    pw.document.write(`
<html><head><title>In nhãn sản phẩm</title>
<style>
  @page { margin: 5mm; size: A4; }
  body { font-family: 'Inter', Arial, sans-serif; margin: 0; padding: 10px; background: #fff; }
  .label-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 6px; padding: 5px; }
  .label-card { border: 2px dashed #ccc; border-radius: 8px; padding: 10px; page-break-inside: avoid; min-height: 110px; display: flex; flex-direction: column; justify-content: center; }
  .logo { font-size: 11px; font-weight: bold; color: #8b1a3b; text-align: center; border-bottom: 1px dashed #ddd; padding-bottom: 4px; margin-bottom: 6px; }
  .name { font-size: 13px; font-weight: 700; color: #222; text-align: center; margin-bottom: 3px; }
  .code { font-size: 10px; color: #888; text-align: center; }
  .barcode-box { text-align: center; margin: 4px 0; font-family: monospace; font-size: 14px; letter-spacing: 2px; color: #333; border: 1px dashed #aaa; padding: 3px; background: #fafafa; }
  .barcode-line { display: flex; justify-content: center; gap: 1px; margin: 2px 0; }
  .barcode-line span { display: inline-block; width: 2px; background: #333; }
  .barcode-line span.thick { width: 4px; }
  .price { font-size: 16px; font-weight: 800; color: #b8860b; text-align: center; }
  @media print {
    body { background: #fff; padding: 0; }
    .label-card { border: 1px dashed #aaa; }
    .no-print { display: none !important; }
  }
</style></head><body>
<div class="no-print" style="text-align:center;margin-bottom:10px;padding:8px;background:#f0f0f0;border-radius:6px;">
  <button onclick="window.print()" style="padding:8px 24px;background:#8b1a3b;color:#fff;border:none;border-radius:6px;font-size:14px;cursor:pointer;">🖨️ In nhãn</button>
  <span style="margin-left:10px;color:#666;font-size:12px;">${items.length} nhãn</span>
</div>
<div class="label-grid">
${items.map(item => {
  const bars = Array.from({ length: 20 }, (_, i) => {
    const w = i % 3 === 0 ? "thick" : "";
    return `<span class="${w}" style="height:${10 + (i % 5) * 3}px"></span>`;
  }).join("");
  return `<div class="label-card">
    <div class="logo">🌸 SAKURA SPA</div>
    <div class="name">${item.product.name}</div>
    <div class="code">${item.product.code}</div>
    <div class="barcode-line">${bars}</div>
    <div class="barcode-box">${item.barcode}</div>
    <div class="price">${formatCurrency(item.product.sellingPrice)}</div>
  </div>`;
}).join("")}
</div>
</body></html>`);
    pw.document.close();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop" onClick={onClose}>
      <div className="bg-gradient-to-br from-[#2d1b2e] to-[#3d1f2e] border border-white/10 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto animate-fade-in" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <h3 className="text-lg font-semibold text-white font-serif">{title || "Xem trước nhãn in"}</h3>
          <button onClick={onClose} className="text-white/50 hover:text-white p-1 rounded-lg hover:bg-white/10 transition">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div className="flex items-center gap-2 text-sm text-white/60">
            <Package className="w-4 h-4 text-gold-400" />
            <span>{items.length} nhãn sẵn sàng in</span>
          </div>
          {/* Preview cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {items.slice(0, 10).map((item, i) => (
              <div key={i} className="border-2 border-dashed border-white/20 rounded-xl p-3 bg-white/5 text-center">
                <div className="text-[10px] font-bold text-sakura-300 mb-1">🌸 SAKURA SPA</div>
                <div className="text-sm font-bold text-white truncate">{item.product.name}</div>
                <div className="text-[10px] text-white/40">{item.product.code}</div>
                <div className="my-2 flex justify-center gap-0.5">
                  {Array.from({ length: 15 }, (_, j) => (
                    <span key={j} className="inline-block w-[2px] bg-white/60" style={{ height: 6 + (j % 5) * 2 }}></span>
                  ))}
                </div>
                <div className="text-[10px] font-mono tracking-wider text-white/70 bg-white/10 rounded px-1 py-0.5">
                  {item.barcode}
                </div>
                <div className="text-base font-extrabold text-gold-400 mt-1">
                  {formatCurrency(item.product.sellingPrice)}
                </div>
              </div>
            ))}
          </div>
          {items.length > 10 && (
            <p className="text-center text-xs text-white/40">... và {items.length - 10} nhãn khác</p>
          )}
          <div className="flex gap-3 pt-2">
            <button onClick={handlePrint} className="flex-1 px-4 py-2.5 bg-gradient-to-r from-sakura-500 to-rose-500 text-white rounded-xl text-sm font-medium hover:opacity-90 transition shadow-lg shadow-sakura-500/20 flex items-center justify-center gap-2">
              <Printer className="w-4 h-4" /> In nhãn
            </button>
            <button onClick={onClose} className="px-4 py-2.5 bg-white/10 text-white/70 rounded-xl text-sm hover:bg-white/20 transition">
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function Labels() {
  const [search, setSearch] = useState("");
  const [printQueue, setPrintQueue] = useState<LabelItem[]>([]);
  const [showPrintViewer, setShowPrintViewer] = useState(false);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return products.filter(p =>
      p.active &&
      (p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q) || p.barcode.includes(q))
    );
  }, [search]);

  const queueAdd = (product: Product) => {
    const label: LabelItem = {
      product,
      barcode: product.barcode,
      serial: 1,
    };
    setPrintQueue(prev => [...prev, label]);
  };

  const queueAddAll = () => {
    const all = filtered.map(p => ({
      product: p,
      barcode: p.barcode,
      serial: 1,
    }));
    setPrintQueue(prev => [...prev, ...all]);
  };

  const clearQueue = () => setPrintQueue([]);

  const handlePrintQueue = () => {
    if (printQueue.length === 0) return;
    setShowPrintViewer(true);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white font-serif">In nhãn sản phẩm</h1>
          <p className="text-white/50 text-sm mt-1">In label barcode, giá bán cho sản phẩm</p>
        </div>
        <div className="flex gap-2">
          {printQueue.length > 0 && (
            <>
              <button onClick={clearQueue} className="px-3 py-2 bg-white/10 text-white/60 rounded-xl text-xs hover:bg-white/20 transition">
                Xoá hàng chờ ({printQueue.length})
              </button>
              <button onClick={handlePrintQueue} className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-sakura-500 to-rose-500 text-white rounded-xl text-sm font-medium hover:opacity-90 transition shadow-lg shadow-sakura-500/20">
                <Printer className="w-4 h-4" /> In {printQueue.length} nhãn
              </button>
            </>
          )}
        </div>
      </div>

      <SearchInput value={search} onChange={setSearch} placeholder="Tìm sản phẩm để in nhãn..." />

      {filtered.length === 0 ? (
        <EmptyState message="Không tìm thấy sản phẩm" icon={<Package className="w-12 h-12" />} />
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-white/40">{filtered.length} sản phẩm</span>
            <button onClick={queueAddAll} className="text-xs text-gold-400 hover:text-gold-300 flex items-center gap-1">
              <Check className="w-3 h-3" /> Chọn tất cả in
            </button>
          </div>
          <div className="overflow-x-auto rounded-xl border border-white/10">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-white/5 border-b border-white/10">
                  <th className="text-left px-4 py-3 text-white/50 font-medium">Sản phẩm</th>
                  <th className="text-left px-4 py-3 text-white/50 font-medium">Mã SP</th>
                  <th className="text-left px-4 py-3 text-white/50 font-medium">Barcode</th>
                  <th className="text-left px-4 py-3 text-white/50 font-medium">Giá bán</th>
                  <th className="text-center px-4 py-3 text-white/50 font-medium w-20">In</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map(p => (
                  <tr key={p.id} className="hover:bg-white/5 transition">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center overflow-hidden shrink-0">
                          {p.image ? (
                            <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                          ) : (
                            <Package className="w-4 h-4 text-white/30" />
                          )}
                        </div>
                        <div>
                          <div className="text-white font-medium">{p.name}</div>
                          <div className="text-[10px] text-white/40">{p.category}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-white/60">{p.code}</td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-[11px] text-white/60 bg-white/5 px-2 py-0.5 rounded">{p.barcode}</span>
                    </td>
                    <td className="px-4 py-3 text-gold-400 font-semibold">{formatCurrency(p.sellingPrice)}</td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => queueAdd(p)}
                        className="p-1.5 rounded-lg bg-white/10 text-white/60 hover:text-white hover:bg-sakura-500/30 transition"
                        title="Thêm vào hàng chờ in"
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showPrintViewer && printQueue.length > 0 && (
        <LabelPrintViewer
          items={printQueue}
          onClose={() => { setShowPrintViewer(false); }}
          title="In nhãn sản phẩm"
        />
      )}
    </div>
  );
}