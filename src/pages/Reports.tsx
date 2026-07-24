import { useState, useMemo } from "react";
import { invoices, customers, services, products } from "../data/site";
import { formatCurrency, formatDate, Badge } from "../components/Shared";
import { BarChart3, DollarSign, TrendingUp, ShoppingBag, Sparkles, Users, Printer, Download, Filter, ArrowUpRight } from "lucide-react";

export function Reports() {
  const [period, setPeriod] = useState<"today" | "week" | "month" | "year">("month");

  const filteredInvoices = useMemo(() => {
    const now = new Date();
    const today = now.toISOString().split("T")[0];
    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekAgoStr = weekAgo.toISOString().split("T")[0];
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
    const yearStart = new Date(now.getFullYear(), 0, 1).toISOString().split("T")[0];

    return invoices.filter(inv => inv.status === "completed").filter(inv => {
      const d = inv.date.split("T")[0];
      if (period === "today") return d === today;
      if (period === "week") return d >= weekAgoStr && d <= today;
      if (period === "month") return d >= monthStart && d <= today;
      return d >= yearStart && d <= today;
    });
  }, [period]);

  const stats = useMemo(() => {
    const revenue = filteredInvoices.reduce((s, i) => s + i.total, 0);
    const count = filteredInvoices.length;
    const avg = count > 0 ? Math.round(revenue / count) : 0;
    return { revenue, count, avg };
  }, [filteredInvoices]);

  // Daily chart data (month only)
  const chartData = useMemo(() => {
    if (period !== "month") return [];
    const now = new Date();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const days: { day: number; revenue: number }[] = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      const rev = filteredInvoices.filter(i => i.date.startsWith(dateStr)).reduce((s, i) => s + i.total, 0);
      days.push({ day: d, revenue: rev });
    }
    return days;
  }, [filteredInvoices, period]);

  const maxRev = Math.max(...chartData.map(d => d.revenue), 1);

  // Top services
  const topServices = useMemo(() => {
    const map = new Map<string, { name: string; count: number; revenue: number }>();
    filteredInvoices.forEach(inv => {
      inv.items.filter(it => it.type === "service").forEach(it => {
        const e = map.get(it.id) || { name: it.name, count: 0, revenue: 0 };
        e.count += it.quantity;
        e.revenue += it.unitPrice * it.quantity;
        map.set(it.id, e);
      });
    });
    return Array.from(map.values()).sort((a, b) => b.revenue - a.revenue).slice(0, 5);
  }, [filteredInvoices]);

  // Top products
  const topProducts = useMemo(() => {
    const map = new Map<string, { name: string; count: number; revenue: number }>();
    filteredInvoices.forEach(inv => {
      inv.items.filter(it => it.type === "product").forEach(it => {
        const e = map.get(it.id) || { name: it.name, count: 0, revenue: 0 };
        e.count += it.quantity;
        e.revenue += it.unitPrice * it.quantity;
        map.set(it.id, e);
      });
    });
    return Array.from(map.values()).sort((a, b) => b.revenue - a.revenue).slice(0, 5);
  }, [filteredInvoices]);

  // Top customers
  const topCustomers = useMemo(() => {
    const map = new Map<string, { name: string; revenue: number; count: number }>();
    filteredInvoices.forEach(inv => {
      const e = map.get(inv.customerId) || { name: inv.customerName, revenue: 0, count: 0 };
      e.revenue += inv.total;
      e.count += 1;
      map.set(inv.customerId, e);
    });
    return Array.from(map.values()).sort((a, b) => b.revenue - a.revenue).slice(0, 5);
  }, [filteredInvoices]);

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(`
      <html><head><title>Báo cáo doanh thu</title>
      <style>
        body { font-family: 'Times New Roman', Georgia, serif; padding: 40px; color: #222; }
        .header { text-align: center; border-bottom: 2px solid #d4a853; padding-bottom: 20px; margin-bottom: 20px; }
        .header h1 { font-size: 24px; color: #8b1a3b; margin: 0; }
        .header h2 { font-size: 16px; color: #666; font-weight: normal; }
        .stats { display: flex; justify-content: space-around; margin-bottom: 30px; }
        .stat-box { text-align: center; }
        .stat-box .num { font-size: 24px; font-weight: bold; color: #8b1a3b; }
        .stat-box .label { font-size: 12px; color: #999; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        th { background: #8b1a3b; color: white; padding: 8px; text-align: left; font-size: 13px; }
        td { padding: 6px 8px; border-bottom: 1px solid #ddd; font-size: 12px; }
        .footer { text-align: center; margin-top: 40px; font-size: 12px; color: #999; border-top: 1px solid #ddd; padding-top: 20px; }
      </style></head><body>
        <div class="header">
          <h1>🌸 SAKURA SPA & BEAUTY</h1>
          <h2>BÁO CÁO DOANH THU</h2>
          <p>Kỳ: ${period === "today" ? "Hôm nay" : period === "week" ? "Tuần này" : period === "month" ? "Tháng này" : "Năm nay"}</p>
        </div>
        <div class="stats">
          <div class="stat-box"><div class="num">${new Intl.NumberFormat("vi-VN").format(stats.revenue)}₫</div><div class="label">Tổng doanh thu</div></div>
          <div class="stat-box"><div class="num">${stats.count}</div><div class="label">Số hóa đơn</div></div>
          <div class="stat-box"><div class="num">${new Intl.NumberFormat("vi-VN").format(stats.avg)}₫</div><div class="label">TB mỗi đơn</div></div>
        </div>
        <h3>Top dịch vụ</h3>
        <table><tr><th>#</th><th>Dịch vụ</th><th>Số lượt</th><th>Doanh thu</th></tr>
          ${topServices.map((s, i) => `<tr><td>${i + 1}</td><td>${s.name}</td><td>${s.count}</td><td>${new Intl.NumberFormat("vi-VN").format(s.revenue)}₫</td></tr>`).join("")}
        </table>
        <h3>Top sản phẩm</h3>
        <table><tr><th>#</th><th>Sản phẩm</th><th>Số lượng</th><th>Doanh thu</th></tr>
          ${topProducts.map((p, i) => `<tr><td>${i + 1}</td><td>${p.name}</td><td>${p.count}</td><td>${new Intl.NumberFormat("vi-VN").format(p.revenue)}₫</td></tr>`).join("")}
        </table>
        <h3>Top khách hàng</h3>
        <table><tr><th>#</th><th>Khách hàng</th><th>Số hóa đơn</th><th>Doanh thu</th></tr>
          ${topCustomers.map((c, i) => `<tr><td>${i + 1}</td><td>${c.name}</td><td>${c.count}</td><td>${new Intl.NumberFormat("vi-VN").format(c.revenue)}₫</td></tr>`).join("")}
        </table>
        <div class="footer">
          <p>🌸 Sakura Spa & Beauty - Báo cáo được tạo ngày ${new Date().toLocaleDateString("vi-VN")}</p>
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
          <h1 className="text-2xl font-bold text-white font-serif">Báo cáo doanh thu</h1>
          <p className="text-white/50 text-sm mt-1">Phân tích hiệu quả kinh doanh</p>
        </div>
        <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-gold-500 to-amber-600 text-white rounded-xl text-sm font-medium hover:opacity-90 transition shadow-lg shadow-gold-500/20">
          <Printer className="w-4 h-4" /> In báo cáo
        </button>
      </div>

      {/* Period filter */}
      <div className="flex gap-2 flex-wrap">
        {(["today", "week", "month", "year"] as const).map(p => (
          <button key={p} onClick={() => setPeriod(p)} className={`px-4 py-2 rounded-xl text-sm transition ${period === p ? "bg-sakura-500/30 text-white border border-sakura-500/30" : "bg-white/5 text-white/60 border border-white/10 hover:bg-white/10"}`}>
            {p === "today" ? "Hôm nay" : p === "week" ? "Tuần này" : p === "month" ? "Tháng này" : "Năm nay"}
          </button>
        ))}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-gold-500/20 to-gold-600/10 rounded-2xl border border-gold-500/20 p-5">
          <div className="text-white/60 text-sm mb-2">Tổng doanh thu</div>
          <div className="text-3xl font-bold text-gold-400">{formatCurrency(stats.revenue)}</div>
        </div>
        <div className="bg-sakura-card rounded-2xl border border-white/10 p-5">
          <div className="text-white/60 text-sm mb-2">Số hóa đơn</div>
          <div className="text-3xl font-bold text-white">{stats.count}</div>
        </div>
        <div className="bg-sakura-card rounded-2xl border border-white/10 p-5">
          <div className="text-white/60 text-sm mb-2">Trung bình mỗi đơn</div>
          <div className="text-3xl font-bold text-white">{formatCurrency(stats.avg)}</div>
        </div>
      </div>

      {/* Chart */}
      {chartData.length > 0 && (
        <div className="bg-sakura-card rounded-2xl border border-white/10 p-5">
          <h3 className="text-white font-semibold mb-4">Doanh thu theo ngày</h3>
          <div className="flex items-end gap-1 h-40">
            {chartData.map((d, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
                <div className="relative w-full group">
                  <div
                    className="w-full rounded-t-lg bg-gradient-to-t from-sakura-500 to-gold-400 transition-all hover:opacity-80 cursor-pointer"
                    style={{ height: `${(d.revenue / maxRev) * 100}%`, minHeight: d.revenue > 0 ? "4px" : "1px" }}
                  />
                  {d.revenue > 0 && (
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] text-gold-400 opacity-0 group-hover:opacity-100 whitespace-nowrap bg-black/60 px-1.5 py-0.5 rounded">
                      {formatCurrency(d.revenue)}
                    </div>
                  )}
                </div>
                <span className="text-[9px] text-white/40">{d.day}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Services */}
        <div className="bg-sakura-card rounded-2xl border border-white/10 p-5">
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-sakura-400" /> Dịch vụ bán chạy
          </h3>
          <div className="space-y-3">
            {topServices.map((sv, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`text-xs w-5 h-5 rounded-full flex items-center justify-center ${i === 0 ? "bg-gold-500/30 text-gold-400" : "bg-white/10 text-white/50"}`}>{i + 1}</span>
                  <span className="text-sm text-white/80">{sv.name}</span>
                </div>
                <div className="text-right">
                  <div className="text-sm text-white font-medium">{sv.count} lượt</div>
                  <div className="text-[10px] text-white/40">{formatCurrency(sv.revenue)}</div>
                </div>
              </div>
            ))}
            {topServices.length === 0 && <p className="text-sm text-white/40">Chưa có dữ liệu</p>}
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-sakura-card rounded-2xl border border-white/10 p-5">
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-gold-400" /> Sản phẩm bán chạy
          </h3>
          <div className="space-y-3">
            {topProducts.map((p, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`text-xs w-5 h-5 rounded-full flex items-center justify-center ${i === 0 ? "bg-gold-500/30 text-gold-400" : "bg-white/10 text-white/50"}`}>{i + 1}</span>
                  <span className="text-sm text-white/80">{p.name}</span>
                </div>
                <div className="text-right">
                  <div className="text-sm text-white font-medium">{p.count} cái</div>
                  <div className="text-[10px] text-white/40">{formatCurrency(p.revenue)}</div>
                </div>
              </div>
            ))}
            {topProducts.length === 0 && <p className="text-sm text-white/40">Chưa có dữ liệu</p>}
          </div>
        </div>

        {/* Top Customers */}
        <div className="bg-sakura-card rounded-2xl border border-white/10 p-5">
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-400" /> Khách hàng top doanh thu
          </h3>
          <div className="space-y-3">
            {topCustomers.map((c, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`text-xs w-5 h-5 rounded-full flex items-center justify-center ${i === 0 ? "bg-gold-500/30 text-gold-400" : "bg-white/10 text-white/50"}`}>{i + 1}</span>
                  <span className="text-sm text-white/80">{c.name}</span>
                </div>
                <div className="text-right">
                  <div className="text-sm text-white font-medium">{c.count} HD</div>
                  <div className="text-[10px] text-white/40">{formatCurrency(c.revenue)}</div>
                </div>
              </div>
            ))}
            {topCustomers.length === 0 && <p className="text-sm text-white/40">Chưa có dữ liệu</p>}
          </div>
        </div>
      </div>
    </div>
  );
}