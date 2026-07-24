import { useState, useMemo } from "react";
import { invoices as initialInvoices, customers, services, products, siteConfig } from "../data/site";
import type { Invoice, InvoiceItem } from "../data/site";
import { SearchInput, Modal, Badge, EmptyState, generateId, formatCurrency, formatDate, formatDateTime } from "../components/Shared";
import { FileText, Plus, Printer, Edit3, Trash2, User, Package, Sparkles, X, Minus } from "lucide-react";

export function Invoices({ onNavigate }: { onNavigate: (p: string) => void }) {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [invoiceList, setInvoiceList] = useState(initialInvoices);
  const [showCreate, setShowCreate] = useState(false);
  const [editingInvId, setEditingInvId] = useState<string | null>(null);
  const [printAfterSave, setPrintAfterSave] = useState<"none" | "this">("none");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // New invoice form
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [customerSearch, setCustomerSearch] = useState("");
  const [items, setItems] = useState<{ type: "service" | "product"; id: string; name: string; unitPrice: number; quantity: number; discount: number }[]>([]);
  const [itemSearch, setItemSearch] = useState("");
  const [itemType, setItemType] = useState<"service" | "product">("service");
  const [paymentMethod, setPaymentMethod] = useState<"Tiền mặt" | "Chuyển khoản" | "Thẻ">("Tiền mặt");
  const [invoiceNotes, setInvoiceNotes] = useState("");
  const [globalDiscount, setGlobalDiscount] = useState(0);

  // Editing state
  const [editFormItems, setEditFormItems] = useState<InvoiceItem[]>([]);
  const [editPaymentMethod, setEditPaymentMethod] = useState<"Tiền mặt" | "Chuyển khoản" | "Thẻ">("Tiền mặt");

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

  const addItem = (type: "service" | "product", id: string, name: string, price: number) => {
    setItems(prev => {
      const existing = prev.find(it => it.id === id && it.type === type);
      if (existing) return prev.map(it => it.id === id && it.type === type ? {...it, quantity: it.quantity + 1} : it);
      return [...prev, { type, id, name, unitPrice: price, quantity: 1, discount: 0 }];
    });
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
<div class="info"><div><strong>Số:</strong> ${inv.invoiceNo}<br/><strong>Ngày:</strong> ${formatDateTime(inv.date)}<br/><strong>KH:</strong> ${inv.customerName}<br/><strong>SĐT:</strong> ${inv.customerPhone}</div><div style="text-align:right"><strong>${siteConfig.shortName}</strong><br/>${siteConfig.address}<br/>Tel: ${siteConfig.phone}</div></div>
<table class="t"><thead><tr><th>#</th><th>Dịch vụ / Sản phẩm</th><th>Loại</th><th>SL</th><th>Đơn giá</th><th>Giảm</th><th>Thành tiền</th></tr></thead><tbody>
${inv.items.map((it,i)=>`<tr><td>${i+1}</td><td>${it.name}</td><td>${it.type==="service"?"DV":"SP"}</td><td>${it.quantity}</td><td>${formatCurrency(it.unitPrice)}</td><td>${it.discount||"—"}</td><td>${formatCurrency(it.unitPrice*it.quantity*(1-(it.discount||0)/100))}</td></tr>`).join("")}
</tbody></table>
<div class="tot"><p>Tạm tính: <b>${formatCurrency(inv.subtotal)}</b></p><p>Giảm: ${formatCurrency(inv.discount)}</p><p style="font-size:16px">Tổng cộng: <b style="color:#8b1a3b">${formatCurrency(inv.total)}</b></p><p>PTTT: ${inv.paymentMethod}</p></div>
<div class="sig"><div><small>Khách hàng<br/></small><div class="ln">(Ký tên)</div></div><div></div><div><small>Nhân viên<br/></small><div class="ln">(Ký tên)</div></div></div>
<div class="ftr">Cảm ơn Quý khách! Hẹn gặp lại tại Sakura Spa 🌸</div>
<script>window.print()</script></body></html>
    `);
    pw.document.close();
  };

  const handlePrint = (invId: string) => {
    const inv = invoiceList.find(x => x.id === invId);
    if (inv) doPrint(inv);
  };

  const saveEditedInvoice = () => {
    if (!editingInvId) return;
    const inv = invoiceList.find(x => x.id === editingInvId);
    if (!inv) return;
    const subT = editFormItems.reduce((s,it) => s + it.unitPrice * it.quantity, 0);
    const disc = editFormItems.reduce((s,it) => s + it.unitPrice * it.quantity * (it.discount ?? 0) / 100, 0);
    const tot = subT - disc;
    setInvoiceList(prev => prev.map(x => x.id === editingInvId ? {...inv, items: editFormItems, subtotal: subT, discount: disc, total: tot, paymentMethod: editPaymentMethod} : x));
    setEditingInvId(null);
    if (printAfterSave === "this") doPrint({...inv, items: editFormItems, subtotal: subT, discount: disc, total: tot, paymentMethod: editPaymentMethod});
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div><h1 className="text-2xl font-bold text-white font-serif">Hóa đơn</h1><p className="text-white/50 text-sm mt-1">{invoiceList.length} hóa đơn</p></div>
        <button onClick={() => { resetForm(); setShowCreate(true); }} className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-sakura-500 to-rose-500 text-white rounded-xl text-sm font-medium hover:opacity-90 transition shadow-lg shadow-sakura-500/20"><Plus className="w-4 h-4"/> Tạo hóa đơn</button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <SearchInput value={search} onChange={setSearch} placeholder="Tìm theo số HD, tên KH, SĐT..." />
        <div className="flex gap-2 flex-wrap">
          {[["all","Tất cả"],["completed","Đã thanh toán"],["pending","Chờ"],["cancelled","Đã hủy"]].map(([v,l])=>(
            <button key={v} onClick={()=>setFilterStatus(v)} className={`px-3 py-2 rounded-xl text-sm transition ${filterStatus===v?"bg-sakura-500/30 text-white border border-sakura-500/30":"bg-white/5 text-white/60 border border-white/10 hover:bg-white/10"}`}>{l}</button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? <EmptyState message="Không tìm thấy hóa đơn" icon={<FileText className="w-12 h-12"/>}/> : (
        <div className="space-y-3">
          {filtered.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(inv => (
            <div key={inv.id} className="bg-sakura-card rounded-2xl border border-white/10 p-4 hover:border-white/20 transition">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sakura-400/30 to-rose-400/20 flex items-center justify-center"><FileText className="w-5 h-5 text-sakura-300"/></div>
                  <div>
                    <div className="text-white font-semibold text-sm cursor-pointer select-none hover:text-gold-400 transition" onClick={()=>openEdit(inv)} title="Click để sửa hóa đơn">{inv.invoiceNo}</div>
                    <div className="text-xs text-white/50">{formatDate(inv.date)}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-white font-bold">{formatCurrency(inv.total)}</div>
                  <Badge variant={inv.status==="completed"?"success":inv.status==="pending"?"warning":"danger"}>{inv.status==="completed"?"Đã thanh toán":inv.status==="pending"?"Chờ":"Đã hủy"}</Badge>
                </div>
              </div>
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5 text-xs text-white/50">
                <div className="flex items-center gap-2"><User className="w-3 h-3"/>{inv.customerName}{inv.customerPhone?<span className="hidden sm:inline"> · {inv.customerPhone}</span>:""}</div>
                <div className="flex items-center gap-2">
                  <span>{inv.items.length} mục</span><span>· {inv.paymentMethod}</span>
                  <div className="flex items-center gap-1 ml-2">
                    <button onClick={()=>doPrint(inv)} title="In hóa đơn" className="p-1.5 rounded-lg bg-white/10 text-white/60 hover:text-white hover:bg-white/20 transition"><Printer className="w-3.5 h-3.5"/></button>
                    <button onClick={()=>openEdit(inv)} title="Sửa hóa đơn" className="p-1.5 rounded-lg bg-white/10 text-white/60 hover:text-gold-400 hover:bg-white/20 transition"><Edit3 className="w-3.5 h-3.5"/></button>
                    <button onClick={()=>setDeleteConfirm(inv.id)} title="Xóa hóa đơn" className="p-1.5 rounded-lg bg-white/10 text-white/60 hover:text-rose-400 hover:bg-white/20 transition"><Trash2 className="w-3.5 h-3.5"/></button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Invoice Modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Tạo hóa đơn mới" size="xl">
        <InvoiceCreationPanel />
        <div className="mt-5 pt-4 border-t border-white/10 space-y-3">
          <div>
            <label className="text-xs text-white/50 mb-2 block font-medium">Sau khi tạo sẽ...</label>
            <div className="flex gap-2">
              <button onClick={()=>setPrintAfterSave("this")} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm transition ${printAfterSave==="this"?"bg-emerald-500/30 text-emerald-300 border border-emerald-500/30":"bg-white/5 text-white/60 border border-white/10"}`}><Printer className="w-4 h-4"/> 🖨️ In ngay</button>
              <button onClick={()=>setPrintAfterSave("none")} className={`px-4 py-2.5 rounded-xl text-sm transition ${printAfterSave==="none"?"bg-sakura-500/30 text-white border border-sakura-500/30":"bg-white/5 text-white/60 border border-white/10"}`}>Chỉ lưu không in</button>
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={handleCreateInvoice} disabled={!selectedCustomer||items.length===0} className="flex-1 px-4 py-2.5 bg-gradient-to-r from-sakura-500 to-rose-500 text-white rounded-xl text-sm font-medium hover:opacity-90 transition disabled:opacity-40">Tạo & Lưu</button>
            <button onClick={()=>setShowCreate(false)} className="px-4 py-2.5 bg-white/10 text-white rounded-xl text-sm hover:bg-white/20 transition">Hủy</button>
          </div>
        </div>
      </Modal>

      {/* Edit Invoice Modal */}
      <Modal open={editingInvId!==null} onClose={()=>setEditingInvId(null)} title="Chỉnh sửa hóa đơn" size="lg">
        {editingInvId && (() => {
          const inv = invoiceList.find(x => x.id === editingInvId);
          if (!inv) return null;
          return (
            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-white/50">Mã HĐ:</span><div className="text-white font-mono mt-1">{inv.invoiceNo}</div></div>
                <div><span className="text-white/50">KH:</span><div className="text-white mt-1">{inv.customerName}</div></div>
                <div><span className="text-white/50">Ngày:</span><div className="text-white mt-1">{formatDateTime(inv.date)}</div></div>
                <div>
                  <span className="text-white/50">Thanh toán:</span>
                  <select value={editPaymentMethod} onChange={e=>setEditPaymentMethod(e.target.value as any)} className="bg-white/5 border border-white/10 rounded-xl px-2 py-1 text-white text-sm w-full mt-1">
                    <option value="Tiền mặt">Tiền mặt</option><option value="Chuyển khoản">Chuyển khoản</option><option value="Thẻ">Thẻ</option>
                  </select>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm"><thead><tr className="bg-white/5 border-b border-white/10">
                  {["STT","Tên DV/SP","SL","Đơn giá","Giảm %","Thành tiền",""].map(h=><th key={h} className="px-2 py-2 text-left text-white/50 text-xs">{h}</th>)}</tr></thead>
                <tbody className="divide-y divide-white/5">
                  {editFormItems.map((it,i)=>(
                    <tr key={i}><td className="py-2 text-xs text-white/40">{i+1}</td>
                      <td className="text-white text-xs">{it.name}<br/><span className="text-[10px] text-white/30">{it.type==="service"?"Dịch vụ":"Sản phẩm"}</span></td>
                      <td><input type="number" min={1} defaultValue={it.quantity} onBlur={e=>{const v=Number(e.target.value);const n=[...editFormItems];n[i]={...n[i],quantity:v};setEditFormItems(n);}} className="bg-white/5 border border-white/10 rounded px-2 py-1 text-white text-xs w-16 text-center"/></td>
                      <td><input type="number" defaultValue={it.unitPrice} onBlur={e=>{const v=Number(e.target.value);const n=[...editFormItems];n[i]={...n[i],unitPrice:v};setEditFormItems(n);}} className="bg-white/5 border border-white/10 rounded px-2 py-1 text-white text-xs w-24 text-right"/></td>
                      <td><input type="number" defaultValue={it.discount} onBlur={e=>{const v=Number(e.target.value);const n=[...editFormItems];n[i]={...n[i],discount:v};setEditFormItems(n);}} className="bg-white/5 border border-white/10 rounded px-2 py-1 text-white text-xs w-16 text-center"/><span className="text-white/30">%</span></td>
                      <td className="text-gold-400 font-medium text-xs">{formatCurrency(it.unitPrice*it.quantity*(1-it.discount/100))}</td>
                      <td><button onClick={()=>{const n=[...editFormItems];n.splice(i,1);setEditFormItems(n);}} className="text-rose-400 hover:text-rose-300"><X className="w-4 h-4"/></button></td>
                    </tr>
                  ))}
                </tbody></table>
              </div>
              <div className="flex justify-end">
                <div className="w-64 space-y-1 text-sm">
                  <div className="flex justify-between text-white/60"><span>Tạm tính</span><span>{formatCurrency(editFormItems.reduce((s,it)=>s+it.unitPrice*it.quantity,0))}</span></div>
                  <div className="flex justify-between text-white/60"><span>Giảm giá SP</span><span>-{formatCurrency(editFormItems.reduce((s,it)=>s+it.unitPrice*it.quantity*it.discount/100,0))}</span></div>
                  <hr className="border-white/10"/>
                  <div className="flex justify-between text-white font-bold"><span>Tổng cộng</span><span className="text-gold-400">{formatCurrency(editFormItems.reduce((s,it)=>s+it.unitPrice*it.quantity*(1-it.discount/100),0))}</span></div>
                </div>
              </div>
              <div>
                <label className="text-xs text-white/50 mb-2 block font-medium">Sau khi lưu...</label>
                <div className="flex gap-2">
                  <button onClick={()=>setPrintAfterSave("this")} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm transition ${printAfterSave==="this"?"bg-emerald-500/30 text-emerald-300 border border-emerald-500/30":"bg-white/5 text-white/60 border border-white/10"}`}><Printer className="w-4 h-4"/> 🖨️ In ngay</button>
                  <button onClick={()=>setPrintAfterSave("none")} className={`px-4 py-2.5 rounded-xl text-sm transition ${printAfterSave==="none"?"bg-sakura-500/30 text-white border border-sakura-500/30":"bg-white/5 text-white/60 border border-white/10"}`}>Chỉ lưu không in</button>
                </div>
              </div>
              <label className="text-xs text-white/50 block">Ghi chú</label>
              <textarea rows={2} className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-sm" value={inv.notes} onChange={e=>setInvoiceNotes(e.target.value)}/>
            </div>);
        })()}
        <div className="flex gap-3 mt-5 pt-4 border-t border-white/10">
          <button onClick={saveEditedInvoice} className="flex-1 px-4 py-2.5 bg-gradient-to-r from-sakura-500 to-rose-500 text-white rounded-xl text-sm font-medium hover:opacity-90 transition">Lưu thay đổi</button>
          <button onClick={()=>setEditingInvId(null)} className="px-4 py-2.5 bg-white/10 text-white rounded-xl text-sm hover:bg-white/20 transition">Hủy</button>
        </div>
      </Modal>

      {/* Delete confirm */}
      <Modal open={deleteConfirm!==null} onClose={()=>setDeleteConfirm(null)} title="Xác nhận xóa hóa đơn" size="sm">
        <p className="text-white/70 text-sm mb-5">Xóa hóa đơn này?</p>
        <div className="flex gap-3">
          <button onClick={()=>{setInvoiceList(prev=>prev.filter(x=>x.id!==deleteConfirm));setDeleteConfirm(null);}} className="flex-1 px-4 py-2.5 bg-rose-500 text-white rounded-xl text-sm font-medium hover:bg-rose-600 transition">Xóa</button>
          <button onClick={()=>setDeleteConfirm(null)} className="px-4 py-2.5 bg-white/10 text-white rounded-xl text-sm hover:bg-white/20 transition">Hủy</button>
        </div>
      </Modal>
    </div>
  );

  function InvoiceCreationPanel() {
    return (
      <div className="space-y-5 max-h-[70vh] overflow-y-auto pr-2">
        <div>
          <label className="text-xs text-white/50 mb-1 block font-medium">Chọn khách hàng *</label>
          <input value={customerSearch} onChange={e=>setCustomerSearch(e.target.value)} placeholder="Tìm tên hoặc SĐT..." className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm mb-2"/>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 max-h-24 overflow-y-auto">
            {filteredCustomers.map(c=>(
              <button key={c.id} onClick={()=>{setSelectedCustomer(c.id);setCustomerSearch(c.name)}} className={`text-left px-3 py-2 rounded-lg text-sm transition ${selectedCustomer===c.id?"bg-sakura-500/30 text-white border border-sakura-500/30":"bg-white/5 text-white/70 hover:bg-white/10"}`}>{c.name} — {c.phone}</button>
            ))}
          </div>
        </div>
        <div>
          <div className="flex items-center gap-2 mb-2">
            <label className="text-xs text-white/50 font-medium">Thêm dịch vụ / sản phẩm</label>
            <button onClick={()=>setItemType("service")} className={`px-2 py-1 rounded-lg text-xs ${itemType==="service"?"bg-sakura-500/30 text-white":"bg-white/10 text-white/60"}`}><Sparkles className="w-3 h-3 inline mr-1"/>Dịch vụ</button>
            <button onClick={()=>setItemType("product")} className={`px-2 py-1 rounded-lg text-xs ${itemType==="product"?"bg-sakura-500/30 text-white":"bg-white/10 text-white/60"}`}><Package className="w-3 h-3 inline mr-1"/>Sản phẩm</button>
          </div>
          <input value={itemSearch} onChange={e=>setItemSearch(e.target.value)} placeholder="Tìm kiếm..." className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-sm mb-2"/>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1 max-h-28 overflow-y-auto">
            {filteredItems.map((it: any)=>(
              <button key={it.id} onClick={()=>addItem(itemType,it.id,it.name,itemType==="service"?it.price:it.sellingPrice)} className="text-left px-2 py-1.5 rounded-lg bg-white/5 text-white/70 text-xs hover:bg-white/10 transition truncate">{it.name} — {itemType==="service"?formatCurrency(it.price):formatCurrency(it.sellingPrice)}</button>
            ))}
          </div>
        </div>
        {items.length>0 && (
          <div className="bg-white/5 rounded-xl p-3">
            <div className="text-xs text-white/50 mb-2 font-medium">Danh sách đã chọn</div>
            <div className="space-y-2">
              {items.map((it,i)=>(
                <div key={i} className="flex items-center gap-2 text-sm bg-white/5 rounded-lg p-2">
                  <span className="text-[10px] w-5 h-5 rounded bg-sakura-500/20 text-sakura-300 flex items-center justify-center">{it.type==="service"?"DV":"SP"}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-white text-xs truncate">{it.name}</div>
                    <div className="text-[10px] text-white/40">{formatCurrency(it.unitPrice)}</div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={()=>updateItemQty(i,-1)} className="p-0.5 rounded bg-white/10 text-white/60"><Minus className="w-2.5 h-2.5"/></button>
                    <span className="text-white text-xs w-4 text-center">{it.quantity}</span>
                    <button onClick={()=>updateItemQty(i,1)} className="p-0.5 rounded bg-white/10 text-white/60"><IconPlus/></button>
                  </div>
                  <div className="text-gold-400 text-xs font-medium w-20 text-right">{formatCurrency(it.unitPrice*it.quantity*(1-it.discount/100))}</div>
                  <button onClick={()=>removeItem(i)} className="p-0.5 rounded text-rose-400 hover:bg-rose-500/20"><X className="w-3 h-3"/></button>
                </div>
              ))}
            </div>
          </div>
        )}
        <div className="bg-white/5 rounded-xl p-4 space-y-1.5 text-sm">
          <div className="flex justify-between text-white/60"><span>Tạm tính</span><span>{formatCurrency(subtotal)}</span></div>
          <div className="flex justify-between text-white/60"><span>Giảm giá chung</span><input type="number" value={globalDiscount} onChange={e=>setGlobalDiscount(Number(e.target.value))} className="w-24 text-right px-2 py-1 bg-white/5 border border-white/10 rounded-lg text-white text-xs"/></div>
          <div className="flex justify-between text-white font-bold text-base border-t border-white/10 pt-2"><span>Tổng cộng</span><span className="text-gold-400">{formatCurrency(total)}</span></div>
        </div>
        <div>
          <label className="text-xs text-white/50 mb-1 block font-medium">Hình thức thanh toán</label>
          <div className="flex gap-2">{(["Tiền mặt","Chuyển khoản","Thẻ"] as const).map(m=>(
            <button key={m} onClick={()=>setPaymentMethod(m)} className={`px-4 py-2 rounded-xl text-sm transition ${paymentMethod===m?"bg-sakura-500/30 text-white border border-sakura-500/30":"bg-white/5 text-white/60 border border-white/10"}`}>{m}</button>
          ))}</div>
        </div>
        <div><label className="text-xs text-white/50 mb-1 block">Ghi chú</label><textarea value={invoiceNotes} onChange={e=>setInvoiceNotes(e.target.value)} rows={2} className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm"/></div>
      </div>
    );
  }
}

function IconPlus() {
  return <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><path d="M12 5v14M5 12h14"/></svg>;
}