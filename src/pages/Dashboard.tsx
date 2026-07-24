import { useState, useMemo } from "react";
import { customers, invoices, services, products, inventoryTransactions, siteConfig } from "../data/site";
import { StatCard, Badge, formatCurrency, formatDate } from "../components/Shared";
import { DollarSign, Users, Receipt, Package, TrendingUp, ShoppingBag, Sparkles, ArrowUpRight } from "lucide-react";

export function Dashboard({ onNavigate }: { onNavigate: (p: string) => void }) {
  const stats = useMemo(() => {
    const totalRevenue = invoices.filter(i => i.status === "completed").reduce((s, i) => s + i.total, 0);
    const totalInvoices = invoices.length;
    const totalCustomers = customers.length;
    const totalProducts = products.filter(p => p.active).length;
    return { totalRevenue, totalInvoices, totalCustomers, totalProducts };
  }, []);

  // Top services
  const topServices = useMemo(() => {
    const map = new Map<string, { name: string; count: number; revenue: number }>();
    invoices.filter(i => i.status === "completed").forEach(inv => {
      inv.items.filter(it => it.type === "service").forEach(it => {
        const existing = map.get(it.id) || { name: it.name, count: 0, revenue: 0 };
        existing.count += it.quantity;
        existing.revenue += it.unitPrice * it.quantity;
        map.set(it.id, existing);
      });
    });
    return Array.from(map.values()).sort((a, b) => b.revenue - a.revenue).slice(0, 5);
  }, []);

  // Top products
  const topProducts = useMemo(() => {
    const map = new Map<string, { name: string; count: number; revenue: number }>();
    invoices.filter(i => i.status === "completed").forEach(inv => {
      inv.items.filter(it => it.type === "product").forEach(it => {
        const existing = map.get(it.id) || { name: it.name, count: 0, revenue: 0 };
        existing.count += it.quantity;
        existing.revenue += it.unitPrice * it.quantity;
        map.set(it.id, existing);
      });
    });
    return Array.from(map.values()).sort((a, b) => b.revenue - a.revenue).slice(0, 5);
  }, []);

  // Recent invoices
  const recentInvoices = useMemo(() => {
    return [...invoices].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);
  }, []);

  // Low stock alerts
  const lowStock = useMemo(() => products.filter(p => p.active && p.stock <= p.minStock), []);

  // Revenue chart data (last 7 days)
  const chartData = useMemo(() => {
    const days: { date: string; revenue: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      const rev = invoices.filter(inv => inv.status === "completed" && inv.date.startsWith(dateStr))
        .reduce((s, inv) => s + inv.total, 0);
      days.push({ date: dateStr, revenue: rev });
    }
    return days;
  }, []);

  const maxRev = Math.max(...chartData.map(d => d.revenue), 1);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white font-serif">Tổng quan</h1>
          <p className="text-white/50 text-sm mt-1">Chào mừng đến với {siteConfig.name}</p>
        </div>
        <div className="text-right">
          <div className="text-xs text-white/40">Hôm nay</div>
          <div className="text-sm text-white/60">{new Date().toLocaleDateString("vi-VN")}</div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Doanh thu" value={formatCurrency(stats.totalRevenue)} icon={<DollarSign />} color="gold" />
        <StatCard label="Hóa đơn" value={stats.totalInvoices.toString()} icon={<Receipt />} color="sakura" />
        <StatCard label="Khách hàng" value={stats.totalCustomers.toString()} icon={<Users />} color="blue" />
        <StatCard label="Sản phẩm" value={stats.totalProducts.toString()} icon={<Package />} color="emerald" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 bg-sakura-card rounded-2xl border border-white/10 p-5">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-white font-semibold">Doanh thu 7 ngày</h3>
            <button onClick={() => onNavigate("/reports")} className="text-xs text-gold-400 hover:text-gold-300 flex items-center gap-1">
              Xem chi tiết <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>
          <div className="flex items-end gap-2 h-32">
            {chartData.map((d, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className="w-full rounded-t-lg bg-gradient-to-t from-sakura-500 to-gold-400 transition-all hover:opacity-80"
                  style={{ height: `${(d.revenue / maxRev) * 100}%`, minHeight: d.revenue > 0 ? "8px" : "2px" }}
                />
                <span className="text-[10px] text-white/40">{new Date(d.date).toLocaleDateString("vi-VN", { weekday: "short" })}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Services */}
        <div className="bg-sakura-card rounded-2xl border border-white/10 p-5">
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-sakura-400" /> Dịch vụ bán chạy
          </h3>
          <div className="space-y-3">
            {topServices.map((sv, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-white/30 w-4">{i + 1}</span>
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
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Invoices */}
        <div className="bg-sakura-card rounded-2xl border border-white/10 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-semibold">Hóa đơn gần đây</h3>
            <button onClick={() => onNavigate("/invoices")} className="text-xs text-gold-400 hover:text-gold-300 flex items-center gap-1">
              Tất cả <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>
          <div className="space-y-2">
            {recentInvoices.map(inv => (
              <div key={inv.id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                <div>
                  <div className="text-sm text-white font-medium">{inv.invoiceNo}</div>
                  <div className="text-xs text-white/50">{inv.customerName}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-white">{formatCurrency(inv.total)}</div>
                  <Badge variant={inv.status === "completed" ? "success" : inv.status === "pending" ? "warning" : "danger"}>
                    {inv.status === "completed" ? "Đã thanh toán" : inv.status === "pending" ? "Chờ" : "Hủy"}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Low Stock Alerts + Top Products */}
        <div className="space-y-4">
          {/* Low Stock */}
          {lowStock.length > 0 && (
            <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-5">
              <h3 className="text-rose-300 font-semibold mb-3 flex items-center gap-2">
                <Package className="w-4 h-4" /> Sản phẩm sắp hết hàng
              </h3>
              <div className="space-y-2">
                {lowStock.map(p => (
                  <div key={p.id} className="flex items-center justify-between text-sm">
                    <span className="text-white/80">{p.name}</span>
                    <span className="text-rose-300 font-medium">Còn {p.stock} / {p.minStock}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Top Products */}
          <div className="bg-sakura-card rounded-2xl border border-white/10 p-5">
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-gold-400" /> Sản phẩm bán chạy
            </h3>
            <div className="space-y-3">
              {topProducts.map((p, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-white/30 w-4">{i + 1}</span>
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
        </div>
      </div>

      {/* Top Customers */}
      <div className="bg-sakura-card rounded-2xl border border-white/10 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-semibold flex items-center gap-2">
            <Users className="w-4 h-4 text-gold-400" /> Khách hàng thân thiết
          </h3>
          <button onClick={() => onNavigate("/customers")} className="text-xs text-gold-400 hover:text-gold-300 flex items-center gap-1">
            Xem tất cả <ArrowUpRight className="w-3 h-3" />
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[...customers].sort((a, b) => b.totalSpent - a.totalSpent).slice(0, 6).map(c => (
            <div key={c.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition cursor-pointer" onClick={() => onNavigate(`/customer/${c.id}`)}>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sakura-400 to-rose-400 flex items-center justify-center text-white font-semibold text-sm">
                {c.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm text-white font-medium truncate">{c.name}</div>
                <div className="text-xs text-white/50">{c.visitCount} lượt · {formatCurrency(c.totalSpent)}</div>
              </div>
              <div className="text-xs text-gold-400">{c.totalSpent >= 5000000 ? "VIP" : ""}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}