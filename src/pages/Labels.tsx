import { useState, useMemo } from "react";
import { products } from "../data/site";
import type { Product } from "../data/site";
import { SearchInput, EmptyState, formatCurrency } from "../components/Shared";
import { Printer, Search, X, Package, Check, Plus, Minus, Settings2, Eye, RotateCcw } from "lucide-react";
import { generateId } from "../components/Shared";
import { loadLabelConfig, saveLabelConfig, DEFAULT_LABEL_CONFIG, type LabelConfig } from "../types/label";

/* Generate a unique 13-digit barcode similar to Code 128 retail format */
const BC_BASE = 8935000;
function makeUniqueBarcode(): string {
  const seed = Date.now() % 1000000;
  return String(BC_BASE + seed).padStart(13, "0");
}

interface LabelItem {
  product: Product;
  barcode: string;
  serial: number;
}

/* ─── helpers for print HTML generation ─── */

const STORAGE_KEY = "sakura_spa_label_config_v1";

function buildPrintHtml(items: LabelItem[], cfg: LabelConfig): string {
  const wMm = cfg.widthMm || 35;
  const hMm = cfg.heightMm || 22;
  const cols = Math.max(1, Math.floor(190 / wMm));
  const bhPx = cfg.barcodeHeightPx || 30;
  const fsSmall = cfg.fontSizeSmall || 8;
  const fontMed = cfg.fontSizeMedium || 11;

  let scriptLines: string[] = [];
  if (items.length > 0) {
    scriptLines.push(`try{JsBarcode("#b${0}","${items[0].barcode}",{format:"CODE128",width:1,height:${bhPx},displayValue:false,fontSize:${fsSmall},margin:1})}catch(e){}`);
    items.slice(1).forEach((it,i) => {
      scriptLines.push(`try{JsBarcode("#b${i+1}","${it.barcode}",{format:"CODE128",width:1,height:${bhPx},displayValue:false,fontSize:${fsSmall},margin:1});}catch(e){}`);
    });
  }

  const htmlLabels = items.map((item,idx)=>{
    const p=item.product;
    let s:string[]=[];
    if(cfg.showShopName)s.push(`<span class="sn">Sakura Spa &amp; Beauty</span>`);
    if(cfg.showProductName)s.push(`<span class="pn">${p.name}</span>`);
    if(cfg.showProductCode && p.code)s.push(`<span class="ml">${p.code}${cfg.showBarcodeValue?" · ":""}</span>`);
    else if(!cfg.showProductCode&&cfg.showBarcodeValue)s.push(`<span class="ml">${p.barcode}</span>`);
    else if(cfg.showDiscountBadge&&p.discount>0)s.push(`<span class="db">-${p.discount}%</span>`);
    if(cfg.showPrice)s.push(`<span class="ps">${formatCurrency(p.sellingPrice)}</span>`);
    return `<div class="lc"><div style="display:flex;flex-direction:column;align-items:center;justify-content:start;height:100%;gap:0.5mm;">${s.join("")}<svg id="b${idx}" class="bc"></svg></div></div>`;
  }).join("");

  return `<!DOCTYPE html><html><head><title>In nhãn — Sakura Spa</title>
<script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.6/dist/JsBarcode.all.min.js"></script>
<style>
  @page{margin:8mm}
  body{font-family:'Inter',Arial,sans-serif;margin:0;padding:4px;background:#fff}
  .lg{display:grid;grid-template-columns:repeat(${cols},${wMm}mm);gap:2mm;justify-content:center;padding:2px}
  .lc{border:1px dashed #aaa;border-radius:3px;padding:2mm;box-sizing:border-box;height:${hMm}mm;display:flex;overflow:hidden}
  .sn{font-size:7px;font-weight:bold;color:#8b1a3b;text-align:center}
  .pn{font-size:${fontMed||9}px;font-weight:700;color:#222;text-align:center;max-width:100%;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .ml{font-size:${Math.max(fsSmall-1,6)}px;color:#666;text-align:center;white-space:nowrap}
  .ps{font-size:${Math.max(fsSmall+3,11)}px;font-weight:800;color:#b8860b;text-align:center}
  .db{position:absolute;top:2mm;right:2mm;font-size:7px;background:#e74c3c;color:#fff;padding:1px 3px;border-radius:3px;font-weight:700}
  svg.bc{display:block;width:calc(${wMm}mm - 4px)!important;height:${bhPx}px!important}
  @media print{body{padding:0}.no-print{display:none}}
</style></head><body>
<div class="no-print" style="text-align:center;margin-bottom:8px">
  <button onclick="window.print()" style="padding:6px 24px;background:#8b1a3b;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:13px;font-weight:600">In (${items.length} nhãn)</button>
</div>
<div class="lg">${htmlLabels}</div>
<script>${scriptLines.join(";")}</script></body></html>`;
}


export function LabelPrintViewer({ items, onClose, title }: {
  items: LabelItem[];
  onClose: () => void;
  title?: string;
}) {
  const [cfg] = useState(loadLabelConfig);

  const handlePrint = () => {
    const html = buildPrintHtml(items, cfg);
    const pw = window.open("", "_blank", "width=600,height=800");
    if (!pw) return;
    try { pw.document.write(html); } catch {}
    pw.document.close();
  };

  const fieldLabels = [
    cfg.showShopName && "Tên shop",
    cfg.showProductName && "Tên SP",
    cfg.showProductCode && "Mã SP",
    cfg.showBarcodeValue && "Barcode",
    cfg.showPrice && "Giá bán",
  ].filter(Boolean).join(" | ");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop" onClick={onClose}>
      <div className="bg-gradient-to-br from-[#2d1b2e] to-[#3d1f2e] border border-white/10 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto animate-fade-in" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <h3 className="text-lg font-semibold text-white font-serif">{title || "Xem trước nhãn in"}</h3>
          <button onClick={onClose} className="text-white/50 hover:text-white p-1 rounded-lg hover:bg-white/10 transition"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div className="flex flex-wrap items-center gap-3 text-xs text-white/40">
            <span>{cfg.widthMm}×{cfg.heightMm} mm</span>
            {fieldLabels && <>{"·"}<span>{fieldLabels}</span></>}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {items.slice(0, 12).map((item, i) => (
              <div key={i} className={`border ${cfg.showPrice ? 'border-dashed border-gold-400/30' : 'border-gray-600/30'} rounded-xl p-2 bg-white/[0.03]`} style={{ width: `${Math.round(cfg.widthMm * 3)}px`, height: `${Math.round(cfg.heightMm * 2.5)}px` }}>
                {cfg.showShopName && <div className="text-[8px] font-bold text-sakura-300 mb-0.5">SAKURA SPA</div>}
                {cfg.showProductName && <div className="text-[9px] font-bold text-white truncate leading-tight">{item.product.name}</div>}
                {cfg.showProductCode && <div className="text-[7px] text-white/30">{item.product.code}</div>}
                {cfg.showBarcodeValue && <div className="text-[7px] font-mono tracking-wider text-white/40 bg-white/5 rounded px-0.5 mt-0.5">{item.barcode}</div>}
                {cfg.showPrice && <div className="text-[9px] font-extrabold text-gold-400">{formatCurrency(item.product.sellingPrice)}</div>}
                {cfg.showDiscountBadge && item.product.discount > 0 && (
                  <div className="absolute top-0 right-0 text-[6px] bg-red-600 text-white px-1 rounded">-{item.product.discount}%</div>
                )}
              </div>
            ))}
          </div>
          {items.length > 12 && <p className="text-center text-xs text-white/40">... và {items.length - 12} nhãn khác</p>}
          <div className="pt-2 flex gap-3">
            <button onClick={handlePrint} className="flex-1 px-4 py-2.5 bg-gradient-to-r from-sakura-500 to-rose-500 text-white rounded-xl text-sm font-medium hover:opacity-90 transition shadow-lg shadow-sakura-500/20 flex items-center justify-center gap-2">
              <Printer className="w-4 h-4" /> In nhãn
            </button>
            <button onClick={() => { localStorage.removeItem(STORAGE_KEY); }} className="px-3 py-2.5 bg-white/10 text-white/50 rounded-xl text-xs hover:bg-white/20 transition" title="Reset cấu hình mặc định">
              <RotateCcw className="w-4 h-4" /> Reset
            </button>
            <button onClick={onClose} className="px-4 py-2.5 bg-white/10 text-white/70 rounded-xl text-sm hover:bg-white/20 transition">Đóng</button>
          </div>
        </div>
      </div>
    </div>
  );
}


const PRESET_DISPLAY = [
  { label: "35x22 mm (tiêu chuẩn)", mw: 35, mh: 22 },
  { label: "50x30 mm (nhỏ)", mw: 50, mh: 30 },
  { label: "60x40 mm (vừa)", mw: 60, mh: 40 },
  { label: "Avery 5160 (63.5 x 38.1 mm)", mw: 63.5, mh: 38.1 },
];

export function LabelConfigEditor({ open, onClose, onSave }: {
  open: boolean;
  onClose: () => void;
  onSave: (cfg: LabelConfig) => void;
}) {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const [_setCfg] = useState(() => loadLabelConfig());
  const [cfg, setCfg] = useState<LabelConfig>(loadLabelConfig);

  useEffect(() => {
    setCfg(loadLabelConfig());
  }, [open]);

  if (!open) return null;

  const applyPreset = (mw: number, mh: number) => {
    setCfg(prev => ({ ...prev, preset: "custom" as const, widthMm: mw, heightMm: mh }));
  };

  const toggleField = (key: keyof Pick<LabelConfig,"showShopName"| "showProductName"| "showProductCode"| "showBarcodeValue"| "showPrice"| "showDiscountBadge">) => {
    setCfg(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = () => {
    saveLabelConfig(cfg);
    onSave(cfg);
  };

  const sampleProduct = products.find(p => p.active);
  const sampleName = sampleProduct?.name || "Kem Dưỡng Ẩm Sakura";
  const sampleCode = sampleProduct?.code || "SP001";
  const samplePrice = sampleProduct ? formatCurrency(sampleProduct.sellingPrice) : "350,000₫";
  const sampleBar = sampleProduct?.barcode || "8935000100001";
  const sampleDisc = sampleProduct?.discount || 22;

  interface FieldDef extends Record<string,string>{} 
  const fields:[keyof Pick<LabelConfig,"showShopName"| "showProductName"| "showProductCode"| "showBarcodeValue"| "showPrice"| "showDiscountBadge">,string][] = [
    ["showShopName","Tên cửa hàng"],
    ["showProductName","Tên sản phẩm"],
    ["showProductCode","Mã sản phẩm"],
    ["showBarcodeValue","Số barcode"],
    ["showPrice","Giá bán"],
    ["showDiscountBadge","Giảm giá (%)"],
  ] as const;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop" onClick={onClose}>
      <div className="bg-gradient-to-br from-[#2d1b2e] to-[#3d1f2e] border border-white/10 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-fade-in" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <h3 className="text-lg font-semibold text-white font-serif flex items-center gap-2">
            <Settings2 className="w-5 h-5 text-gold-400" /> Cấu hình Nhãn
          </h3>
          <button onClick={onClose} className="text-white/50 hover:text-white p-1 rounded-lg hover:bg-white/10 transition"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-5 space-y-5">

          <section>
            <h4 className="text-sm font-semibold text-white/80 mb-3">Kích thước nhãn</h4>
            <div className="space-y-2">
              {PRESET_DISPLAY.map(({ label, mw, mh }) => (
                <button key={String(mw)} onClick={() => applyPreset(mw,mh)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition border ${
                    Math.abs(cfg.widthMm-mw)<0.5?"bg-sakura-500/30 border-sakura-400/50 text-white":"bg-white/5 border-white/10 text-white/50 hover:bg-white/10"
                  }`}>{label}</button>
              ))}
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <label className="block">
                <span className="text-xs text-white/40 block mb-1">Rộng (mm)</span>
                <input type="number" min={20} max={150} value={cfg.widthMm} onChange={e=>setCfg(pr=>({...pr,widthMm:Math.max(20,Number(e.target.value)||20),preset:"custom"}))} className="w-full bg-white/10 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-sakura-400 outline-none"/>
              </label>
              <label className="block">
                <span className="text-xs text-white/40 block mb-1">Cao (mm)</span>
                <input type="number" min={15} max={150} value={cfg.heightMm} onChange={e=>setCfg(pr=>({...pr,heightMm:Math.max(15,Number(e.target.value)||15),preset:"custom"}))} className="w-full bg-white/10 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-sakura-400 outline-none"/>
              </label>
            </div>
          </section>

          <section>
            <h4 className="text-sm font-semibold text-white/80 mb-3">Thông tin hiển thị trên nhãn</h4>
            <div className="grid grid-cols-2 gap-2">
              {fields.map(([key,label])=>(
                <label key={key} className="flex items-center gap-2 cursor-pointer group select-none">
                  <input type="checkbox" checked={cfg[key]} onChange={()=>toggleField(key)} className="sr-only peer"/>
                  <span className={`w-4 h-4 rounded border shrink-0 flex items-center justify-center transition ${cfg[key]?"bg-sakura-500 border-sakura-400":"bg-transparent border-white/20"}`}>
                    {cfg[key]&&<Check className="w-3 h-3 text-white"/>}
                  </span>
                  <span className="text-xs text-white/60 group-hover:text-white/80 transition">{label}</span>
                </label>
              ))}
            </div>
          </section>

          <section>
            <h4 className="text-sm font-semibold text-white/80 mb-3">Kiểu chữ & Barcode</h4>
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="text-xs text-white/40 block mb-1">Cỡ chữ nhỏ</span>
                <input type="number" min={6} max={16} value={cfg.fontSizeSmall} onChange={e=>setCfg(pr=>({...pr,fontSizeSmall:Math.min(16,Math.max(6,Number(e.target.value)||6))}))} className="w-full bg-white/10 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-sakura-400 outline-none"/>
              </label>
              <label className="block">
                <span className="text-xs text-white/40 block mb-1">Cỡ chữ tên SP</span>
                <input type="number" min={8} max={20} value={cfg.fontSizeMedium} onChange={e=>setCfg(pr=>({...pr,fontSizeMedium:Math.min(20,Math.max(8,Number(e.target.value)||8))}))} className="w-full bg-white/10 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-sakura-400 outline-none"/>
              </label>
              <label className="col-span-2">
                <span className="text-xs text-white/40 block mb-1">Chiều cao barcode (px)</span>
                <input type="range" min={15} max={60} value={cfg.barcodeHeightPx} onChange={e=>setCfg(pr=>({...pr,barcodeHeightPx:Number(e.target.value)}))} className="w-full accent-sakura-500"/>
                <span className="text-xs text-white/60 float-right">{cfg.barcodeHeightPx}px</span>
              </label>
            </div>
          </section>

          <section>
            <h4 className="text-sm font-semibold text-white/80 mb-2">Xem mẫu</h4>
            <div className="bg-black/30 rounded-xl p-4 border border-white/10 flex items-center justify-center">
              <div className="border border-dashed border-gold-400/30 rounded-lg p-3 flex flex-col items-center justify-start gap-0.5 text-center relative" style={{width:160,height:110}}>
                {cfg.showShopName&&<div className="text-[7px] text-sakura-300 font-bold uppercase">SAKURA SPA</div>}
                {cfg.showProductName&&<div className="text-[9px] text-white font-bold leading-tight max-w-[140px] truncate">{sampleName}</div>}
                {cfg.showProductCode&&<div className="text-[7px] text-white/30">{sampleCode}</div>}
                {cfg.showBarcodeValue&&<div className="text-[6px] font-mono text-white/50 truncate max-w-[140px]">{sampleBar}</div>}
                {cfg.showPrice&&<div className="text-[10px] text-gold-400 font-extrabold">{samplePrice}</div>}
                {cfg.showDiscountBadge&&sampleDisc>0&&<div className="text-[6px] bg-red-600 text-white px-1 rounded absolute top-2 right-2">-{sampleDisc}%</div>}
              </div>
            </div>
          </section>
        </div>

        <div className="p-5 pt-0 border-t border-white/10">
          <div className="flex gap-3">
            <button onClick={handleSave} className="flex-1 px-4 py-2.5 bg-gradient-to-r from-sakura-500 to-rose-500 text-white rounded-xl text-sm font-medium hover:opacity-90 transition shadow-lg shadow-sakura-500/20 flex items-center justify-center gap-2">
              <Check className="w-4 h-4" /> Lưu và đóng
            </button>
            <button onClick={()=>setCfg(DEFAULT_LABEL_CONFIG)} className="px-3 py-2.5 bg-white/10 text-white/50 rounded-xl text-xs hover:bg-white/20 transition">Mặc định</button>
            <button onClick={onClose} className="px-4 py-2.5 bg-white/10 text-white/70 rounded-xl text-sm hover:bg-white/20 transition">Hủy</button>
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
  const [bulkCount, setBulkCount] = useState<Record<string,number>>({});
  const [showBulk, setShowBulk] = useState<string|null>(null);
  const [showConfigEditor, setShowConfigEditor] = useState(false);
  const [configSaved, setConfigSaved] = useState(false);

  const filtered = useMemo(()=>{
    const q=search.toLowerCase();
    return products.filter(p=>p.active&&(p.name.toLowerCase().includes(q)||p.code.toLowerCase().includes(q)||p.barcode.includes(q)));
  },[search]);

  const queueAdd=(product:Product,count:number=1)=>{
    const newItems:LabelItem[]=[];
    for(let i=0;i<count;i++){
      newItems.push({product,barcode:i===0?product.barcode:makeUniqueBarcode(),serial:printQueue.length+newItems.length+1});
    }
    setPrintQueue(prev=>[...prev,...newItems]);
    setShowBulk(null);
  };

  const queueRemove=(idx:number)=>{setPrintQueue(prev=>prev.filter((_,i)=>i!==idx));};
  const queueClear=()=>{setPrintQueue([]);};
  const showPreview=()=>{setShowConfigEditor(false);if(printQueue.length>0)setShowPrintViewer(true);};

  useEffect(()=>{if(configSaved){setTimeout(()=>setConfigSaved(false),1500);}},[configSaved]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white font-serif">In nhãn sản phẩm</h1>
          <p className="text-white/50 text-sm mt-1">Chọn sản phẩm để in mã vạch và thông tin</p>
        </div>
        {configSaved&&<span className="text-green-400 text-xs font-medium flex items-center gap-1">{`\u2713`} Đã lưu cấu hình</span>}
      </div>

      <SearchInput placeholder="Tìm theo tên, mã sp hoặc barcode..." value={search} onChange={setSearch} icon={<Search className="w-4 h-4"/>} clearable/>

      {/* Layout: Left list + Right queue */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
            <table className="w-full">
              <thead className="border-b border-white/10 bg-white/5">
                <tr className="text-xs uppercase text-white/40">
                  <th className="text-left px-4 py-3 font-medium">Sản phẩm</th>
                  <th className="text-left px-4 py-3 font-medium hidden sm:table-cell">Mã SP</th>
                  <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Barcode</th>
                  <th className="text-left px-4 py-3 font-medium">Giá</th>
                  <th className="text-right px-4 py-3 font-medium">in nhanh</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length===0?(<EmptyState icon={Package} message="Không tìm thấy sản phẩm nào."/>):(
                  filtered.map(product=>{
                    const qty=bulkCount[product.id]||1;
                    const queued=printQueue.filter(i=>i.product.id===product.id).length;
                    return(
                      <tr key={product.id} className="border-b border-white/5 hover:bg-white/[0.03] transition">
                        <td className="px-4 py-3">
                          <div className="font-medium text-sm text-white">{product.name}</div>
                          {product.originalPrice>product.sellingPrice&&(<div className="text-[10px] text-emerald-400">Tiết kiệm {product.discount}%</div>)}
                        </td>
                        <td className="px-4 py-3 text-sm text-white/40 hidden sm:table-code">{product.code}</td>
                        <td className="px-4 py-3 hidden md:table-cell"><code className="text-[10px] bg-white/10 px-2 py-1 rounded text-white/50 font-mono">{product.barcode}</code></td>
                        <td className="px-4 py-3 font-medium text-sm text-gold-400">{formatCurrency(product.sellingPrice)}</td>
                        <td className="px-4 py-3 text-right">
                          <div className="inline-flex items-center gap-1">
                            <button onClick={()=>{const b=bulkCount[product.id]||1;setBulkCount(pr=>({...pr,[product.id]:Math.max(1,b-1)}))}} className="p-1 bg-white/10 hover:bg-white/20 rounded transition"><Minus className="w-3 h-3 text-white/60"/></button>
                            <input type="number" min={1} max={100} value={qty} onChange={(e)=>{setBulkCount(prev=>({...prev,[product.id]:Number(e.target.value)||1}))}} className="w-10 bg-white/10 border border-white/10 rounded px-1 py-1 text-center text-white text-xs"/>
                            <button onClick={()=>{const b=bulkCount[product.id]||1;setBulkCount(pr=>({...pr,[product.id]:Math.min(100,b+1)}))}} className="p-1 bg-white/10 hover:bg-white/20 rounded transition"><Plus className="w-3 h-3 text-white/60"/></button>
                            <button onClick={()=>queueAdd(product,qty)} className="ml-1 px-3 py-1 bg-gradient-to-r from-sakura-500 to-rose-500 text-white rounded-lg text-xs font-medium hover:opacity-90 transition" title={queued>0?`Đã thêm ${queued} cái vào hàng chờ`:undefined}><Printer className="w-3 h-3 inline"/>{` `}+ in {queued>0&&<span className="ml-1 bg-white/20 rounded-full w-4 h-4 inline-block text-[9px] text-center leading-3">{queued}</span>}</button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* RIGHT: Queue sidebar */}
        <div className="xl:col-span-1">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 sticky top-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-white/80 flex items-center gap-2">
                <Printer className="w-4 h-4 text-sakura-400"/> Hàng chờ in
              </h3>
              <div className="flex gap-2">
                <button onClick={()=>setShowConfigEditor(true)} className="p-1.5 bg-white/5 hover:bg-white/10 rounded-lg transition" title="Cấu hình nhãn"><Settings2 className="w-3.5 h-3.5 text-white/40"/></button>
                {printQueue.length>0&&(<>
                  <button onClick={showPreview} className="p-1.5 bg-white/5 hover:bg-white/10 rounded-lg transition" title="Xem trước"><Eye className="w-3.5 h-3.5 text-gold-400"/></button>
                  <button onClick={queueClear} className="p-1.5 bg-red-500/10 hover:bg-red-500/20 rounded-lg transition" title="Xóa tất cả"><X className="w-3 h-3 text-red-400"/></button>
                </>)}
              </div>
            </div>
            {printQueue.length===0?(<EmptyState icon={Package} small message="Chưa có nhãn nào trong hàng chờ"/>):(
              <>
                <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
                  {printQueue.map((item,idx)=>(
                    <div key={idx} className="flex items-start justify-between bg-white/5 rounded-lg p-2 text-sm">
                      <div className="min-w-0">
                        <div className="truncate text-white/80 text-xs font-medium">{item.product.name}</div>
                        <div className="text-[10px] text-white/30 font-mono">{item.barcode}</div>
                      </div>
                      <button onClick={()=>queueRemove(idx)} className="shrink-0 ml-1 p-0.5 hover:bg-white/10 rounded transition"><X className="w-3 h-3 text-white/30"/></button>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/10">
                  <span className="text-xs text-white/40">{printQueue.length} nhãn</span>
                  <button onClick={showPreview} disabled={printQueue.length===0} className="px-3 py-1.5 bg-gradient-to-r from-sakura-500 to-rose-500 text-white rounded-lg text-xs font-medium hover:opacity-90 transition disabled:opacity-30">{`\u{1F441}`} Xem trước & In</button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {!showBulk&&(
        <section>
          <h3 className="text-sm font-semibold text-white/60 mb-3">Nhắn lại từ đơn hàng</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {filtered.slice(-8).reverse().map(product=>(
              <button key={product.id} onClick={()=>queueAdd(product,1)} className="group bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl p-3 text-left transition duration-150">
                <div className="font-medium text-xs text-white/80 truncate">{product.name}</div>
                <div className="text-[10px] text-white/30 font-mono">{product.code}</div>
                <div className="text-[10px] text-white/30 font-mono mt-1 truncate">Bar: {product.barcode}</div>
                <div className="text-xs font-bold text-gold-400 mt-1">{formatCurrency(product.sellingPrice)}</div>
                <div className="text-[10px] text-sakura-400/60 mt-0.5 opacity-0 group-hover:opacity-100 transition">Nhấn để in nhanh một bản</div>
              </button>
            ))}
          </div>
        </section>
      )}

      {showPrintViewer&&(<LabelPrintViewer items={printQueue} onClose={()=>setShowPrintViewer(false)} title="Xem trước & In nhãn"/>)}
      <LabelConfigEditor open={showConfigEditor} onClose={()=>setShowConfigEditor(false)} onSave={(c)=>{/* no-op stub -- state managed via localStorage */void c;setConfigSaved(true);}}/>
    </div>
  );
}
