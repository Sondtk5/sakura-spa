import { useState, useMemo, useRef, useEffect } from "react";
import { invoices as initialInvoices, customers, services, products, siteConfig, defaultSettings } from "../data/site";
import type { Invoice, InvoiceItem, ReturnExchangeRecord, ReturnExchangeItem } from "../data/site";
import { SearchInput, Modal, Badge, EmptyState, generateId, formatCurrency, formatDate, formatDateTime } from "../components/Shared";
import { FileText, Plus, Printer, Edit3, Trash2, User, Package, Sparkles, X, Minus, Search, ShoppingCart, RotateCcw, History, Eye } from "lucide-react";

const STORAGE_KEY = "sakura_sp_invoices_v1";
const RE_STORAGE_KEY = "sakura_sp_return_exchanges_v1";

function loadInvoices(): Invoice[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return initialInvoices;
}

function saveInvoices(list: Invoice[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

function loadReturnExchanges(): ReturnExchangeRecord[] {
  try {
    const raw = localStorage.getItem(RE_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return defaultSettings.returnExchanges;
}

function saveReturnExchanges(list: ReturnExchangeRecord[]) {
  localStorage.setItem(RE_STORAGE_KEY, JSON.stringify(list));
}

export function Invoices({ onNavigate }: { onNavigate: (p: string) => void }) {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [invoiceList, setInvoiceList] = useState<Invoice[]>(() => loadInvoices());
  const [showCreate, setShowCreate] = useState(false);
  const [editingInvId, setEditingInvId] = useState<string | null>(null);
  const [printAfterSave, setPrintAfterSave] = useState<"none" | "this">("none");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Return/Exchange state
  const [returnExchanges, setReturnExchanges] = useState<ReturnExchangeRecord[]>(() => loadReturnExchanges());
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returnInvoiceId, setReturnInvoiceId] = useState<string | null>(null);
  const [returnItems, setReturnItems] = useState<{ itemId: string; itemName: string; type: "service" | "product"; maxQty: number; returnQty: number; reason: string }[]>([]);
  const [returnNote, setReturnNote] = useState("");
  const [showReturnHistory, setShowReturnHistory] = useState(false);
  const [returnHistoryForCustomer, setReturnHistoryForCustomer] = useState<string | null>(null);

  // New invoice form
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [customerSearch, setCustomerSearch] = useState("");
  const [items, setItems] = useState<{ type: "service" | "product"; id: string; name: string; unitPrice: number; quantity: number; discount: number }[]>([]);
  const [itemSearch, setItemSearch] = useState("");
  const [itemType, setItemType] = useState<"service" | "product">("service");
  const [paymentMethod, setPaymentMethod] = useState<"Tiền mặt" | "Chuyển khoản" | "Thẻ">("Tiền mặt");
  const [invoiceNotes, setInvoiceNotes] = useState("");
  const [globalDiscount, setGlobalDiscount] = useState(0);
  const [showItemSuggestions, setShowItemSuggestions] = useState(false);
  const itemSearchRef = useRef<HTMLDivElement>(null);

  // Editing state
  const [editFormItems, setEditFormItems] = useState<InvoiceItem[]>([]);
  const [editPaymentMethod, setEditPaymentMethod] = useState<"Tiền mặt" | "Chuyển khoản" | "Thẻ">("Tiền mặt");

  // Persist invoices
  useEffect(() => { saveInvoices(invoiceList); }, [invoiceList]);
  useEffect(() => { saveReturnExchanges(returnExchanges); }, [returnExchanges]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return invoiceList.filter(inv =>
      (filterStatus === "all" || inv.status === filterStatus) &&
      (inv.invoiceNo.toLowerCase().includes(q) || inv.customerName.toLowerCase().includes(q) || inv.customerPhone.includes(q))
    );
  }, [search, filterStatus, invoiceList]);

  const filteredCustomers = useMemo(() => {
    const q = customerSearch.toLowerCase();
    return customers.filter(c => c.name.toLowerCase().includes(q) || c.phone.includes(q));
  }, [customerSearch]);

  const serviceItems = useMemo(() => services.filter(s => s.active), []);
  const productItems = useMemo(() => products.filter(p => p.active && p.stock > 0), []);
  const availableItems = itemType === "service" ? serviceItems : productItems;
  const filteredItems = useMemo(() => {
    const q = itemSearch.toLowerCase();
    return availableItems.filter(it => it.name.toLowerCase().includes(q) || it.code.toLowerCase().includes(q));
  }, [itemSearch, availableItems, itemType]);

  // Item suggestions (fuzzy, max 6 items)
  const itemSuggestions = useMemo(() => {
    if (!itemSearch.trim()) return [];
    const q = itemSearch.toLowerCase();
    return availableItems.filter(it => it.name.toLowerCase().includes(q) || it.code.toLowerCase().includes(q)).slice(0, 6);
  }, [itemSearch, availableItems]);

  const addItem = (type: "service" | "product", id: string, name: string, price: number) => {
    setItems(prev => {
      const existing = prev.find(it => it.id === id && it.type === type);
      if (existing) return prev.map(it => it.id === id && it.type === type ? {...it, quantity: it.quantity + 1} : it);
      return [...prev, { type, id, name, unitPrice: price, quantity: 1, discount: 0 }];
    });
    setItemSearch("");
    setShowItemSuggestions(false);
  };

  const updateItemQty = (idx: number, delta: number) => {
    setItems(prev => prev.map((it,i) => i===idx ? {...it, quantity: Math.max(1, it.quantity+delta)} : it));
  };

  const removeItem = (idx: number) => {
    setItems(prev => prev.filter((_,i) => i !== idx));
  };

  const subtotal = useMemo(() => items.reduce((s,it) => s + it.unitPrice * it.quantity, 0), [items]);
  const itemDisc = useMemo(() => items.reduce((s,it) => s + it.unitPrice * it.quantity * it.discount / 100, 0), [items]);
  const total = subtotal - itemDisc - globalDiscount;

  const handleCreateInvoice = () => {
    if (!selectedCustomer || items.length === 0) return;
    const c = customers.find(x => x.id === selectedCustomer);
    if (!c) return;
    const newInv: Invoice = {
      id: generateId(),
      invoiceNo: `HD-${new Date().toISOString().slice(0,7).replace("-","")}-${String(invoiceList.length+1).padStart(3,"0")}`,
      customerId: selectedCustomer, customerName: c.name, customerPhone: c.phone,
      date: new Date().toISOString(),
      items: items.map(it => ({ type: it.type, id: it.id, name: it.name, quantity: it.quantity, unitPrice: it.unitPrice, discount: it.discount })) as InvoiceItem[],
      subtotal, discount: itemDisc + globalDiscount, total, paymentMethod, status: "completed", notes: invoiceNotes,
    };
    setInvoiceList([newInv, ...invoiceList]);
    resetForm();
    if (printAfterSave === "this") handlePrint(newInv.id);
    setShowCreate(false);
  };

  const resetForm = () => {
    setSelectedCustomer(""); setCustomerSearch(""); setItems([]); setItemSearch("");
    setPaymentMethod("Tiền mặt"); setInvoiceNotes(""); setGlobalDiscount(0); setPrintAfterSave("none");
  };

  const openEdit = (inv: Invoice) => {
    setEditingInvId(inv.id);
    setEditFormItems([...inv.items]);
    setEditPaymentMethod(inv.paymentMethod);
  };

  const doPrint = (inv: Invoice) => {
    const pw = window.open("", "_blank");
    if (!pw) return;
    pw.document.write(`
<html><head><title>Hóa đơn ${inv.invoiceNo}</title>
<style>body{font-family:'Times New Roman',Georgia,serif;padding:40px;color:#222}.h{text-align:center;border-bottom:2px solid #d4a853;padding-bottom:20px;margin-bottom:20px}.h h1{font-size:24px;color:#8b1a3b;margin:0}.info{display:flex;justify-content:space-between;margin-bottom:20px;font-size:13px}.t{width:100%;border-collapse:collapse;margin:15px 0}.t th{background:#8b1a3b;color:white;padding:8px;text-align:left}.t td{padding:6px 8px;border-bottom:1px solid #ddd}.tot{text-align:right;font-size:14px}.sig{margin-top:40px;display:flex;justify-content:space-between}.sig div{text-align:center;width:30%}.sig .ln{border-top:1px solid #333;margin-top:50px;padding-top:5px;font-size:11px}.ftr{text-align:center;margin-top:30px;font-size:11px;color:#999;border-top:1px solid #eee;padding-top:15px}</style></head><body>
<div class="h"><h1>🌸 SAKURA SPA & BEAUTY</h1><p>HÓA ĐƠN THANH TOÁN</p><small style="color:#d4a853">${siteConfig.slogan}</small></div>
<div class="info"><div><strong>Số:</strong> ${inv.invoiceNo}<br/><strong>Ngày:</strong> ${formatDateTime(inv.date)}<br/><strong>KH:</strong> ${inv.customerName}<br/><strong>SĐT:</strong> ${inv.customerPhone}</div><div style="text-align:right"><strong>${siteConfig.shortName}</strong><br/>${siteConfig.address}<br/>${siteConfig.phone}</div></div>
<table class="t"><tr><th>#</th><th>DV/SP</th><th>SL</th><th>Đơn giá</th><th>Giảm</th><th>Thành tiền</th></tr>${inv.items.map((it,i)=>`<tr><td>${i+1}</td><td>${it.name}</td><td>${it.quantity}</td><td>${formatCurrency(it.unitPrice)}</td><td>${it.discount}%</td><td>${formatCurrency(it.unitPrice*it.quantity*(1-it.discount/100))}</td></tr>`).join("")}</table>
<div class="tot"><p><strong>Tạm tính:</strong> ${formatCurrency(inv.subtotal)}</p><p><strong>Giảm giá:</strong> ${formatCurrency(inv.discount)}</p><p style="font-size:18px;color:#8b1a3b"><strong>Tổng cộng: ${formatCurrency(inv.total)}</strong></p><p>Thanh toán: ${inv.paymentMethod}</p></div>
${inv.notes ? `<p style="font-size:12px;color:#666"><em>Ghi chú: ${inv.notes}</em></p>` : ""}
<div class="sig"><div class="ln">Khách hàng</div><div class="ln">Nhân viên</div><div class="ln">Quản lý</div></div>
<div class="ftr">${siteConfig.address} | ${siteConfig.phone} | ${siteConfig.email}</div>
<script>window.print()</script></body></html>`);
    pw.document.close();
  };
  const handlePrint = (id: string) => {
    const inv = invoiceList.find(i => i.id === id);
    if (inv) doPrint(inv);
  };

  // ─── Return/Exchange Logic ───
  const openReturnModal = (invId: string) => {
    const inv = invoiceList.find(i => i.id === invId);
    if (!inv) return;
    setReturnInvoiceId(invId);
    setReturnItems(inv.items.map(it => ({
      itemId: it.id,
      itemName: it.name,
      type: it.type,
      maxQty: it.quantity,
      returnQty: 0,
      reason: "",
    })));
    setReturnNote("");
    setShowReturnModal(true);
  };

  const handleReturnSubmit = () => {
    if (!returnInvoiceId) return;
    const inv = invoiceList.find(i => i.id === returnInvoiceId);
    if (!inv) return;

    const itemsToReturn = returnItems.filter(r => r.returnQty > 0);
    if (itemsToReturn.length === 0) return;

    const newRecord: ReturnExchangeRecord = {
      id: generateId(),
      invoiceId: returnInvoiceId,
      invoiceNo: inv.invoiceNo,
      customerId: inv.customerId,
      customerName: inv.customerName,
      customerPhone: inv.customerPhone,
      date: new Date().toISOString(),
      items: itemsToReturn.map(r => ({
        invoiceId: returnInvoiceId,
        invoiceNo: inv.invoiceNo,
        itemId: r.itemId,
        itemName: r.itemName,
        type: r.type,
        quantity: r.returnQty,
        unitPrice: (inv.items.find(i => i.id === r.itemId)?.unitPrice || 0),
        reason: r.reason,
        date: new Date().toISOString(),
      })),
      type: "return",
      note: returnNote,
    };

    setReturnExchanges(prev => [newRecord, ...prev]);
    setShowReturnModal(false);
    setReturnInvoiceId(null);
  };

  // Get return history for a customer
  const customerReturnHistory = (customerId: string): ReturnExchangeRecord[] => {
    return returnExchanges.filter(r => r.customerId === customerId);
  };

  // Get all transactions for a customer (buy + return)
  const customerTransactions = (customerId: string) => {
    const buys = invoiceList.filter(i => i.customerId === customerId && i.status === "completed");
    const returns = returnExchanges.filter(r => r.customerId === customerId);
    const totalBuy = buys.reduce((s, i) => s + i.total, 0);
    const totalReturn = returns.reduce((s, r) => s + r.items.reduce((ss, ri) => ss + ri.unitPrice * ri.quantity, 0), 0);
    return { buys, returns, totalBuy, totalReturn, net: totalBuy - totalReturn };
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white font-serif">Hóa đơn</h1>
          <p className="text-white/50 text-sm mt-1">{invoiceList.length} hóa đơn</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowReturnHistory(true)} className="flex items-center gap-2 px-4 py-2.5 bg-white/10 text-white/70 rounded-xl text-sm hover:bg-white/20 transition">
            <History className="w-4 h-4" /> Lịch sử đổi/trả
          </button>
          <button onClick={() => { resetForm(); setShowCreate(true); }} className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-sakura-500 to-rose-500 text-white rounded-xl text-sm font-medium hover:opacity-90 transition shadow-lg shadow-sakura-500/20">
            <Plus className="w-4 h-4" /> Tạo hóa đơn
          </button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <SearchInput value={search} onChange={setSearch} placeholder="Tìm theo số HD, tên KH, SĐT..." />
        <div className="flex gap-1 bg-white/5 rounded-lg p-0.5">
          {["all","completed","pending","cancelled"].map(s => (
            <button key={s} onClick={() => setFilterStatus(s)} className={`px-3 py-1.5 rounded-lg text-xs transition ${filterStatus===s?"bg-sakura-500/30 text-white":"text-white/50 hover:text-white"}`}>
              {s==="all"?"Tất cả":s==="completed"?"Hoàn thành":s==="pending"?"Chờ":"Đã huỷ"}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState message="Không tìm thấy hóa đơn" icon={<FileText className="w-12 h-12" />} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(inv => (
            <div key={inv.id} className="bg-sakura-card rounded-2xl border border-white/10 p-5 hover:border-white/20 transition group">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="text-white font-semibold text-sm">{inv.invoiceNo}</div>
                  <div className="text-xs text-white/40 mt-0.5">{formatDate(inv.date)}</div>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                  <button onClick={() => handlePrint(inv.id)} className="p-1.5 rounded-lg bg-white/10 text-white/60 hover:text-white" title="In hóa đơn"><Printer className="w-3.5 h-3.5" /></button>
                  <button onClick={() => openEdit(inv)} className="p-1.5 rounded-lg bg-white/10 text-white/60 hover:text-white" title="Sửa"><Edit3 className="w-3.5 h-3.5" /></button>
                  <button onClick={() => openReturnModal(inv.id)} className="p-1.5 rounded-lg bg-white/10 text-amber-400 hover:text-amber-300" title="Đổi/Trả hàng"><RotateCcw className="w-3.5 h-3.5" /></button>
                  <button onClick={() => setDeleteConfirm(inv.id)} className="p-1.5 rounded-lg bg-white/10 text-rose-400 hover:text-rose-300" title="Xoá"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-sakura-400 to-rose-400 flex items-center justify-center text-white font-bold text-xs">
                  {inv.customerName.charAt(0)}
                </div>
                <div>
                  <div className="text-white text-sm font-medium">{inv.customerName}</div>
                  <div className="text-[10px] text-white/40">{inv.customerPhone}</div>
                </div>
              </div>
              <div className="text-xs text-white/40 mb-2 line-clamp-2">{inv.items.map(it => it.name).join(", ")}</div>
              <div className="flex items-center justify-between pt-3 border-t border-white/10">
                <div className="flex items-center gap-2">
                  <Badge variant={inv.status === "completed" ? "success" : inv.status === "pending" ? "warning" : "danger"}>
                    {inv.status === "completed" ? "Hoàn thành" : inv.status === "pending" ? "Chờ" : "Đã huỷ"}
                  </Badge>
                  <span className="text-xs text-white/40">{inv.paymentMethod}</span>
                </div>
                <span className="text-lg font-bold text-gold-400">{formatCurrency(inv.total)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Invoice Modal */}
      <Modal open={showCreate} onClose={() => { setShowCreate(false); resetForm(); }} title="Tạo hóa đơn mới" size="xl">
        <div className="space-y-5">
          {/* Customer selector */}
          <div>
            <label className="text-xs text-white/50 mb-1.5 block">Khách hàng</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <input
                type="text"
                value={customerSearch}
                onChange={e => setCustomerSearch(e.target.value)}
                placeholder="Tìm khách hàng..."
                className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-sakura-400/50"
              />
              {customerSearch && (
                <div className="absolute z-50 w-full bg-[#2d1b2e]/95 border border-white/10 rounded-xl mt-1 overflow-hidden shadow-lg">
                  {filteredCustomers.map(c => (
                    <button
                      key={c.id}
                      onClick={() => { setSelectedCustomer(c.id); setCustomerSearch(c.name); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-white/80 hover:bg-white/10 transition text-sm"
                    >
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-sakura-400 to-rose-400 flex items-center justify-center text-white font-bold text-xs">
                        {c.name.charAt(0)}
                      </div>
                      <div>
                        <div className="text-white font-medium text-sm">{c.name}</div>
                        <div className="text-[10px] text-white/40">{c.phone}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Items selector */}
          <div ref={itemSearchRef}>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs text-white/50">Dịch vụ / Sản phẩm</label>
              <div className="flex gap-1 bg-white/5 rounded-lg p-0.5">
                <button onClick={() => { setItemType("service"); setItemSearch(""); }}
                  className={`px-2.5 py-1 rounded-lg text-xs transition ${itemType === "service" ? "bg-sakura-500/30 text-white" : "text-white/50"}`}>
                  <Sparkles className="w-3 h-3 inline mr-1" />Dịch vụ
                </button>
                <button onClick={() => { setItemType("product"); setItemSearch(""); }}
                  className={`px-2.5 py-1 rounded-lg text-xs transition ${itemType === "product" ? "bg-sakura-500/30 text-white" : "text-white/50"}`}>
                  <Package className="w-3 h-3 inline mr-1" />Sản phẩm
                </button>
              </div>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <input
                type="text"
                value={itemSearch}
                onChange={e => { setItemSearch(e.target.value); setShowItemSuggestions(true); }}
                onFocus={() => setShowItemSuggestions(true)}
                placeholder="Tìm kiếm..."
                className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-sakura-400/50"
              />
              {showItemSuggestions && itemSuggestions.length > 0 && (
                <div className="absolute z-50 w-full bg-[#2d1b2e]/95 border border-white/10 rounded-xl mt-1 overflow-hidden shadow-lg">
                  {itemSuggestions.map(it => (
                    <button
                      key={it.id}
                      onClick={() => addItem(itemType, it.id, it.name, itemType === "service" ? (it as any).price : (it as any).sellingPrice)}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-white/80 hover:bg-white/10 transition text-sm"
                    >
                      <div className="w-8 h-8 rounded-lg bg-white/10 overflow-hidden flex items-center justify-center shrink-0">
                        {it.image ? <img src={it.image} alt={it.name} className="w-full h-full object-cover" /> : <Package className="w-4 h-4 text-white/30" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-white font-medium truncate">{it.name}</div>
                        <div className="text-[10px] text-white/40">{it.code}</div>
                      </div>
                      <span className="text-gold-400 font-semibold text-xs whitespace-nowrap">
                        {formatCurrency(itemType === "service" ? (it as any).price : (it as any).sellingPrice)}
                      </span>
                      <Plus className="w-4 h-4 text-sakura-300 shrink-0" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Selected items list */}
          <div className="space-y-2 min-h-[60px]">
            {items.length === 0 ? (
              <div className="text-center py-4 text-white/30 text-xs">Chưa chọn dịch vụ hoặc sản phẩm</div>
            ) : (
              items.map((it, i) => (
                <div key={i} className="flex items-center justify-between bg-white/5 rounded-xl px-4 py-2.5 border border-white/10">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <Badge variant={it.type === "service" ? "info" : "success"}>{it.type === "service" ? "DV" : "SP"}</Badge>
                    <span className="text-white text-sm truncate">{it.name}</span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="flex items-center gap-1">
                      <button onClick={() => updateItemQty(i, -1)} className="p-1 rounded bg-white/10 text-white/60 hover:text-white"><Minus className="w-3 h-3" /></button>
                      <span className="text-white text-sm w-6 text-center">{it.quantity}</span>
                      <button onClick={() => updateItemQty(i, 1)} className="p-1 rounded bg-white/10 text-white/60 hover:text-white"><Plus className="w-3 h-3" /></button>
                    </div>
                    <span className="text-gold-400 text-sm font-medium w-20 text-right">{formatCurrency(it.unitPrice * it.quantity)}</span>
                    <button onClick={() => removeItem(i)} className="p-1 rounded text-rose-400 hover:bg-rose-500/20"><X className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Totals & payment */}
          <div className="border-t border-white/10 pt-3 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-white/60">Tạm tính</span>
              <span className="text-white">{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-white/60">Giảm giá thêm</span>
              <input type="number" value={globalDiscount || ""} onChange={e => setGlobalDiscount(Number(e.target.value))}
                className="w-24 px-2 py-1 bg-white/5 border border-white/10 rounded-lg text-white text-sm text-right focus:outline-none focus:border-sakura-400/50" />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-white/80 font-medium">Tổng cộng</span>
              <span className="text-xl font-bold text-gold-400">{formatCurrency(total)}</span>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <label className="text-xs text-white/50">Thanh toán:</label>
              <div className="flex gap-1 bg-white/5 rounded-lg p-0.5">
                {(["Tiền mặt", "Chuyển khoản", "Thẻ"] as const).map(m => (
                  <button key={m} onClick={() => setPaymentMethod(m)}
                    className={`px-3 py-1.5 rounded-lg text-xs transition ${paymentMethod === m ? "bg-sakura-500/30 text-white" : "text-white/50 hover:text-white"}`}>
                    {m}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs text-white/50 mb-1 block">Ghi chú</label>
              <input type="text" value={invoiceNotes} onChange={e => setInvoiceNotes(e.target.value)}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-sakura-400/50" />
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={handleCreateInvoice} disabled={!selectedCustomer || items.length === 0}
              className="flex-1 px-4 py-2.5 bg-gradient-to-r from-sakura-500 to-rose-500 text-white rounded-xl text-sm font-medium hover:opacity-90 transition disabled:opacity-40 shadow-lg shadow-sakura-500/20">
              <ShoppingCart className="w-4 h-4 inline mr-1" /> Tạo hóa đơn
            </button>
            <button onClick={() => { setShowCreate(false); resetForm(); }} className="px-4 py-2.5 bg-white/10 text-white/70 rounded-xl text-sm hover:bg-white/20 transition">Huỷ</button>
          </div>
        </div>
      </Modal>

      {/* Delete confirm */}
      <Modal open={deleteConfirm !== null} onClose={() => setDeleteConfirm(null)} title="Xác nhận xoá" size="sm">
        <p className="text-white/70 text-sm mb-5">Bạn có chắc muốn xoá hóa đơn này?</p>
        <div className="flex gap-3">
          <button onClick={() => { if (deleteConfirm) { setInvoiceList(prev => prev.filter(i => i.id !== deleteConfirm)); setDeleteConfirm(null); } }} className="flex-1 px-4 py-2.5 bg-rose-500/30 text-rose-300 rounded-xl text-sm hover:bg-rose-500/40 transition">Xoá</button>
          <button onClick={() => setDeleteConfirm(null)} className="flex-1 px-4 py-2.5 bg-white/10 text-white/70 rounded-xl text-sm hover:bg-white/20 transition">Huỷ</button>
        </div>
      </Modal>

      {/* ─── Return/Exchange Modal ─── */}
      <Modal open={showReturnModal} onClose={() => setShowReturnModal(false)} title="Xử lý đổi/trả hàng" size="lg">
        {returnInvoiceId && (() => {
          const inv = invoiceList.find(i => i.id === returnInvoiceId);
          if (!inv) return null;
          return (
            <div className="space-y-4">
              <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                <div className="text-sm text-white font-medium">{inv.invoiceNo}</div>
                <div className="text-xs text-white/50">{inv.customerName} - {formatDate(inv.date)}</div>
              </div>
              <p className="text-xs text-white/50">Chọn sản phẩm cần trả lại và nhập số lượng, lý do:</p>
              {returnItems.map((r, idx) => (
                <div key={r.itemId} className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge variant={r.type === "service" ? "info" : "success"}>{r.type === "service" ? "DV" : "SP"}</Badge>
                      <span className="text-white text-sm font-medium">{r.itemName}</span>
                    </div>
                    <span className="text-xs text-white/40">Tối đa: {r.maxQty}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => setReturnItems(prev => prev.map((ri, i) => i === idx ? {...ri, returnQty: Math.max(0, ri.returnQty - 1)} : ri))} className="p-1 rounded bg-white/10 text-white/60 hover:text-white"><Minus className="w-3 h-3" /></button>
                      <span className="text-white text-sm w-6 text-center font-bold">{r.returnQty}</span>
                      <button onClick={() => setReturnItems(prev => prev.map((ri, i) => i === idx ? {...ri, returnQty: Math.min(ri.maxQty, ri.returnQty + 1)} : ri))} className="p-1 rounded bg-white/10 text-white/60 hover:text-white"><Plus className="w-3 h-3" /></button>
                    </div>
                    <input
                      type="text"
                      value={r.reason}
                      onChange={e => setReturnItems(prev => prev.map((ri, i) => i === idx ? {...ri, reason: e.target.value} : ri))}
                      placeholder="Lý do trả..."
                      className="flex-1 px-2.5 py-1.5 bg-white/5 border border-white/10 rounded-lg text-white text-xs placeholder:text-white/30 focus:outline-none focus:border-sakura-400/50"
                    />
                  </div>
                </div>
              ))}
              <div>
                <label className="text-xs text-white/50 mb-1 block">Ghi chú đơn đổi/trả</label>
                <input type="text" value={returnNote} onChange={e => setReturnNote(e.target.value)}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-sakura-400/50" />
              </div>
              <div className="flex gap-3">
                <button onClick={handleReturnSubmit} disabled={returnItems.filter(r => r.returnQty > 0).length === 0}
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl text-sm font-medium hover:opacity-90 transition disabled:opacity-40 shadow-lg shadow-amber-500/20">
                  <RotateCcw className="w-4 h-4 inline mr-1" /> Xác nhận đổi/trả
                </button>
                <button onClick={() => setShowReturnModal(false)} className="px-4 py-2.5 bg-white/10 text-white/70 rounded-xl text-sm hover:bg-white/20 transition">Huỷ</button>
              </div>
            </div>
          );
        })()}
      </Modal>

      {/* ─── Return History Modal ─── */}
      <Modal open={showReturnHistory} onClose={() => setShowReturnHistory(false)} title="Lịch sử đổi/trả hàng" size="xl">
        <div className="space-y-4">
          {returnExchanges.length === 0 ? (
            <EmptyState message="Chưa có giao dịch đổi/trả nào" icon={<RotateCcw className="w-12 h-12" />} />
          ) : (
            <>
              {/* Customer-level summary */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-gold-500/10 rounded-xl border border-gold-500/20 p-3 text-center">
                  <div className="text-xs text-white/50">Tổng số phiếu đổi/trả</div>
                  <div className="text-xl font-bold text-gold-400">{returnExchanges.length}</div>
                </div>
                <div className="bg-rose-500/10 rounded-xl border border-rose-500/20 p-3 text-center">
                  <div className="text-xs text-white/50">Tổng giá trị trả</div>
                  <div className="text-xl font-bold text-rose-300">{formatCurrency(returnExchanges.reduce((s, r) => s + r.items.reduce((ss, ri) => ss + ri.unitPrice * ri.quantity, 0), 0))}</div>
                </div>
                <div className="bg-blue-500/10 rounded-xl border border-blue-500/20 p-3 text-center">
                  <div className="text-xs text-white/50">Số khách hàng đổi/trả</div>
                  <div className="text-xl font-bold text-blue-300">{new Set(returnExchanges.map(r => r.customerId)).size}</div>
                </div>
              </div>
              {returnExchanges.map(rec => {
                const totalReturnAmount = rec.items.reduce((s, ri) => s + ri.unitPrice * ri.quantity, 0);
                return (
                  <div key={rec.id} className="bg-white/5 rounded-xl border border-white/10 p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="warning">Đổi/Trả</Badge>
                        <span className="text-white font-medium text-sm">{rec.invoiceNo}</span>
                        <span className="text-xs text-white/40">{formatDate(rec.date)}</span>
                      </div>
                      <span className="text-rose-300 font-semibold text-sm">-{formatCurrency(totalReturnAmount)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-white/60 mb-2">
                      <User className="w-3 h-3" />
                      <span>{rec.customerName} - {rec.customerPhone}</span>
                    </div>
                    <div className="space-y-1">
                      {rec.items.map((ri, i) => (
                        <div key={i} className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <Badge variant={ri.type === "service" ? "info" : "success"}>{ri.type === "service" ? "DV" : "SP"}</Badge>
                            <span className="text-white/70">{ri.itemName}</span>
                            <span className="text-white/40">x{ri.quantity}</span>
                          </div>
                          <div className="text-white/60">
                            {formatCurrency(ri.unitPrice * ri.quantity)}
                            {ri.reason && <span className="ml-2 text-amber-300/70">({ri.reason})</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                    {rec.note && <div className="mt-2 text-xs text-white/40 italic">Ghi chú: {rec.note}</div>}
                  </div>
                );
              })}
            </>
          )}
        </div>
      </Modal>

      {/* ─── Customer Transaction Overview (accessible from customer detail) ─── */}
      {returnHistoryForCustomer && (() => {
        const tx = customerTransactions(returnHistoryForCustomer);
        const c = customers.find(x => x.id === returnHistoryForCustomer);
        return (
          <Modal open={!!returnHistoryForCustomer} onClose={() => setReturnHistoryForCustomer(null)} title="Tổng quan giao dịch khách hàng" size="lg">
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-sakura-400 to-rose-400 flex items-center justify-center text-white font-bold shadow-lg">
                  {c?.name.charAt(0)}
                </div>
                <div>
                  <div className="text-white font-semibold">{c?.name}</div>
                  <div className="text-xs text-white/50">{c?.phone} - {c?.code}</div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-emerald-500/10 rounded-xl border border-emerald-500/20 p-3 text-center">
                  <div className="text-xs text-white/50">Đã mua</div>
                  <div className="text-lg font-bold text-emerald-300">{formatCurrency(tx.totalBuy)}</div>
                  <div className="text-[10px] text-white/40">{tx.buys.length} hóa đơn</div>
                </div>
                <div className="bg-rose-500/10 rounded-xl border border-rose-500/20 p-3 text-center">
                  <div className="text-xs text-white/50">Đã trả</div>
                  <div className="text-lg font-bold text-rose-300">{formatCurrency(tx.totalReturn)}</div>
                  <div className="text-[10px] text-white/40">{tx.returns.length} phiếu</div>
                </div>
                <div className="bg-blue-500/10 rounded-xl border border-blue-500/20 p-3 text-center">
                  <div className="text-xs text-white/50">Tổng net</div>
                  <div className="text-lg font-bold text-blue-300">{formatCurrency(tx.net)}</div>
                  <div className="text-[10px] text-white/40">Mua - Trả</div>
                </div>
              </div>
              <div className="max-h-60 overflow-y-auto space-y-2">
                {[...tx.buys.slice(0, 10), ...tx.returns.slice(0, 5)].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((t: any) => {
                  const isReturn = "invoiceId" in t && "type" in t && t.type === "return";
                  const amount = isReturn ? t.items.reduce((s: number, ri: any) => s + ri.unitPrice * ri.quantity, 0) : t.total;
                  return (
                    <div key={t.id} className="flex items-center justify-between bg-white/5 rounded-lg px-3 py-2 border border-white/10">
                      <div className="flex items-center gap-2">
                        <Badge variant={isReturn ? "warning" : "success"}>{isReturn ? "Trả" : "Mua"}</Badge>
                        <span className="text-xs text-white/60">{(t as any).invoiceNo || t.invoiceNo}</span>
                        <span className="text-xs text-white/40">{formatDate(t.date)}</span>
                      </div>
                      <span className={`text-xs font-semibold ${isReturn ? "text-rose-300" : "text-emerald-300"}`}>
                        {isReturn ? "-" : "+"}{formatCurrency(amount)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </Modal>
        );
      })()}
    </div>
  );
}