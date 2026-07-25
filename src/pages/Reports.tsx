import { useState, useMemo, useRef, useEffect } from "react";
import { invoices, customers, services, products, siteConfig } from "../data/site";
import type { InvoiceItem } from "../data/site";
import { formatCurrency, formatDate, Badge } from "../components/Shared";
import { BarChart3, DollarSign, TrendingUp, ShoppingBag, Sparkles, Users, Printer, Wallet2, EyeOff, LayoutGrid } from "lucide-react";

// ─── Canvas Chart Component ───
function SimpleBarLineChart({ data, maxRev, type }: { data: { label: string; revenue: number }[]; maxRev: number; type: "bar" | "line" }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; label: string; value: number } | null>(null);

  const PADDING = { top: 30, right: 20, bottom: 60, left: 80 };
  const GRID_COUNT = 5;

  const drawChart = useMemo(() => {
    return (canvas: HTMLCanvasElement) => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.scale(dpr, dpr);

      const w = rect.width;
      const h = rect.height;
      const chartW = w - PADDING.left - PADDING.right;
      const chartH = h - PADDING.top - PADDING.bottom;
      const n = data.length;
      if (n === 0) return;

      // Clear
      ctx.clearRect(0, 0, w, h);

      // Grid lines
      ctx.strokeStyle = "rgba(255,255,255,0.06)";
      ctx.lineWidth = 1;
      for (let i = 0; i <= GRID_COUNT; i++) {
        const y = PADDING.top + (chartH / GRID_COUNT) * i;
        ctx.beginPath();
        ctx.moveTo(PADDING.left, y);
        ctx.lineTo(w - PADDING.right, y);
        ctx.stroke();
      }

      // Y-axis labels
      ctx.fillStyle = "rgba(255,255,255,0.5)";
      ctx.font = "11px Inter, sans-serif";
      ctx.textAlign = "right";
      ctx.textBaseline = "middle";
      for (let i = 0; i <= GRID_COUNT; i++) {
        const val = Math.round((maxRev / GRID_COUNT) * (GRID_COUNT - i));
        const y = PADDING.top + (chartH / GRID_COUNT) * i;
        ctx.fillText(formatCurrency(val), PADDING.left - 10, y);
      }

      // X-axis labels
      ctx.fillStyle = "rgba(255,255,255,0.6)";
      ctx.font = "12px Inter, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      const labelSkip = n > 31 ? 5 : n > 14 ? 2 : 1;
      data.forEach((d, i) => {
        if (i % labelSkip !== 0 && i !== n - 1) return;
        const x = PADDING.left + (chartW / Math.max(n - 1, 1)) * i;
        ctx.fillText(d.label, x, PADDING.top + chartH + 10);
      });

      // Bar width
      const barWidth = Math.min(chartW / n * 0.7, 40);

      // Gradient helper
      const createGradient = (x1: number, y1: number, x2: number, y2: number) => {
        const grad = ctx.createLinearGradient(x1, y1, x2, y2);
        grad.addColorStop(0, "rgba(212, 168, 83, 0.9)");
        grad.addColorStop(0.5, "rgba(232, 121, 132, 0.8)");
        grad.addColorStop(1, "rgba(168, 85, 180, 0.6)");
        return grad;
      };

      if (type === "bar") {
        data.forEach((d, i) => {
          const barH = maxRev > 0 ? (d.revenue / maxRev) * chartH : 0;
          const x = PADDING.left + (chartW / n) * i + (chartW / n - barWidth) / 2;
          const y = PADDING.top + chartH - barH;

          const grad = ctx.createLinearGradient(x, y, x, PADDING.top + chartH);
          grad.addColorStop(0, "rgba(212, 168, 83, 0.85)");
          grad.addColorStop(0.4, "rgba(232, 121, 132, 0.65)");
          grad.addColorStop(1, "rgba(168, 85, 180, 0.3)");

          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.roundRect(x, y, barWidth, barH, [4, 4, 0, 0]);
          ctx.fill();

          // Glow
          ctx.shadowColor = "rgba(212, 168, 83, 0.2)";
          ctx.shadowBlur = 8;
          ctx.fill();
          ctx.shadowBlur = 0;
        });
      } else {
        // Line chart
        if (n > 1) {
          ctx.beginPath();
          ctx.strokeStyle = "#d4a853";
          ctx.lineWidth = 3;
          ctx.lineJoin = "round";
          data.forEach((d, i) => {
            const x = PADDING.left + (chartW / Math.max(n - 1, 1)) * i;
            const y = maxRev > 0 ? PADDING.top + chartH - (d.revenue / maxRev) * chartH : PADDING.top + chartH;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          });
          ctx.stroke();

          // Area fill
          const lastIdx = n - 1;
          const lastX = PADDING.left + (chartW / Math.max(n - 1, 1)) * lastIdx;
          const firstX = PADDING.left;
          const bottomY = PADDING.top + chartH;
          ctx.lineTo(lastX, bottomY);
          ctx.lineTo(firstX, bottomY);
          ctx.closePath();
          const grad = ctx.createLinearGradient(0, PADDING.top, 0, PADDING.top + chartH);
          grad.addColorStop(0, "rgba(212, 168, 83, 0.25)");
          grad.addColorStop(1, "rgba(212, 168, 83, 0.02)");
          ctx.fillStyle = grad;
          ctx.fill();

          // Points
          data.forEach((d, i) => {
            const x = PADDING.left + (chartW / Math.max(n - 1, 1)) * i;
            const y = maxRev > 0 ? PADDING.top + chartH - (d.revenue / maxRev) * chartH : PADDING.top + chartH;
            ctx.beginPath();
            ctx.arc(x, y, 4, 0, Math.PI * 2);
            ctx.fillStyle = "#d4a853";
            ctx.fill();
            ctx.strokeStyle = "rgba(30, 18, 36, 0.8)";
            ctx.lineWidth = 2;
            ctx.stroke();
          });
        }
      }
    };
  }, [data, maxRev, type]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    drawChart(canvas);
  }, [drawChart]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || data.length === 0) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const n = data.length;
    const chartW = rect.width - PADDING.left - PADDING.right;
    const chartH = rect.height - PADDING.top - PADDING.bottom;

    for (let i = 0; i < n; i++) {
      const x = PADDING.left + (chartW / Math.max(n - 1, 1)) * i;
      const barH = maxRev > 0 ? (data[i].revenue / maxRev) * chartH : 0;
      const barY = PADDING.top + chartH - barH;
      const barWidth = Math.min(chartW / n * 0.7, 40);
      const barX = type === "bar" ? PADDING.left + (chartW / n) * i + (chartW / n - barWidth) / 2 : x;
      const hitW = type === "bar" ? barWidth : 30;
      const hitY = type === "bar" ? barY : PADDING.top;
      const hitH = type === "bar" ? barH : chartH;

      if (mx >= barX - 4 && mx <= barX + hitW + 4) {
        setTooltip({
          x: Math.min(barX, rect.width - 180),
          y: Math.max(barY - 40, 10),
          label: data[i].label,
          value: data[i].revenue,
        });
        return;
      }
    }
    setTooltip(null);
  };

  const handleMouseLeave = () => setTooltip(null);

  return (
    <div className="relative" style={{ width: "100%", height: 280 }}>
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      />
      {tooltip && (
        <div
          className="absolute z-50 bg-[#1e1224]/95 border border-white/20 rounded-xl px-4 py-2.5 shadow-2xl pointer-events-none"
          style={{ left: tooltip.x, top: tooltip.y }}
        >
          <div className="text-xs text-white/60 mb-0.5">{tooltip.label}</div>
          <div className="text-sm font-bold text-gold-400">{formatCurrency(tooltip.value)}</div>
        </div>
      )}
    </div>
  );
}

// ─── Sub-components ───
function RowItem({ rank, name, extra, sub }: { rank: number; name: string; extra: string; sub: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
      <div className="flex items-center gap-3 min-w-0">
        <span className="text-xs text-white/30 w-4 shrink-0">#{rank + 1}</span>
        <span className="text-white text-sm truncate">{name}</span>
      </div>
      <div className="text-right shrink-0">
        <div className="text-white/60 text-xs">{extra}</div>
        <div className="text-gold-400 text-xs font-semibold">{sub}</div>
      </div>
    </div>
  );
}

function StatBlock({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-sakura-card rounded-2xl border border-white/10 p-5">
      <div className="flex items-center gap-2 mb-4">
        {icon}
        <h3 className="text-white font-semibold text-sm">{title}</h3>
      </div>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

function SummaryBox({ color, label, value }: { color: string; label: string; value: string }) {
  const colors: Record<string, string> = { gold: "from-gold-500/20 to-gold-600/10 border-gold-500/20", rose: "from-rose-500/20 to-rose-600/10 border-rose-500/20", emerald: "from-emerald-500/20 to-emerald-600/10 border-emerald-500/20", blue: "from-blue-500/20 to-blue-600/10 border-blue-500/20" };
  return (
    <div className={`bg-gradient-to-br ${colors[color] || colors.gold} rounded-2xl border p-4`}>
      <div className="text-white/60 text-xs mb-1">{label}</div>
      <div className="text-lg font-bold text-white">{value}</div>
    </div>
  );
}

function ProfitDetailTable({ title, data, metric }: { title: string; data: { name: string; sales: number; revenue: number; cost: number; gross: number; margin: number }[]; metric: string }) {
  return (
    <div className="bg-sakura-card rounded-2xl border border-white/10 overflow-hidden">
      <div className="p-4 border-b border-white/10">
        <h3 className="text-white font-semibold text-sm">{title}</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-white/5 border-b border-white/10">
              <th className="text-left px-3 py-2 text-white/50 font-medium">Tên</th>
              <th className="text-right px-3 py-2 text-white/50 font-medium">SL</th>
              <th className="text-right px-3 py-2 text-white/50 font-medium">Doanh thu</th>
              <th className="text-right px-3 py-2 text-white/50 font-medium">Chi phí</th>
              <th className="text-right px-3 py-2 text-white/50 font-medium">Lợi nhuận</th>
              <th className="text-right px-3 py-2 text-white/50 font-medium">Biên %</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {data.map((d, i) => (
              <tr key={i} className="hover:bg-white/5">
                <td className="px-3 py-2 text-white text-xs">{d.name}</td>
                <td className="px-3 py-2 text-white/60 text-xs text-right">{d.sales}</td>
                <td className="px-3 py-2 text-gold-400 text-xs text-right">{formatCurrency(d.revenue)}</td>
                <td className="px-3 py-2 text-rose-300 text-xs text-right">{formatCurrency(d.cost)}</td>
                <td className="px-3 py-2 text-emerald-300 text-xs text-right">{formatCurrency(d.gross)}</td>
                <td className="px-3 py-2 text-white/60 text-xs text-right">{d.margin.toFixed(1)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ProductDetailTable({ allProducts, invoiceItems }: { allProducts: { id: string; name: string; code: string; category: string; sellingPrice: number; costPrice: number; stock: number }[]; invoiceItems: { id: string; name: string; quantity: number; unitPrice: number }[] }) {
  const prodMap = useMemo(() => {
    const map = new Map<string, { name: string; code: string; category: string; sellingPrice: number; costPrice: number; stock: number; qtySold: number; revenue: number }>();
    allProducts.forEach(p => map.set(p.id, { ...p, qtySold: 0, revenue: 0 }));
    invoiceItems.forEach(it => {
      const e = map.get(it.id);
      if (e) { e.qtySold += it.quantity; e.revenue += it.unitPrice * it.quantity; }
    });
    return Array.from(map.values()).filter(p => p.qtySold > 0).sort((a, b) => b.revenue - a.revenue);
  }, [allProducts, invoiceItems]);

  return (
    <div className="bg-sakura-card rounded-2xl border border-white/10 overflow-hidden">
      <div className="p-4 border-b border-white/10">
        <h3 className="text-white font-semibold text-sm">Chi tiết sản phẩm đã bán</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-white/5 border-b border-white/10">
              <th className="text-left px-3 py-2 text-white/50 font-medium">Mã SP</th>
              <th className="text-left px-3 py-2 text-white/50 font-medium">Tên</th>
              <th className="text-left px-3 py-2 text-white/50 font-medium">Nhóm</th>
              <th className="text-right px-3 py-2 text-white/50 font-medium">Đã bán</th>
              <th className="text-right px-3 py-2 text-white/50 font-medium">Doanh thu</th>
              <th className="text-right px-3 py-2 text-white/50 font-medium">Tồn kho</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {prodMap.map((p, i) => (
              <tr key={i} className="hover:bg-white/5">
                <td className="px-3 py-2 text-white/40 text-xs">{p.code}</td>
                <td className="px-3 py-2 text-white text-xs">{p.name}</td>
                <td className="px-3 py-2 text-white/60 text-xs">{p.category}</td>
                <td className="px-3 py-2 text-white text-xs text-right">{p.qtySold}</td>
                <td className="px-3 py-2 text-gold-400 text-xs text-right">{formatCurrency(p.revenue)}</td>
                <td className="px-3 py-2 text-white/60 text-xs text-right">{p.stock}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Main Reports Component ───
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
        days.push({ label: `${d.getDate()}/${d.getMonth()+1}-${dayNames[d.getDay()]}`, revenue: rev });
      }
      return days;
    }
    if (period === "month") {
      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      const days: { label: string; revenue: number }[] = [];
      for (let d = 1; d <= daysInMonth; d++) {
        const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
        const rev = filteredInvoices.filter(i => i.date.startsWith(dateStr)).reduce((s, i) => s + i.total, 0);
        days.push({ label: `Ngày ${d}`, revenue: rev });
      }
      return days;
    }
    // Year
    const months = ["Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6", "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12"];
    const result: { label: string; revenue: number }[] = [];
    for (let m = 0; m < 12; m++) {
      const monthPrefix = `${now.getFullYear()}-${String(m+1).padStart(2,"0")}`;
      const rev = filteredInvoices.filter(i => i.date.startsWith(monthPrefix)).reduce((s, i) => s + i.total, 0);
      result.push({ label: months[m], revenue: rev });
    }
    return result;
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
        const laborCost = Math.round(it.unitPrice * 0.3);
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
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <SummaryBox color="gold" label="Tổng doanh thu" value={formatCurrency(stats.revenue)} />
            <SummaryBox color="rose" label="Giá vốn hàng bán" value={formatCurrency(totalCogs + totalLaborCost)} />
            <SummaryBox color="emerald" label="Lợi nhuận gộp" value={formatCurrency(totalGrossProfit)} />
            <SummaryBox color="blue" label="Biên lợi nhuận" value={`${overallMargin.toFixed(1)}%`} />
          </div>
          <ProfitDetailTable title="Chi tiết lợi nhuận sản phẩm" data={productProfit.map(p => ({name: p.productName, sales: p.qtySold, revenue: p.revenue, cost: p.costTotal, gross: p.grossProfit, margin: p.marginPercent}))} metric="sales"/>
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