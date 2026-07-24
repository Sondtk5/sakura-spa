import { useState, useMemo } from "react";
import { invoices, customers, services, products, siteConfig } from "../data/site";
import type { InvoiceItem } from "../data/site";
import { formatCurrency, formatDate, Badge } from "../components/Shared";
import { BarChart3, DollarSign, TrendingUp, ShoppingBag, Sparkles, Users, Printer, Wallet2, EyeOff, LayoutGrid } from "lucide-react";

export function Reports() {
  const [period, setPeriod] = useState<"today" | "week" | "month" | "year" | "custom">("today");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [showDateInputs, setShowDateInputs] = useState(false);
  const [activeTab, setActiveTab] = useState<"revenue" | "profit" | "product-detail">("revenue");
  const [chartType, setChartType] = useState<"bar" | "line">("bar");

  // Custom period helper
  const isInRange = (dateStr: string) => {
    if (!dateStr.includes("-")) return true;
    const d = new Date(dateStr).toISOString().split("T")[0];
    if (period === "today") return d === new Date().toISOString().split("T")[0];
    if (period === "week") {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return d >= weekAgo.toISOString().split("T")[0] && d <= new Date().toISOString().split("T")[0];
    }
    if (period === "month") {
      const m1 = new Date();
      m1.setMonth(m1.getMonth(), 1);
      return d >= m1.toISOString().split("T")[0] && d <= new Date().toISOString().split("T")[0];
    }
    if (period === "year") return d.startsWith(new Date().getFullYear().toString());
    if (period === "custom" && customStart && customEnd) return d >= customStart && d <= customEnd;
    return true;
  };

  const filteredInvoices = useMemo(() => {
    return invoices.filter(inv => inv.status === "completed" && isInRange(inv.date));
  }, [period, customStart, customEnd, invoices]);

  // Stats
  const stats = useMemo(() => {
    const revenue = filteredInvoices.reduce((s, i) => s + i.total, 0);
    const count = filteredInvoices.length;
    const avg = count > 0 ? Math.round(revenue / count) : 0;
    const totalDiscounted = filteredInvoices.reduce((s, i) => s + i.discount, 0);
    return { revenue, count, avg, totalDiscounted };
  }, [filteredInvoices]);

  // Chart data — works for ALL periods now
  const chartData = useMemo(() => {
    const now = new Date();
    if (period === "today") {
      // Show hourly chart for today
      const hours: { label: string; revenue: number }[] = [];
      for (let h = 6; h <= 22; h++) {
        const hr = String(h).padStart(2, "0");
        const rev = filteredInvoices.filter(i => i.date.slice(11, 13) === hr).reduce((s, i) => s + i.total, 0);
        hours.push({ label: `${h}h`, revenue: rev });
      }
      return hours;
    }
    if (period === "week" || (period === "custom" && customStart)) {
      const days: { label: string; revenue: number }[] = [];
      let startDate: Date;
      if (period === "week") {
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 6);
      } else {
        startDate = new Date(customStart);
      }
      const end = new Date(period === "week" ? new Date().toISOString().split("T")[0] : customEnd || now);
      for (let d = new Date(startDate); d <= end; d.setDate(d.getDate() + 1)) {
        const ds = d.toISOString().split("T")[0];
        const rev = filteredInvoices.filter(i => i.date.startsWith(ds)).reduce((s, i) => s + i.total, 0);
        const dayNames = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
        days.push({ label: `${d.getDate()}/${d.getMonth()+1} (${dayNames[d.getDay()]})`, revenue: rev });
      }
      return days;
    }
    if (period === "month") {
      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      const days: { label: string; revenue: number }[] = [];
      for (let d = 1; d <= daysInMonth; d++) {
        const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
        const rev = filteredInvoices.filter(i => i.date.startsWith(dateStr)).reduce((s, i) => s + i.total, 0);
        days.push({ label: String(d), revenue: rev });
      }
      return days;
    }
    // Year
    const months: { label: string; revenue: number }[] = [];
    for (let m = 0; m < 12; m++) {
      const monthPrefix = `${now.getFullYear()}-${String(m+1).padStart(2,"0")}`;
      const rev = filteredInvoices.filter(i => i.date.startsWith(monthPrefix)).reduce((s, i) => s + i.total, 0);
      months.push({ label: `T${m+1}`, revenue: rev });
    }
    return months;
  }, [filteredInvoices, period, customStart, customEnd]);

  const maxRev = Math.max(...chartData.map(d => d.revenue), 1);

  // Top services & products by revenue
  const buildTopMap = (typeFilter: string) => {
    const map = new Map<string, { name: string; count: number; revenue: number }>();
    filteredInvoices.forEach(inv => {
      inv.items.filter(it => it.type === typeFilter as any).forEach(it => {
        const e = map.get(it.id) || { name: it.name, count: 0, revenue: 0 };
        e.count += it.quantity;
        e.revenue += it.unitPrice * it.quantity;
        map.set(it.id, e);
      });
    });
    return Array.from(map.values()).sort((a, b) => b.revenue - a.revenue).slice(0, 8);
  };
  const topServices = buildTopMap("service");
  const topProducts = buildTopMap("product");
  const topCustomersArr = (() => {
    const map = new Map<string, { name: string; revenue: number; count: number }>();
    filteredInvoices.forEach(inv => {
      const e = map.get(inv.customerId) || { name: inv.customerName, revenue: 0, count: 0 };
      e.revenue += inv.total;
      e.count += 1;
      map.set(inv.customerId, e);
    });
    return Array.from(map.values()).sort((a, b) => b.revenue - a.revenue).slice(0, 5);
  })();

  // ---- PROFIT REPORT ----
  const productProfit = useMemo(() => {
    const result: { productName: string; barcode: string; qtySold: number; revenue: number; costTotal: number; grossProfit: number; marginPercent: number; unitCost: number; unitSell: number }[] = [];

    filteredInvoices.forEach(inv => {
      inv.items.filter(it => it.type === "product").forEach(it => {
        const prod = products.find(p => p.barcode.includes(it.id) || p.code.toLowerCase().includes(it.id.toLowerCase()) || p.name === it.name);
        const costPerUnit = prod ? prod.costPrice : Math.round(it.unitPrice * 0.5);
        const row = result.find(r => r.productName === it.name);
        if (row) {
          row.qtySold += it.quantity;
          row.revenue += it.unitPrice * it.quantity;
          row.costTotal += costPerUnit * it.quantity;
          row.grossProfit += (it.unitPrice - costPerUnit) * it.quantity;
        } else {
          result.push({
            productName: it.name,
            barcode: prod?.barcode || "",
            qtySold: it.quantity,
            revenue: it.unitPrice * it.quantity,
            costTotal: costPerUnit * it.quantity,
            grossProfit: (it.unitPrice - costPerUnit) * it.quantity,
            marginPercent: it.unitPrice > 0 ? ((it.unitPrice - costPerUnit) / it.unitPrice * 100) : 0,
            unitCost: costPerUnit,
            unitSell: it.unitPrice,
          });
        }
      });
    });
    return result.sort((a, b) => b.grossProfit - a.grossProfit);
  }, [filteredInvoices, products]);

  const serviceProfit = useMemo(() => {
    const result: { serviceName: string; qtySold: number; revenue: number; laborCost: number; grossProfit: number; marginPercent: number }[] = [];
    filteredInvoices.forEach(inv => {
      inv.items.filter(it => it.type === "service").forEach(it => {
        const laborCost = Math.round(it.unitPrice * 0.3); // giả định chi phí lao động ~30%
        const row = result.find(r => r.serviceName === it.name);
        if (row) {
          row.qtySold += it.quantity;
          row.revenue += it.unitPrice * it.quantity;
          row.laborCost += laborCost * it.quantity;
          row.grossProfit += (it.unitPrice - laborCost) * it.quantity;
        } else {
          result.push({
            serviceName: it.name,
            qtySold: it.quantity,
            revenue: it.unitPrice * it.quantity,
            laborCost: laborCost * it.quantity,
            grossProfit: (it.unitPrice - laborCost) * it.quantity,
            marginPercent: it.unitPrice > 0 ? ((it.unitPrice - laborCost) / it.unitPrice * 100) : 0,
          });
        }
      });
    });
    return result.sort((a, b) => b.grossProfit - a.grossProfit);
  }, [filteredInvoices]);

  const totalCogs = productProfit.reduce((s, p) => s + p.costTotal, 0);
  const totalRevenue = stats.revenue;
  const totalLaborCost = serviceProfit.reduce((s, p) => s + p.laborCost, 0);
  const totalGrossProfit = totalRevenue - totalCogs - totalLaborCost;
  const overallMargin = totalRevenue > 0 ? (totalGrossProfit / totalRevenue * 100) : 0;

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    let printHtml = `<html><head><title>Báo cáo</title><style>
      body{font-family:Georgia;padding:30px;color:#222}
      .header{text-align:center;border-bottom:2px solid #d4a853;padding-bottom:15px;margin-bottom:15px}
      .header h1{color:#8b1a3b;margin:0;font-size:22px}
      .stats{display:flex;gap:15px;margin:20px 0}
      .stat-box{flex:1;text-align:center;background:#fdf2f8;padding:15px;border-radius:8px}
      .stat-box .num{font-size:22px;font-weight:bold;color:#8b1a3b}
      .stat-box .label{font-size:11px;color:#999}
      table{width:100%;border-collapse:collapse;margin-bottom:20px}
      th{background:#8b1a3b;color:white;padding:8px;text-align:left}
      td{padding:6px 8px;border-bottom:1px solid #ddd}
      .footer{text-align:center;margin-top:30px;font-size:11px;color:#999;border-top:1px solid #ddd;padding-top:15px}
    </style></head><body>
      <div class="header"><h1>🌸 ${siteConfig.name}</h1><p>${activeTab === 'revenue' ? 'BÁO CÁO DOANH THU' : activeTab === 'profit' ? 'BÁO CÁO LỢI NHUẬN' : 'CHI TIẾT SẢN PHẨM'} — ${getPeriodLabel()}</p></div>
      <div class="stats">
        <div class="stat-box"><div class="num">${formatCurrency(stats.revenue)}</div><div class="label">Doanh thu</div></div>
        <div class="stat-box"><div class="num">${stats.count}</div><div class="label">Hóa đơn</div></div>
        <div class="stat-box"><div class="num">${formatCurrency(totalGrossProfit)}</div><div class="label">Lợi nhuận gộp</div></div>
        <div class="stat-box"><div class="num">${overallMargin.toFixed(1)}%</div><div class="label">Biên lợi nhuận</div></div>
      </div>
      ${generatePrintTable()}
      <script>window.print()</script></body></html>`;
    printWindow.document.write(printHtml);
    printWindow.document.close();
  };

  const getPeriodLabel = () => {
    if (period === "today") return "Hôm nay";
    if (period === "week") return "Tuần này";
    if (period === "month") return "Tháng này";
    if (period === "year") return "Năm nay";
    return `Từ ${customStart} → ${customEnd}`;
  };

  const generatePrintTable = () => {
    if (activeTab === "revenue") {
      let html = "<h3>Dịch vụ bán chạy</h3><table><tr><th>#</th><th>Tên</th><th>Lượt</th><th>Doanh thu</th></tr>";
      topServices.forEach((s,i) => { html += `<tr><td>${i+1}</td><td>${s.name}</td><td>${s.count}</td><td>${formatCurrency(s.revenue)}</td></tr>`; });
      html += "</table>";
      html += "<h3>Sản phẩm bán chạy</h3><table><tr><th>#</th><th>Tên</th><th>Số lượng</th><th>Doanh thu</th></tr>";
      topProducts.forEach((s,i) => { html += `<tr><td>${i+1}</td><td>${s.name}</td><td>${s.count}</td><td>${formatCurrency(s.revenue)}</td></tr>`; });
      html += "</table>";
      return html;
    }
    if (activeTab === "profit") {
      let html = "<h3>Lợi nhuận tổng quan</h3><table><tr><th>Chỉ tiêu</th><th>Giá trị</th></tr>";
      html += `<tr><td>Tổng doanh thu</td><td>${formatCurrency(totalRevenue)}</td></tr>`;
      html += `<tr><td>Giá vốn hàng bán</td><td>${formatCurrency(totalCogs)}</td></tr>`;
      html += `<tr><td>Chi phí lao động DV</td><td>${formatCurrency(totalLaborCost)}</td></tr>`;
      html += `<tr><td>Lợi nhuận gộp</td><td>${formatCurrency(totalGrossProfit)}</td></tr>`;
      html += `<tr><td>Biên lợi nhuận</td><td>${overallMargin.toFixed(1)}%</td></tr></table>`;
      html += "<h3>Chi tiết sản phẩm</h3><table><tr><th>#</th><th>Tên SP</th><th>SL</th><th>Doanh thu</th><th>Giá vốn</th><th>Lợi nhuận</th><th>Biên %</th></tr>";
      productProfit.forEach((p,i) => { html += `<tr><td>${i+1}</td><td>${p.productName}</td><td>${p.qtySold}</td><td>${formatCurrency(p.revenue)}</td><td>${formatCurrency(p.costTotal)}</td><td>${formatCurrency(p.grossProfit)}</td><td>${p.marginPercent.toFixed(1)}%</td></tr>`; });
      html += "</table>";
      html += "<h3>Chi tiết dịch vụ</h3><table><tr><th>#</th><th>Tên DV</th><th>SL</th><th>Doanh thu</th><th>CP LĐ</th><th>Lợi nhuận</th><th>Biên %</th></tr>";
      serviceProfit.forEach((s,i) => { html += `<tr><td>${i+1}</td><td>${s.serviceName}</td><td>${s.qtySold}</td><td>${formatCurrency(s.revenue)}</td><td>${formatCurrency(s.laborCost)}</td><td>${formatCurrency(s.grossProfit)}</td><td>${s.marginPercent.toFixed(1)}%</td></tr>`; });
      html += "</table>";
      return html;
    }
    return "";
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white font-serif">Báo cáo</h1>
          <p className="text-white/50 text-sm mt-1">{siteConfig.shortName}</p>
        </div>
        <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-gold-500 to-amber-600 text-white rounded-xl text-sm font-medium hover:opacity-90 transition shadow-lg shadow-gold-500/20">
          <Printer className="w-4 h-4" /> In báo cáo
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white/5 rounded-xl p-1 border border-white/10 w-fit">
        {[
          { key: "revenue" as const, label: "📊 Doanh thu" },
          { key: "profit" as const, label: "💰 Lợi nhuận" },
          { key: "product-detail" as const, label: "🔍 Chi tiết SP" },
        ].map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`px-4 py-2 rounded-lg text-sm transition ${activeTab === tab.key ? "bg-sakura-500/30 text-white font-medium shadow" : "text-white/50 hover:text-white"}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Period filter */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="flex gap-2 flex-wrap">
          {(["today","week","month","year"] as const).map(p => (
            <button key={p} onClick={() => { setPeriod(p); setShowDateInputs(false); }} className={`px-3 py-2 rounded-xl text-xs transition ${period===p?"bg-sakura-500/30 text-white border border-sakura-500/30":"bg-white/5 text-white/60 border border-white/10 hover:bg-white/10"}`}>
              {p==="today"?"Hôm nay":p==="week"?"Tuần này":p==="month"?"Tháng này":"Năm nay"}
            </button>
          ))}
          <button onClick={() => { setPeriod("custom"); setShowDateInputs(!showDateInputs); }} className={`px-3 py-2 rounded-xl text-xs transition ${period==="custom"?"bg-sakura-500/30 text-white border border-sakura-500/30":"bg-white/5 text-white/60 border border-white/10 hover:bg-white/10"}`}>
            Khoảng thời gian tùy chọn 📅
          </button>
        </div>
        {showDateInputs && (
          <div className="flex gap-2 items-center flex-wrap">
            <input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)} className="px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-xs focus:border-sakura-400/50" />
            <span className="text-white/40">→</span>
            <input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)} className="px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-xs focus:border-sakura-400/50" />
          </div>
        )}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-gold-500/20 to-gold-600/10 rounded-2xl border border-gold-500/20 p-5">
          <div className="text-white/60 text-sm mb-2 flex items-center gap-2"><DollarSign className="w-4 h-4" /> Tổng doanh thu</div>
          <div className="text-2xl font-bold text-gold-400">{formatCurrency(stats.revenue)}</div>
        </div>
        <div className="bg-sakura-card rounded-2xl border border-white/10 p-5">
          <div className="text-white/60 text-sm mb-2">Số hóa đơn</div>
          <div className="text-2xl font-bold text-white">{stats.count}</div>
        </div>
        <div className="bg-sakura-card rounded-2xl border border-white/10 p-5">
          <div className="text-white/60 text-sm mb-2">Trung bình mỗi đơn</div>
          <div className="text-2xl font-bold text-white">{formatCurrency(stats.avg)}</div>
        </div>
        {activeTab === "profit" && (
          <div className="bg-emerald-500/10 rounded-2xl border border-emerald-500/20 p-5">
            <div className="text-white/60 text-sm mb-2 flex items-center gap-2"><Wallet2 className="w-4 h-4 text-emerald-300" /> Lợi nhuận gộp</div>
            <div className="text-2xl font-bold text-emerald-300">{formatCurrency(totalGrossProfit)}</div>
            <div className="text-xs text-white/40 mt-1">Biên lợi nhuận: {overallMargin.toFixed(1)}%</div>
          </div>
        )}
      </div>

            {/* Chart with bar/line toggle and auto-zoom */}
      {chartData.length > 0 && (
        <div className="bg-sakura-card rounded-2xl border border-white/10 p-5">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <h3 className="text-white font-semibold">Doanh thu theo {period === "today" ? "giờ" : period === "year" ? "tháng" : "ngày"}</h3>
            <div className="flex gap-1 bg-white/5 rounded-lg p-0.5">
              <button onClick={() => setChartType("bar")} className={`px-3 py-1 rounded-md text-xs transition ${chartType === "bar" ? "bg-sakura-500/40 text-white" : "text-white/50 hover:text-white/70"}`}>Cột</button>
              <button onClick={() => setChartType("line")} className={`px-3 py-1 rounded-md text-xs transition ${chartType === "line" ? "bg-sakura-500/40 text-white" : "text-white/50 hover:text-white/70"}`}>Đường</button>
            </div>
          </div>
          <SimpleBarLineChart data={chartData} maxRev={maxRev} type={chartType} />
        </div>
      )}

      {/* Tab: Revenue Report */}
      {activeTab === "revenue" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <StatBlock title="Dịch vụ bán chạy" icon={<Sparkles className="w-4 h-4 text-sakura-400"/>}>{topServices.map((sv,i)=><RowItem key={i} rank={i} name={sv.name} extra={`${sv.count} lượt`} sub={formatCurrency(sv.revenue)}/>)}</StatBlock>
          <StatBlock title="Sản phẩm bán chạy" icon={<ShoppingBag className="w-4 h-4 text-gold-400"/>}>{topProducts.map((p,i)=><RowItem key={i} rank={i} name={p.name} extra={`${p.count} cái`} sub={formatCurrency(p.revenue)}/>)}</StatBlock>
          <StatBlock title="Khách hàng top" icon={<Users className="w-4 h-4 text-blue-400"/>}>{topCustomersArr.map((c,i)=><RowItem key={i} rank={i} name={c.name} extra={`${c.count} HD`} sub={formatCurrency(c.revenue)}/>)}</StatBlock>
        </div>
      )}

      {/* Tab: Profit Report */}
      {activeTab === "profit" && (
        <>
          {/* Overall summary */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <SummaryBox color="gold" label="Tổng doanh thu" value={formatCurrency(stats.revenue)} />
            <SummaryBox color="rose" label="Giá vốn hàng bán" value={formatCurrency(totalCogs + totalLaborCost)} />
            <SummaryBox color="emerald" label="Lợi nhuận gộp" value={formatCurrency(totalGrossProfit)} />
            <SummaryBox color="blue" label="Biên lợi nhuận" value={`${overallMargin.toFixed(1)}%`} />
          </div>
          {/* Product detail table */}
          <ProfitDetailTable title="Chi tiết lợi nhuận sản phẩm" data={productProfit.map(p => ({name: p.productName, sales: p.qtySold, revenue: p.revenue, cost: p.costTotal, gross: p.grossProfit, margin: p.marginPercent}))} metric="sales"/>
          {/* Service profitability table */}
          <ProfitDetailTable title="Chi tiết lợi nhuận dịch vụ" data={serviceProfit.map(s=>({name:s.serviceName,sales:s.qtySold,revenue:s.revenue,cost:s.laborCost,gross:s.grossProfit,margin:s.marginPercent}))} metric="service" />
        </>
      )}

      {/* Tab: Product Detail Report */}
      {activeTab === "product-detail" && (
        <ProductDetailTable allProducts={products} invoiceItems={filteredInvoices.flatMap(i=>i.items.filter(it=>it.type==='product'))} />
      )}
    </div>
  );
}

// Sub-components used in Reports
function StatBlock({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (<div className="bg-sakura-card rounded-2xl border border-white/10 p-5">{<h3 className="text-white font-semibold mb-4 flex items-center gap-2">{icon} {title}</h3>}<div className="space-y-3">{children}</div></div>);
}
const RowItem = ({ rank, name, extra, sub }: { rank: number; name: string; extra: string; sub: string }) => (
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-2"><span className={`text-xs w-5 h-5 rounded-full flex items-center justify-center ${rank===0?"bg-gold-500/30 text-gold-400":"bg-white/10 text-white/50"}`}>{rank+1}</span><span className="text-sm text-white/80">{name}</span></div>
    <div className="text-right"><div className="text-sm text-white font-medium">{extra}</div><div className="text-[10px] text-white/40">{sub}</div></div>
  </div>
);
function SummaryBox({ color, label, value }: { color: "gold"|"rose"|"emerald"|"blue"; label: string; value: string }) {
  const colors = { gold:"from-gold-500/20 to-gold-600/10 border-gold-500/20 text-gold-400", rose:"from-rose-500/20 to-rose-600/10 border-rose-500/20 text-rose-300", emerald:"from-emerald-500/20 to-emerald-600/10 border-emerald-500/20 text-emerald-300", blue:"from-blue-500/20 to-blue-600/10 border-blue-500/20 text-blue-300" };
  return (<div className={`bg-gradient-to-br ${colors[color]} rounded-2xl border p-5`}><div className="text-white/60 text-sm">{label}</div><div className="text-xl font-bold mt-1">{value}</div></div>);
}
function ProfitDetailTable<T extends {name:string;sales?:number;revenue?:number;cost?:number;gross?:number;margin?:number}>({ title, data, metric }: { title: string; data: T[]; metric: "sales" | "service" }) {
  return (<div className="bg-sakura-card rounded-2xl border border-white/10 p-5"><h3 className="text-white font-semibold mb-4">{title}</h3>
    <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="bg-white/5 border-b border-white/10">{metric==="sales" ?
      [<th key="n" className="text-left px-3 py-2 text-white/50 text-xs">Tên sản phẩm</th>,<th key="q" className="text-right px-3 py-2 text-white/50 text-xs">Đã bán</th>,<th key="r" className="text-right px-3 py-2 text-white/50 text-xs">Doanh thu</th>,<th key="c" className="text-right px-3 py-2 text-white/50 text-xs">Giá vốn</th>,<th key="g" className="text-right px-3 py-2 text-white/50 text-xs">Lợi nhuận</th>,<th key="m" className="text-right px-3 py-2 text-white/50 text-xs">Biên %</th>] :
      [<th key="n" className="text-left px-3 py-2 text-white/50 text-xs">Tên DV/Sản phẩm</th>,<th key="q" className="text-right px-3 py-2 text-white/50 text-xs">SL</th>,<th key="r" className="text-right px-3 py-2 text-white/50 text-xs">Doanh thu</th>,<th key="l" className="text-right px-3 py-2 text-white/50 text-xs">Chi phí LĐ</th>,<th key="g" className="text-right px-3 py-2 text-white/50 text-xs">Lợi nhuận</th>,<th key="m" className="text-right px-3 py-2 text-white/50 text-xs">Biên %</th>] }</tr></thead>
      <tbody className="divide-y divide-white/5">{data.map((item,i)=>{
        const g = item.gross??0, m = item.margin??0;
        return(<tr key={i} className="hover:bg-white/5 transition">
          <td className="px-3 py-2 text-white font-medium text-xs">{i+1}. {item.name}</td>
          <td className="px-3 py-2 text-white/60 text-xs text-right">{item.sales}</td>
          <td className="px-3 py-2 text-gold-400 text-xs text-right">{formatCurrency(item.revenue??0)}</td>
          {metric==="service"?<td className="px-3 py-2 text-rose-300 text-xs text-right">{formatCurrency(item.cost??0)}</td>:<td className="px-3 py-2 text-rose-300 text-xs text-right">{formatCurrency(item.cost??0)}</td>}
          <td className={`px-3 py-2 text-xs text-right font-semibold ${g>=0?"text-emerald-300":"text-rose-300"}`}>{formatCurrency(g)}</td>
          <td className={`px-3 py-2 text-xs text-right font-mono ${m>=30?"text-emerald-300":m>=15?"text-gold-400":"text-rose-300"}`}>{m.toFixed(1)}%</td>
        </tr>);
      })}</tbody></table></div></div>);
}
function ProductDetailTable({ allProducts, invoiceItems }: { allProducts: any[]; invoiceItems: InvoiceItem[] }) {
  const productSales = useMemo(() => {
    const map = new Map<string, number>();
    invoiceItems.forEach(it => map.set(it.id, (map.get(it.id) || 0) + it.quantity));
    return map;
  }, [invoiceItems]);
  const stockMap = useMemo(() => allProducts.filter(p => p.active).map(p => ({
    ...p,
    sold: productSales.get(p.id) || 0,
    remaining: p.stock - (productSales.get(p.id) || 0),
  })), [allProducts, productSales]);
  return (<div className="bg-sakura-card rounded-2xl border border-white/10 p-5"><h3 className="text-white font-semibold mb-4">Kho & Bán hàng thời gian thực</h3>
    <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="bg-white/5 border-b border-white/10">
      {["Mã SP","Tên","Barcode","Danh mục","Giá nhập","Giá bán","Tồn kho","Đã bán","Còn lại"].map(h=><th key={h} className="text-left px-3 py-2 text-white/50 text-xs">{h}</th>)}
    </tr></thead><tbody className="divide-y divide-white/5">
      {stockMap.map(p => {
        const remaining = p.stock - p.sold;
        return (<tr key={p.id} className="hover:bg-white/5 transition">
          <td className="px-3 py-2 text-gold-400 text-xs font-mono">{p.code}</td>
          <td className="px-3 py-2 text-white text-xs">{p.name}</td>
          <td className="px-3 py-2 text-white/40 text-xs font-mono">{p.barcode}</td>
          <td className="px-3 py-2 text-white/50 text-xs">{p.category}</td>
          <td className="px-3 py-2 text-emerald-300 text-xs">{formatCurrency(p.costPrice)}</td>
          <td className="px-3 py-2 text-white text-xs">{formatCurrency(p.sellingPrice)}</td>
          <td className="px-3 py-2 text-white/60 text-xs">{p.stock}</td>
          <td className="px-3 py-2 text-sakura-300 text-xs">{p.sold}</td>
          <td className={`px-3 py-2 font-medium text-xs ${remaining <= p.minStock ? "text-rose-300" : "text-emerald-300"}`}>{Math.max(0, remaining)}</td>
        </tr>);
      })}
    </tbody></table></div></div>);
}


// ─── SVG Bar/Line Chart Component (auto-zoom to data range) ──────────────
interface ChartDataPoint { label: string; revenue: number }

function formatK(n: number): string {
  if (n >= 1e9) return (n / 1e9).toFixed(1) + "B";
  if (n >= 1e6) return (n / 1e6).toFixed(1) + "M";
  if (n >= 1e3) return (n / 1e3).toFixed(0) + "k";
  return String(Math.round(n));
}

function niceCeiling(v: number): number {
  if (v <= 0) return 100;
  const mag = Math.pow(10, Math.floor(Math.log10(v)));
  const c = Math.ceil(v / mag) * mag;
  return c < 100 ? 100 : c;
}

function tickVals(maxVal: number): number[] {
  const t: number[] = [0];
  for (let i = 1; i <= 4; i++) t.push(Math.round(maxVal / 5 * i));
  return t;
}

function SimpleBarLineChart({ data, maxRev, type }: {
  data: ChartDataPoint[];
  maxRev: number;
  type: "bar" | "line";
}) {
  const n = data.length;
  const yMax = niceCeiling(maxRev || 1);
  const svgH = 260;
  const padTop = 30;
  const padBot = 40;
  const padL = 75;
  const padR = 15;
  const plotW = 600 - padL - padR;
  const plotH = svgH - padTop - padBot;
  const cellW = n === 1 ? plotW : plotW / (n - 1);

  // Prepare points
  const pts: { x: number; y: number }[] = [];
  for (let i = 0; i < n; i++) {
    const px = n === 1 ? padL + plotW / 2 : padL + i * cellW;
    const py = padTop + plotH - (data[i].revenue / yMax) * plotH;
    pts.push({ x: px, y: py });
  }

  // Line path
  const lp = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");

  // Tick labels on Y axis
  const ticks = tickVals(yMax);

  return (
    <div className="overflow-x-auto pb-2 custom-scrollbar">
      <svg viewBox={`0 0 ${padL + plotW + padR + 10} ${svgH}`} style={{ minWidth: 300 }} preserveAspectRatio="xMidYMid meet">
        {/* Defs */}
        <defs>
          <linearGradient id="sbGrad" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="#c2185b"/>
            <stop offset="100%" stopColor="#d4a853"/>
          </linearGradient>
          <linearGradient id="laGrad" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="#d4a853" stopOpacity="0.3"/>
            <stop offset="100%" stopColor="#d4a853" stopOpacity="0"/>
          </linearGradient>
        </defs>

        {/* X-Axis baseline */}
        <line x1={padL} y1={padTop + plotH} x2={padL + plotW} y2={padTop + plotH} stroke="rgba(255,255,255,0.1)" />

        {/* Y gridlines */}
        {ticks.map((tv, j) => {
          const yp = padTop + plotH - (tv / yMax) * plotH;
          return (<g key={j}>
            <line x1={padL} y1={yp} x2={padL + plotW} y2={yp} stroke="rgba(255,255,255,0.06)" strokeDasharray="3,3" />
            <text x={padL - 8} y={yp + 4} fill="rgba(255,255,255,0.3)" fontSize="10" textAnchor="end">{formatK(tv)}</text>
          </g>);
        })}

        {/* Bars mode */}
        {type === "bar" && (() => {
          const barWidth = Math.max(6, Math.min(40, (plotW - (n - 1) * 4) / n));
          return <>
            {pts.map((pt, idx) => {
              const actualX = idx % 2 === 0 ? pt.x - barWidth / 2 : pt.x + cellW / 2 - barWidth / 2;
              const bx = idx % 2 === 0 ? padL + idx * (cellW + 4) + (cellW - barWidth) / 2 : padL + idx * (cellW + 4) + (cellW - barWidth) / 2;
              const bh = data[idx].revenue > 0 ? ((data[idx].revenue / yMax) * plotH) : 2;
              const by = padTop + plotH - bh;
              return (<rect key={idx} x={bx} y={by} width={barWidth} height={bh} rx={2} fill="url(#sbGrad)" opacity={0.85}><title>{`${data[idx].label}: ${formatCurrency(data[idx].revenue)}`}</title></rect>);
            })}
            {data.map((d, i) => (
              <text key={"t"+i} x={padL + i * cellW + cellW/2} y={padTop + plotH + 18} fill="rgba(255,255,255,0.35)" fontSize="9" textAnchor="middle" transform={n > 16 ? `rotate(-30,${padL + i*cellW+cellW/2},${padTop+plotH+18})` : ""}>{d.label}</text>
            ))}
          </>;
        })()}

        {/* Line mode */}
        {type !== "bar" && (<g>
          {/* Area under curve */}
          <path d={`${lp} L${pts[pts.length-1].x},${padTop+plotH} L${pts[0].x},${padTop+plotH} Z`} fill="url(#laGrad)" />
          {/* Line */}
          <path d={lp} fill="none" stroke="#d4a853" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          {/* Points */}
          {pts.map((p, i) => (<circle key={i} cx={p.x} cy={p.y} r="3.5" fill="#d4a853" stroke="#3d1f2e" strokeWidth="2"><title>{`${data[i].label}: ${formatCurrency(data[i].revenue)}`}</title></circle>))}
          {/* Labels */}
          {data.map((d, i) => (
            <text key={"tl"+i} x={pts[i].x} y={padTop + plotH + 18} fill="rgba(255,255,255,0.35)" fontSize="9" textAnchor="middle" transform={n > 16 ? `rotate(-30,${pts[i].x},${padTop+plotH+18})` : ""}>{d.label}</text>
          ))}
        </g>)}
      </svg>
    </div>
  );
}
