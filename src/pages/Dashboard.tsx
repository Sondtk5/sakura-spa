import { useState, useMemo } from "react";
import { customers, invoices as allInvoices, services, products, siteConfig } from "../data/site";
import { StatCard, Badge, formatCurrency, formatDate } from "../components/Shared";
import { DollarSign, Users, Receipt, Package, TrendingUp, ShoppingBag, Sparkles, ArrowUpRight, Calendar, ChevronLeft, ChevronRight, X, Printer, FileText } from "lucide-react";

export function Dashboard({ onNavigate }: { onNavigate: (p: string) => void }) {
  const [selectedDay, setSelectedDay] = useState<string>(new Date().toISOString().split("T")[0]);
  const [showCalendar, setShowCalendar] = useState(false);
  const [dateRange, setDateRange] = useState<"today" | "custom">("today");
  const [rangeStart, setRangeStart] = useState(selectedDay);
  const [rangeEnd, setRangeEnd] = useState(selectedDay);
  const [detailModal, setDetailModal] = useState<{ title: string; list: { label: string; value: string }[] } | null>(null);

  // Day invoice data
  const dayInvList = useMemo(() => 
    allInvoices.filter(i => i.date.startsWith(selectedDay)).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [selectedDay]
  );
  const dayRevenue = dayInvList.reduce((s,i) => s + i.total, 0);

  // Range data
  const rangeInvList = useMemo(() => {
    if (dateRange === "today") return dayInvList;
    return allInvoices.filter(i => {
      const d = i.date.split("T")[0];
      return d >= rangeStart && d <= rangeEnd;
    }).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [dateRange, rangeStart, rangeEnd, dayInvList, allInvoices]);
  const rangeRevenue = rangeInvList.reduce((s,i) => s + i.total, 0);
  const rangeCount = rangeInvList.length;

  // Top products sold in range
  const rangeTopProducts = useMemo(() => {
    const map = new Map<string, { name: string; qty: number; rev: number }>();
    rangeInvList.forEach(inv => {
      inv.items.filter(it => it.type === "product").forEach(it => {
        const e = map.get(it.name) || { name: it.name, qty: 0, rev: 0 };
        e.qty += it.quantity;
        e.rev += it.unitPrice * it.quantity;
        map.set(it.name, e);
      });
    });
    return Array.from(map.values()).sort((a, b) => b.rev - a.rev).slice(0, 5);
  }, [rangeInvList]);

  const totalActiveProducts = products.filter(p => p.active).length;

  // Compute top product rows for all invoices
  const computeTopProductRows = (invList: typeof allInvoices) => {
    const map = new Map<string, { name: string; qty: number }>();
    invList.forEach(inv => {
      inv.items.filter(it => it.type === "product").forEach(it => {
        const e = map.get(it.name) || { name: it.name, qty: 0 };
        e.qty += it.quantity;
        map.set(it.name, e);
      });
    });
    return Array.from(map.values()).sort((a, b) => b.qty - a.qty).slice(0, 5);
  };

  const handleStatClick = (title: string, list: { label: string; value: string }[]) => {
    setDetailModal({ title, list });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white font-serif">{siteConfig.shortName}</h1>
          <p className="text-white/50 text-sm mt-1">{siteConfig.slogan}</p>
        </div>
        
        {/* Date selector */}
        <div className="flex items-center gap-2">
          <div className="flex gap-1 bg-white/5 rounded-xl p-1 border border-white/10">
            <button onClick={() => { setDateRange("today"); setSelectedDay(new Date().toISOString().split("T")[0]); setShowCalendar(false); }} 
              className={`px-3 py-1.5 rounded-lg text-xs transition ${dateRange === "today" ? "bg-sakura-500/30 text-white" : "text-white/50 hover:text-white"}`}>
              Hôm nay
            </button>
            <button onClick={() => { setDateRange("custom"); setShowCalendar(!showCalendar); }} 
              className={`px-3 py-1.5 rounded-lg text-xs transition ${dateRange === "custom" ? "bg-sakura-500/30 text-white" : "text-white/50 hover:text-white"}`}>
              <Calendar className="w-3.5 h-3.5 inline mr-1" />
              Chọn ngày
            </button>
          </div>
        </div>
      </div>

      {/* Custom date range picker */}
      {showCalendar && dateRange === "custom" && (
        <div className="bg-sakura-card rounded-2xl border border-white/10 p-4 animate-fade-in">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <label className="text-xs text-white/50">Từ:</label>
              <input type="date" value={rangeStart} onChange={e => setRangeStart(e.target.value)} 
                className="px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-xs" />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-white/50">Đến:</label>
              <input type="date" value={rangeEnd} onChange={e => setRangeEnd(e.target.value)} 
                className="px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-xs" />
            </div>
            <button onClick={() => setShowCalendar(false)} className="text-xs px-3 py-2 bg-sakura-500/20 text-sakura-300 rounded-xl hover:bg-sakura-500/30">
              Áp dụng
            </button>
          </div>
        </div>
      )}

      {/* Stats row — clickable to show detail */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="cursor-pointer" onClick={() => handleStatClick("Doanh thu", [
          { label: "Tổng doanh thu", value: formatCurrency(rangeRevenue) },
          { label: "Số hóa đơn", value: String(rangeCount) },
          { label: "Trung bình/đơn", value: rangeCount > 0 ? formatCurrency(Math.round(rangeRevenue / rangeCount)) : "0" },
          ...rangeTopProducts.map(p => ({ label: `Top: ${p.name}`, value: `${p.qty} cái - ${formatCurrency(p.rev)}` }))
        ])}>
          <StatCard label={`Doanh thu ${dateRange === "today" ? formatDate(selectedDay) : `${rangeStart} → ${rangeEnd}`}`} 
            value={formatCurrency(rangeRevenue)} icon={<DollarSign />} color="gold" />
        </div>
        <div className="cursor-pointer" onClick={() => handleStatClick("Hóa đơn", rangeInvList.map(inv => ({
          label: `${inv.invoiceNo} - ${inv.customerName}`,
          value: `${formatCurrency(inv.total)} (${inv.paymentMethod})`
        })))}>
          <StatCard label="Hóa đơn" value={`${rangeCount}`} icon={<Receipt />} color="sakura" />
        </div>
        <div className="cursor-pointer" onClick={() => handleStatClick("Khách hàng", 
          [...customers].sort((a,b) => b.totalSpent - a.totalSpent).slice(0, 10).map(c => ({
            label: `${c.name} - ${c.phone}`,
            value: `${c.visitCount} lượt - ${formatCurrency(c.totalSpent)}`
          }))
        )}>
          <StatCard label="Tổng khách hàng" value={`${customers.length}`} icon={<Users />} color="blue" />
        </div>
        <div className="cursor-pointer" onClick={() => handleStatClick("Sản phẩm", 
          products.filter(p => p.active).map(p => ({
            label: `${p.name} (${p.code})`,
            value: `Tồn: ${p.stock} - Giá: ${formatCurrency(p.sellingPrice)}`
          }))
        )}>
          <StatCard label="Sản phẩm đang bán" value={`${totalActiveProducts}`} icon={<Package />} color="emerald" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart — last 7 days */}
        <div className="lg:col-span-2 bg-sakura-card rounded-2xl border border-white/10 p-5">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-white font-semibold">Doanh thu 7 ngày gần nhất</h3>
            <button onClick={() => onNavigate("/reports")} className="text-xs text-gold-400 hover:text-gold-300 flex items-center gap-1">Xem báo cáo <ArrowUpRight className="w-3 h-3"/></button>
          </div>
          <SevenDayChart />
        </div>

        {/* Top Services */}
        <TopBlock title="Dịch vụ bán chạy" icon={<Sparkles className="w-4 h-4 text-sakura-400"/>}>
          {[...services].filter(s=>s.active).slice(0,5).map((sv,i)=><RowItem key={sv.id} rank={i} name={sv.name} extra={String(sv.price)} sub="giá gốc"/>)}
        </TopBlock>
      </div>

      {/* Day invoice list */}
      {dayInvList.length > 0 && dateRange === "today" && (
        <div className="bg-sakura-card rounded-2xl border border-white/10 p-5 animate-fade-in">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-white font-semibold flex items-center gap-2">
              <FileText className="w-4 h-4 text-sakura-400" /> Hóa đơn ngày <span className="text-gold-400">{formatDate(selectedDay)}</span> ({dayInvList.length})
            </h3>
            <button onClick={() => onNavigate("/invoices")} className="text-xs text-gold-400 hover:text-gold-300">Xem tất cả →</button>
          </div>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {dayInvList.map(inv => (
              <div key={inv.id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0 group">
                <div className="flex items-center gap-3">
                  <FileText className="w-4 h-4 text-sakura-300" />
                  <div>
                    <div className="text-sm text-white font-medium">
                      {inv.invoiceNo}
                      <button onClick={() => doPrintInvoice(inv)} className="ml-2 opacity-0 group-hover:opacity-100 transition" title="In">
                        <Printer size={13} />
                      </button>
                    </div>
                    <div className="text-xs text-white/50">{inv.customerName}</div>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-sm text-white font-bold">{formatCurrency(inv.total)}</span>
                  <Badge variant={inv.status==="completed"?"success":"warning"}>{inv.status==="completed"?"Đã thanh toán":"Chờ"}</Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Invoices */}
        <RecentInvoicesBlock onSelectCustomer={(id) => onNavigate(`/customer/${id}`)} onNavigate={onNavigate} />
        
        {/* Low Stock + Top Products */}
        <LowStockAndProductsBlock lowStock={products.filter(p => p.stock <= p.minStock)} topProds={computeTopProductRows(allInvoices)} />
      </div>

      {/* Top Customers */}
      <div className="bg-sakura-card rounded-2xl border border-white/10 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-semibold flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-400" />
            <span>Khách hàng thân thiết</span>
          </h3>
          <button onClick={() => onNavigate("/customers")} className="text-xs text-gold-400 hover:text-gold-300">Xem tất cả <ArrowUpRight className="w-3 h-3"/></button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[...customers].sort((a,b) => b.totalSpent - a.totalSpent).slice(0, 6).map(c => (
            <div key={c.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition cursor-pointer" onClick={() => onNavigate(`/customer/${c.id}`)}>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sakura-400 to-rose-400 flex items-center justify-center text-white font-bold text-sm shadow-lg">
                {c.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm text-white font-medium truncate">{c.name}</div>
                <div className="text-xs text-white/50">{c.visitCount} lượt · {formatCurrency(c.totalSpent)}</div>
              </div>
              {c.totalSpent >= 500000 && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-gold-500/20 text-gold-400">VIP</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Detail Modal */}
      {detailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop" onClick={() => setDetailModal(null)}>
          <div className="bg-gradient-to-br from-[#2d1b2e] to-[#3d1f2e] border border-white/10 rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] overflow-y-auto animate-fade-in" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-white/10">
              <h3 className="text-lg font-semibold text-white font-serif">{detailModal.title}</h3>
              <button onClick={() => setDetailModal(null)} className="text-white/50 hover:text-white p-1 rounded-lg hover:bg-white/10 transition">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-2">
              {detailModal.list.map((item, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                  <span className="text-sm text-white/80">{item.label}</span>
                  <span className="text-sm text-gold-400 font-medium">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ===== Sub-components ===== */

/** Quick bar chart for last 7 days */
function SevenDayChart() {
  const data = useMemo(() => {
    const d: { date: string; revenue: number; label: string }[] = [];
    for (let i = 6; i >= 0; i--) {
      const dt = new Date();
      dt.setDate(dt.getDate() - i);
      const ds = dt.toISOString().split("T")[0];
      const rev = allInvoices
        .filter(inv => inv.status === "completed" && inv.date.startsWith(ds))
        .reduce((s, i) => s + i.total, 0);
      d.push({
        date: ds,
        revenue: rev,
        label: new Intl.DateTimeFormat("vi-VN", { weekday: "short" }).format(new Date(ds)),
      });
    }
    return d;
  }, [allInvoices]);
  const mx = Math.max(...data.map(d => d.revenue), 1);
  return (
    <div className="flex items-end gap-1 h-32">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
          <div
            className="w-full rounded-t-md bg-gradient-to-t from-sakura-500 to-gold-400 transition-all hover:opacity-80 relative"
            style={{ height: `${Math.round((d.revenue / mx) * 90)}%`, minHeight: d.revenue > 0 ? "4px" : "1px" }}
          >
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[9px] text-gold-400 whitespace-nowrap bg-black/70 px-1 rounded opacity-0 group-hover:opacity-100">
              {formatCurrency(d.revenue)}
            </div>
          </div>
          <span className="text-[9px] text-white/40">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

// Mini calendar button
function MiniCalendar({ viewDate, onViewDay }: { viewDate: string; onViewDay?: (d: string) => void }) {
  return (
    <div className="flex items-center gap-2 bg-sakura-card rounded-xl border border-white/10 px-3 py-2">
      <input type="date" value={viewDate} onChange={e => onViewDay?.(e.target.value)} 
        className="bg-transparent text-white text-xs border-none outline-none" />
    </div>
  );
}

// Row item for top lists
function RowItem({ rank, name, extra, sub }: { rank: number; name: string; extra: string; sub: string }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className={`text-xs w-5 h-5 rounded-full flex items-center justify-center ${rank === 0 ? "bg-gold-500/30 text-gold-400" : "bg-white/10 text-white/50"}`}>
          {rank + 1}
        </span>
        <span className="text-sm text-white/80">{name}</span>
      </div>
      <div className="text-right">
        <div className="text-sm text-white font-medium">{extra}</div>
        <div className="text-[10px] text-white/40">{sub}</div>
      </div>
    </div>
  );
}

// Top block wrapper
function TopBlock({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-sakura-card rounded-2xl border border-white/10 p-5">
      <h3 className="text-white font-semibold mb-4 flex items-center gap-2">{icon} {title}</h3>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

// Recent invoices block
function RecentInvoicesBlock({ onSelectCustomer, onNavigate }: { onSelectCustomer: (id: string) => void; onNavigate: (p: string) => void }) {
  const recent = useMemo(() => 
    [...allInvoices].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5),
    [allInvoices]
  );
  return (
    <div className="bg-sakura-card rounded-2xl border border-white/10 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-semibold flex items-center gap-2">
          <FileText className="w-4 h-4 text-sakura-400" /> Hóa đơn gần đây
        </h3>
        <button onClick={() => onNavigate("/invoices")} className="text-xs text-gold-400 hover:text-gold-300">Xem tất cả <ArrowUpRight className="w-3 h-3"/></button>
      </div>
      <div className="space-y-2">
        {recent.map(inv => (
          <div key={inv.id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
            <div className="flex items-center gap-2">
              <FileText className="w-3.5 h-3.5 text-sakura-300" />
              <div>
                <div className="text-sm text-white font-medium">{inv.invoiceNo}</div>
                <div className="text-xs text-white/50">{inv.customerName}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-white font-bold">{formatCurrency(inv.total)}</div>
              <Badge variant={inv.status === "completed" ? "success" : "warning"}>{inv.status === "completed" ? "Đã thanh toán" : "Chờ"}</Badge>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Low stock warning + top products
function LowStockAndProductsBlock({ lowStock, topProds }: { lowStock: typeof products; topProds: { name: string; qty: number }[] }) {
  return (
    <div className="bg-sakura-card rounded-2xl border border-white/10 p-5">
      <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
        <Package className="w-4 h-4 text-gold-400" /> Kho & Sản phẩm
      </h3>
      {lowStock.length > 0 && (
        <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-3 mb-3">
          <div className="text-xs text-rose-200">⚠️ <strong>{lowStock.length} sản phẩm</strong> sắp hết hàng</div>
        </div>
      )}
      <div className="space-y-2">
        {topProds.map((p, i) => (
          <div key={i} className="flex items-center justify-between py-1.5 border-b border-white/5 last:border-0">
            <span className="text-sm text-white/80">{p.name}</span>
            <span className="text-xs text-gold-400">Đã bán: {p.qty}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Print helper
function doPrintInvoice(inv: any) {
  const pw = window.open("", "_blank");
  if (!pw) return;
  pw.document.write(`
    <html><head><title>Hóa đơn ${inv.invoiceNo}</title>
    <style>
      body{font-family:'Times New Roman',Georgia,serif;padding:40px;color:#222}
      .h{text-align:center;border-bottom:2px solid #d4a853;padding-bottom:20px;margin-bottom:20px}
      .h h1{font-size:24px;color:#8b1a3b;margin:0}
      .info{display:flex;justify-content:space-between;margin-bottom:20px;font-size:13px}
      .t{width:100%;border-collapse:collapse;margin:15px 0}
      .t th{background:#8b1a3b;color:white;padding:8px;text-align:left}
      .t td{padding:6px 8px;border-bottom:1px solid #ddd}
      .tot{text-align:right;font-size:14px}
      .sig{margin-top:40px;display:flex;justify-content:space-between}
      .sig div{text-align:center;width:30%}
      .sig .ln{border-top:1px solid #333;margin-top:50px;padding-top:5px;font-size:11px}
      .ftr{text-align:center;margin-top:30px;font-size:11px;color:#999;border-top:1px solid #eee;padding-top:15px}
    </style></head><body>
    <div class="h"><h1>🌸 SAKURA SPA & BEAUTY</h1><p>HÓA ĐƠN THANH TOÁN</p><small style="color:#d4a853">${siteConfig.slogan}</small></div>
    <div class="info">
      <div><strong>Số:</strong> ${inv.invoiceNo}<br/><strong>Ngày:</strong> ${new Date(inv.date).toLocaleString("vi-VN")}<br/><strong>KH:</strong> ${inv.customerName}<br/><strong>SĐT:</strong> ${inv.customerPhone}</div>
      <div style="text-align:right"><strong>${siteConfig.shortName}</strong><br/>${siteConfig.address}<br/>Tel: ${siteConfig.phone}</div>
    </div>
    <table class="t"><thead><tr><th>#</th><th>Dịch vụ / Sản phẩm</th><th>Loại</th><th>SL</th><th>Đơn giá</th><th>Giảm</th><th>Thành tiền</th></tr></thead><tbody>
    ${inv.items.map((it: any, i: number) => `<tr><td>${i+1}</td><td>${it.name}</td><td>${it.type==="service"?"DV":"SP"}</td><td>${it.quantity}</td><td>${formatCurrency(it.unitPrice)}</td><td>${it.discount||"—"}</td><td>${formatCurrency(it.unitPrice*it.quantity*(1-(it.discount||0)/100))}</td></tr>`).join("")}
    </tbody></table>
    <div class="tot">
      <p>Tạm tính: <b>${formatCurrency(inv.subtotal)}</b></p>
      <p>Giảm: ${formatCurrency(inv.discount)}</p>
      <p style="font-size:16px">Tổng cộng: <b style="color:#8b1a3b">${formatCurrency(inv.total)}</b></p>
      <p>PTTT: ${inv.paymentMethod}</p>
    </div>
    <div class="sig"><div><small>Khách hàng<br/></small><div class="ln">(Ký tên)</div></div><div></div><div><small>Nhân viên<br/></small><div class="ln">(Ký tên)</div></div></div>
    <div class="ftr">Cảm ơn Quý khách! Hẹn gặp lại tại Sakura Spa 🌸</div>
    <script>window.print()</script></body></html>
  `);
  pw.document.close();
}

// These are needed for the template to compile
function FileTextIcon() { return <FileText className="w-4 h-4" />; }