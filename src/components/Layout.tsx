import { useState } from "react";
import { siteConfig } from "../data/site";
import { LayoutDashboard, Users, Sparkles, Package, FileText, Warehouse, BarChart3, Menu, X, Printer, Settings2 } from "lucide-react";

const iconMap: Record<string, React.ReactNode> = {
  LayoutDashboard: <LayoutDashboard className="w-4 h-4" />,
  Users: <Users className="w-4 h-4" />,
  Sparkles: <Sparkles className="w-4 h-4" />,
  Package: <Package className="w-4 h-4" />,
  FileText: <FileText className="w-4 h-4" />,
  Warehouse: <Warehouse className="w-4 h-4" />,
  BarChart3: <BarChart3 className="w-4 h-4" />,
  Printer: <Printer className="w-4 h-4" />,
  Settings2: <Settings2 className="w-4 h-4" />,
};

interface LayoutProps {
  children: React.ReactNode;
  currentPage: string;
  onNavigate: (page: string) => void;
}

export function Layout({ children, currentPage, onNavigate }: LayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-sakura-gradient">
      {/* Top Navigation */}
      <header className="sticky top-0 z-50 bg-sakura-gradient/95 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <button onClick={() => onNavigate("/")} className="flex items-center gap-2 group">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-sakura-400 to-gold-400 flex items-center justify-center text-xs font-bold text-white shadow-lg shadow-sakura-500/30">
                S
              </div>
              <div className="hidden sm:block">
                <div className="text-sm font-semibold text-white font-serif tracking-wide">{siteConfig.shortName}</div>
                <div className="text-[10px] text-gold-400/80 -mt-0.5">Spa & Beauty</div>
              </div>
            </button>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-1">
              {siteConfig.nav.map((item) => {
                const isActive = currentPage === item.href;
                return (
                  <button
                    key={item.href}
                    onClick={() => onNavigate(item.href)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm transition-all duration-200 ${
                      isActive
                        ? "bg-white/15 text-white font-medium shadow-sm"
                        : "text-white/60 hover:text-white hover:bg-white/10"
                    }`}
                  >
                    {iconMap[item.icon]}
                    {item.label}
                  </button>
                );
              })}
            </nav>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden text-white/80 p-2 hover:bg-white/10 rounded-lg"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Nav */}
        {mobileOpen && (
          <div className="md:hidden border-t border-white/10 bg-sakura-gradient/98 backdrop-blur-md">
            <div className="px-4 py-3 space-y-1">
              {siteConfig.nav.map((item) => {
                const isActive = currentPage === item.href;
                return (
                  <button
                    key={item.href}
                    onClick={() => { onNavigate(item.href); setMobileOpen(false); }}
                    className={`flex items-center gap-2 w-full px-3 py-2.5 rounded-lg text-sm transition-all ${
                      isActive
                        ? "bg-white/15 text-white font-medium"
                        : "text-white/60 hover:text-white hover:bg-white/10"
                    }`}
                  >
                    {iconMap[item.icon]}
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-white/5 mt-12">
        <div className="max-w-7xl mx-auto px-4 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-white/40">
          <div className="flex items-center gap-2">
            <span>© 2024 {siteConfig.name}</span>
            <span className="hidden sm:inline">·</span>
            <span className="hidden sm:inline">{siteConfig.address}</span>
          </div>
          <div className="flex items-center gap-4">
            <span>{siteConfig.phone}</span>
            <span className="hidden sm:inline">·</span>
            <span className="hidden sm:inline">{siteConfig.email}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}