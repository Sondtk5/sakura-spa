import { useState, useMemo } from "react";
import { invoices, customers, services, products } from "../data/site";
import type { Invoice, InvoiceItem } from "../data/site";
import { SearchInput, Modal, Badge, EmptyState, generateId, formatCurrency, formatDate, formatDateTime } from "../components/Shared";
import { FileText, Plus, Search, Printer, Filter, DollarSign, User, Package, Sparkles, X, Minus, Plus as PlusIcon } from "lucide-react";

export function Invoices({ onNavigate }: { onNavigate: (p: string) => void }) {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [invoiceList, setInvoiceList] = useState(invoices);
  const [showCreate, setShowCreate] = useState(false);
  const [showInvoice, setShowInvoice] = useState<string | null>(null);

  // New invoice form
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [customerSearch, setCustomerSearch] = useState("");
  const [items, setItems] = useState<{ type: "service" | "product"; id: string; name: string; unitPrice: number; quantity: number; discount: number }[]>([]);
  const [itemSearch, setItemSearch] = useState("");
  const [itemType, setItemType] = useState<"service" | "product">("service");
  const [paymentMethod, setPaymentMethod] = useState<"Tiền mặt" | "Chuyển khoản" | "Thẻ">("Tiền mặt");
  const [invoiceNotes, setInvoiceNotes] = useState("");
  const [globalDiscount, setGlobalDiscount] = useState(0);

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
    return availableItems.filter(it =>
      it.name.toLowerCase().includes(q) || it.code.toLowerCase().includes(q)
    );
  }, [itemSearch, availableItems, itemType]);

  const addItem = (type: "service" | "product", id: string, name: string, price: number) => {
    setItems(prev => {
      const existing = prev.find(it => it.id === id && it.type === type);
      if (existing) {
        return prev.map(it => it.id === id && it.type === type ? { ...it, quantity: it.quantity + 1 } : it);
      }
      return [...prev, { type, id, name, unitPrice: price, quantity: 1, discount: 0 }];
    });
  };

  const updateItemQty = (idx: number, delta: number) => {
    setItems(prev => prev.map((it, i) => i === idx ? { ...it, quantity: Math.max(1, it.quantity + delta) } : it));
  };

  const removeItem = (idx: number) => {
    setItems(prev => prev.filter((_, i) => i !== idx));
  };

  const updateItemDiscount = (idx: number, discount: number) => {
    setItems(prev => prev.map((it, i) => i === idx ? { ...it, discount } : it));
  };

  const subtotal = useMemo(() => items.reduce((s, it) => s + it.unitPrice * it.quantity, 0), [items]);
  const itemDiscountTotal = useMemo(() => items.reduce((s, it) => s + (it.unitPrice * it.quantity * it.discount / 100), 0), [items]);
  const total = useMemo(() => subtotal - itemDiscountTotal - globalDiscount, [subtotal, itemDiscountTotal, globalDiscount]);

  const handleCreateInvoice = () => {
    if (!selectedCustomer || items.length === 0) return;
    const c = customers.find(x => x.id === selectedCustomer);
    if (!c) return;

    const newInv: Invoice = {
      id: generateId(),
      invoiceNo: `HD-${new Date().toISOString().slice(0, 7).replace("-", "")}-${String(invoiceList.length + 1).padStart(3, "0")}`,
      customerId: selectedCustomer,
      customerName: c.name,
      customerPhone: c.phone,
      date: new Date().toISOString(),
      items: items.map(it => ({ ...it, id: it.id })),
      subtotal,
      discount: itemDiscountTotal + globalDiscount,
      total,
      paymentMethod,
      status: "completed",
      notes: invoiceNotes,
    };
    setInvoiceList([newInv, ...invoiceList]);
    setShowCreate(false);
    resetForm();
  };

  const resetForm = () => {
    setSelectedCustomer("");
    setCustomerSearch("");
    setItems([]);
    setItemSearch("");
    setPaymentMethod("Tiền mặt");
    setInvoiceNotes("");
    setGlobalDiscount(0);
  };

  const handlePrint = (invId: string) => {
    const inv = invoiceList.find(x => x.id === invId);
    if (!inv) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(`
      <html><head><title>Hóa đơn ${inv.invoiceNo}</title>
      <style>
        body { font-family: 'Times New Roman', Georgia, serif; padding: 40px; color: #222; }
        .header { text-align: center; border-bottom: 2px solid #d4a853; padding-bottom: 20px; margin-bottom: 20px; }
        .header h1 { font-size: 24px; color: #8b1a3b; margin: 0; }
        .header h2 { font-size: 16px; color: #666; font-weight: normal; margin: 5px 0; }
        .header .slogan { font-size: 12px; color: #d4a853; font-style: italic; }
        .info { display: flex; justify-content: space-between; margin-bottom: 20px; font-size: 13px; }
        .info div { width: 48%; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        th { background: #8b1a3b; color: white; padding: 10px; text-align: left; font-size: 13px; }
        td { padding: 8px 10px; border-bottom: 1px solid #ddd; font-size: 13px; }
        .total { text-align: right; font-size: 16px; }
        .total strong { color: #8b1a3b; }
        .footer { text-align: center; margin-top: 40px; font-size: 12px; color: #999; border-top: 1px solid #ddd; padding-top: 20px; }
        .signature { display: flex; justify-content: space-between; margin-top: 40px; }
        .signature div { text-align: center; width: 30%; }
        .signature .line { border-top: 1px solid #333; margin-top: 50px; padding-top: 5px; font-size: 12px; }
      </style></head><body>
        <div class="header">
          <h1>🌸 SAKURA SPA & BEAUTY</h1>
          <h2>HÓA ĐƠN THANH TOÁN</h2>
          <div class="slogan">Nâng tầm vẻ đẹp, thư thái tâm hồn</div>
        </div>
        <div class="info">
          <div>
            <strong>Số hóa đơn:</strong> ${inv.invoiceNo}<br/>
            <strong>Ngày:</strong> ${formatDateTime(inv.date)}<br/>
            <strong>Khách hàng:</strong> ${inv.customerName}<br/>
            <strong>SĐT:</strong> ${inv.customerPhone}
          </div>
          <div style="text-align:right">
            <strong>Sakura Spa & Beauty</strong><br/>
            123 Nguyễn Huệ, Quận 1, TP.HCM<br/>
            Tel: 0988 888 888<br/>
            Email: info@sakuraspa.vn
          </div>
        </div>
        <table>
          <tr><th>STT</th><th>Dịch vụ / Sản phẩm</th><th>Loại</th><th>SL</th><th>Đơn giá</th><th>Giảm</th><th>Thành tiền</th></tr>
          ${inv.items.map((it, i) => `
            <tr>
              <td>${i + 1}</td>
              <td>${it.name}</td>
              <td>${it.type === "service" ? "DV" : "SP"}</td>
              <td>${it.quantity}</td>
              <td>${new Intl.NumberFormat("vi-VN").format(it.unitPrice)}</td>
              <td>${it.discount > 0 ? it.discount + "%" : "-"}</td>
              <td>${new Intl.NumberFormat("vi-VN").format(it.unitPrice * it.quantity * (1 - it.discount / 100))}₫</td>
            </tr>
          `).join("")}
        </table>
        <div class="total">
          <p>Tạm tính: ${new Intl.NumberFormat("vi-VN").format(inv.subtotal)}₫</p>
          <p>Giảm giá: ${new Intl.NumberFormat("vi-VN").format(inv.discount)}₫</p>
          <p><strong>Tổng cộng: ${new Intl.NumberFormat("vi-VN").format(inv.total)}₫</strong></p>
          <p>Hình thức thanh toán: ${inv.paymentMethod}</p>
        </div>
        <div class="signature">
          <div>Khách hàng<br/><div class="line">(Ký, ghi rõ họ tên)</div></div>
          <div></div>
          <div>Sakura Spa<br/><div class="line">(Ký, ghi rõ họ tên)</div></div>
        </div>
        <div class="footer">
          <p>🌸 Cảm ơn Quý khách! Hẹn gặp lại tại Sakura Spa & Beauty 🌸</p>
          <p>www.sakuraspa.vn | Hotline: 0988 888 888</p>
        </div>
        <script>window.print();</script>
      </body></html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white font-serif">Hóa đơn</h1>
          <p className="text-white/50 text-sm mt-1">{invoiceList.length} hóa đơn</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowCreate(true); }}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-sakura-500 to-rose-500 text-white rounded-xl text-sm font-medium hover:opacity-90 transition shadow-lg shadow-sakura-500/20"
        >
          <Plus className="w-4 h-4" /> Tạo hóa đơn
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <SearchInput value={search} onChange={setSearch} placeholder="Tìm theo số HD, tên KH, SĐT..." />
        <div className="flex gap-2 flex-wrap">
          {["all", "completed", "pending", "cancelled"].map(s => (
            <button key={s} onClick={() => setFilterStatus(s)} className={`px-3 py-2 rounded-xl text-sm transition ${filterStatus === s ? "bg-sakura-500/30 text-white border border-sakura-500/30" : "bg-white/5 text-white/60 border border-white/10 hover:bg-white/10"}`}>
              {s === "all" ? "Tất cả" : s === "completed" ? "Đã thanh toán" : s === "pending" ? "Chờ" : "Đã hủy"}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState message="Không tìm thấy hóa đơn" icon={<FileText className="w-12 h-12" />} />
      ) : (
        <div className="space-y-3">
          {filtered.map(inv => (
            <div key={inv.id} className="bg-sakura-card rounded-2xl border border-white/10 p-4 hover:border-white/20 transition">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sakura-400/30 to-rose-400/20 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-sakura-300" />
                  </div>
                  <div>
                    <div className="text-white font-semibold text-sm">{inv.invoiceNo}</div>
                    <div className="text-xs text-white/50">{formatDate(inv.date)}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-white font-bold">{formatCurrency(inv.total)}</div>
                  <Badge variant={inv.status === "completed" ? "success" : inv.status === "pending" ? "warning" : "danger"}>
                    {inv.status === "completed" ? "Đã thanh toán" : inv.status === "pending" ? "Chờ" : "Đã hủy"}
                  </Badge>
                </div>
              </div>
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5 text-xs text-white/50">
                <div className="flex items-center gap-2">
                  <User className="w-3 h-3" /> {inv.customerName}
                  <span className="hidden sm:inline">· {inv.customerPhone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>{inv.items.length} mục</span>
                  <span>· {inv.paymentMethod}</span>
                  <button onClick={() => handlePrint(inv.id)} className="p-1 rounded bg-white/10 text-white/60 hover:text-white ml-1">
                    <Printer className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Invoice Modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Tạo hóa đơn mới" size="xl">
        <div className="space-y-5 max-h-[70vh] overflow-y-auto pr-2">
          {/* Select Customer */}
          <div>
            <label className="text-xs text-white/50 mb-1 block font-medium">Chọn khách hàng *</label>
            <input
              value={customerSearch}
              onChange={e => setCustomerSearch(e.target.value)}
              placeholder="Tìm tên hoặc SĐT..."
              className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm mb-2"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 max-h-24 overflow-y-auto">
              {filteredCustomers.map(c => (
                <button
                  key={c.id}
                  onClick={() => { setSelectedCustomer(c.id); setCustomerSearch(c.name); }}
                  className={`text-left px-3 py-2 rounded-lg text-sm transition ${selectedCustomer === c.id ? "bg-sakura-500/30 text-white border border-sakura-500/30" : "bg-white/5 text-white/70 hover:bg-white/10"}`}
                >
                  {c.name} - {c.phone}
                </button>
              ))}
            </div>
          </div>

          {/* Add Items */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <label className="text-xs text-white/50 font-medium">Thêm dịch vụ / sản phẩm</label>
              <div className="flex gap-1">
                <button onClick={() => setItemType("service")} className={`px-2 py-1 rounded-lg text-xs ${itemType === "service" ? "bg-sakura-500/30 text-white" : "bg-white/10 text-white/60"}`}>
                  <Sparkles className="w-3 h-3 inline mr-1" />Dịch vụ
                </button>
                <button onClick={() => setItemType("product")} className={`px-2 py-1 rounded-lg text-xs ${itemType === "product" ? "bg-sakura-500/30 text-white" : "bg-white/10 text-white/60"}`}>
                  <Package className="w-3 h-3 inline mr-1" />Sản phẩm
                </button>
              </div>
            </div>
            <input
              value={itemSearch}
              onChange={e => setItemSearch(e.target.value)}
              placeholder="Tìm kiếm..."
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-sm mb-2"
            />
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1 max-h-28 overflow-y-auto">
              {filteredItems.map(it => (
                <button
                  key={it.id}
                  onClick={() => addItem(itemType, it.id, it.name, itemType === "service" ? (it as any).price : (it as any).sellingPrice)}
                  className="text-left px-2 py-1.5 rounded-lg bg-white/5 text-white/70 text-xs hover:bg-white/10 transition truncate"
                >
                  {it.name}
                </button>
              ))}
            </div>
          </div>

          {/* Items List */}
          {items.length > 0 && (
            <div className="bg-white/5 rounded-xl p-3">
              <div className="text-xs text-white/50 mb-2 font-medium">Danh sách đã chọn</div>
              <div className="space-y-2">
                {items.map((it, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm bg-white/5 rounded-lg p-2">
                    <span className="w-5 h-5 rounded bg-sakura-500/20 text-sakura-300 flex items-center justify-center text-[10px]">
                      {it.type === "service" ? "DV" : "SP"}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="text-white text-xs truncate">{it.name}</div>
                      <div className="text-[10px] text-white/40">{formatCurrency(it.unitPrice)}</div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => updateItemQty(i, -1)} className="p-0.5 rounded bg-white/10 text-white/60"><Minus className="w-2.5 h-2.5" /></button>
                      <span className="text-white text-xs w-4 text-center">{it.quantity}</span>
                      <button onClick={() => updateItemQty(i, 1)} className="p-0.5 rounded bg-white/10 text-white/60"><PlusIcon className="w-2.5 h-2.5" /></button>
                    </div>
                    <div className="text-gold-400 text-xs font-medium w-20 text-right">
                      {formatCurrency(it.unitPrice * it.quantity * (1 - it.discount / 100))}
                    </div>
                    <button onClick={() => removeItem(i)} className="p-0.5 rounded text-rose-400 hover:bg-rose-500/20"><X className="w-3 h-3" /></button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Summary */}
          <div className="bg-white/5 rounded-xl p-4 space-y-1.5 text-sm">
            <div className="flex justify-between text-white/60"><span>Tạm tính</span><span>{formatCurrency(subtotal)}</span></div>
            <div className="flex justify-between text-white/60">
              <span>Giảm giá</span>
              <input type="number" value={globalDiscount} onChange={e => setGlobalDiscount(Number(e.target.value))} className="w-24 text-right px-2 py-1 bg-white/5 border border-white/10 rounded-lg text-white text-xs" />
            </div>
            <div className="flex justify-between text-white font-bold text-base border-t border-white/10 pt-2">
              <span>Tổng cộng</span><span className="text-gold-400">{formatCurrency(total)}</span>
            </div>
          </div>

          {/* Payment */}
          <div>
            <label className="text-xs text-white/50 mb-1 block font-medium">Hình thức thanh toán</label>
            <div className="flex gap-2">
              {(["Tiền mặt", "Chuyển khoản", "Thẻ"] as const).map(m => (
                <button key={m} onClick={() => setPaymentMethod(m)} className={`px-4 py-2 rounded-xl text-sm transition ${paymentMethod === m ? "bg-sakura-500/30 text-white border border-sakura-500/30" : "bg-white/5 text-white/60 border border-white/10"}`}>{m}</button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-white/50 mb-1 block">Ghi chú</label>
            <textarea value={invoiceNotes} onChange={e => setInvoiceNotes(e.target.value)} rows={2} className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm" />
          </div>
        </div>

        <div className="flex gap-3 mt-5 pt-4 border-t border-white/10">
          <button
            onClick={handleCreateInvoice}
            disabled={!selectedCustomer || items.length === 0}
            className="flex-1 px-4 py-2.5 bg-gradient-to-r from-sakura-500 to-rose-500 text-white rounded-xl text-sm font-medium hover:opacity-90 transition disabled:opacity-40"
          >
            Tạo hóa đơn & Thanh toán
          </button>
          <button onClick={() => setShowCreate(false)} className="px-4 py-2.5 bg-white/10 text-white rounded-xl text-sm hover:bg-white/20 transition">Hủy</button>
        </div>
      </Modal>
    </div>
  );
}