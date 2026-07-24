import { X, Search } from "lucide-react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
}

export function Modal({ open, onClose, title, children, size = "md" }: ModalProps) {
  if (!open) return null;

  const sizeMap = {
    sm: "max-w-md",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop" onClick={onClose}>
      <div
        className={`bg-gradient-to-br from-[#2d1b2e] to-[#3d1f2e] border border-white/10 rounded-2xl shadow-2xl w-full ${sizeMap[size]} max-h-[90vh] overflow-y-auto animate-fade-in`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <h3 className="text-lg font-semibold text-white font-serif">{title}</h3>
          <button onClick={onClose} className="text-white/50 hover:text-white p-1 rounded-lg hover:bg-white/10 transition">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5">
          {children}
        </div>
      </div>
    </div>
  );
}

export function SearchInput({ value, onChange, placeholder = "Tìm kiếm..." }: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-sakura-400/50 focus:ring-1 focus:ring-sakura-400/30 transition"
      />
    </div>
  );
}

export function Badge({ children, variant = "default" }: { children: React.ReactNode; variant?: "default" | "success" | "warning" | "danger" | "info" | "gold" }) {
  const variants = {
    default: "bg-white/10 text-white/80",
    success: "bg-emerald-500/20 text-emerald-300",
    warning: "bg-amber-500/20 text-amber-300",
    danger: "bg-rose-500/20 text-rose-300",
    info: "bg-blue-500/20 text-blue-300",
    gold: "bg-gold-500/20 text-gold-400",
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[variant]}`}>
      {children}
    </span>
  );
}

export function StatCard({ label, value, icon, color = "sakura" }: {
  label: string;
  value: string;
  icon: React.ReactNode;
  color?: "sakura" | "gold" | "emerald" | "blue" | "rose";
}) {
  const colors = {
    sakura: "from-sakura-500/20 to-sakura-600/10 border-sakura-500/20",
    gold: "from-gold-500/20 to-gold-600/10 border-gold-500/20",
    emerald: "from-emerald-500/20 to-emerald-600/10 border-emerald-500/20",
    blue: "from-blue-500/20 to-blue-600/10 border-blue-500/20",
    rose: "from-rose-500/20 to-rose-600/10 border-rose-500/20",
  };
  return (
    <div className={`bg-gradient-to-br ${colors[color]} rounded-2xl border p-5 backdrop-blur-sm`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-white/60 text-sm">{label}</span>
        <div className="text-white/60 [&_svg]:w-4 [&_svg]:h-4">{icon}</div>
      </div>
      <div className="text-2xl font-bold text-white">{value}</div>
    </div>
  );
}

export function EmptyState({ message, icon }: { message: string; icon?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-white/40">
      {icon && <div className="mb-4 opacity-50">{icon}</div>}
      <p className="text-sm">{message}</p>
    </div>
  );
}

export function Table({ headers, children }: { headers: string[]; children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-white/10">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-white/5 border-b border-white/10">
            {headers.map((h, i) => (
              <th key={i} className="text-left px-4 py-3 text-white/50 font-medium">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {children}
        </tbody>
      </table>
    </div>
  );
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

export function formatCurrency(n: number): string {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n);
}

export function formatDate(d: string): string {
  return new Date(d).toLocaleDateString("vi-VN");
}

export function formatDateTime(d: string): string {
  return new Date(d).toLocaleString("vi-VN");
}