import { useState, useEffect, useMemo } from "react";
import { defaultSettings, products, services } from "../data/site";
import type { SettingsData, ProductCategory, ServiceCategory } from "../data/site";
import { generateId } from "../components/Shared";
import { Settings2, Package, Sparkles, Plus, Trash2, Image, Save, Check, Store, Palette, Type, Globe, Layout } from "lucide-react";

const STORAGE_KEY = "sakura_sp_settings_v1";

function loadSettings(): SettingsData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return defaultSettings;
}

function saveSettings(s: SettingsData) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
}

export function getSettings(): SettingsData {
  return loadSettings();
}

export function Settings() {
  const [settings, setSettings] = useState<SettingsData>(loadSettings);
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<"product" | "service" | "shop">("product");

  // Product categories
  const [newProdCat, setNewProdCat] = useState("");
  const [newProdImg, setNewProdImg] = useState("");

  // Service categories
  const [newServCat, setNewServCat] = useState("");
  const [newServImg, setNewServImg] = useState("");

  // Shop config form
  const [shopForm, setShopForm] = useState({ ...settings.shopConfig });

  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  // Sync shopForm when settings.shopConfig changes
  useEffect(() => {
    setShopForm({ ...settings.shopConfig });
  }, [settings.shopConfig]);

  const handleSave = () => {
    // Apply shop config
    setSettings(prev => ({
      ...prev,
      shopConfig: { ...shopForm },
    }));
    saveSettings(settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleAddProdCat = () => {
    if (!newProdCat.trim()) return;
    setSettings(prev => ({
      ...prev,
      productCategories: [
        ...prev.productCategories,
        { id: generateId(), name: newProdCat.trim(), image: newProdImg || "" },
      ],
    }));
    setNewProdCat("");
    setNewProdImg("");
  };

  const handleRemoveProdCat = (id: string) => {
    setSettings(prev => ({
      ...prev,
      productCategories: prev.productCategories.filter(c => c.id !== id),
    }));
  };

  const handleAddServCat = () => {
    if (!newServCat.trim()) return;
    setSettings(prev => ({
      ...prev,
      serviceCategories: [
        ...prev.serviceCategories,
        { id: generateId(), name: newServCat.trim(), image: newServImg || "" },
      ],
    }));
    setNewServCat("");
    setNewServImg("");
  };

  const handleRemoveServCat = (id: string) => {
    setSettings(prev => ({
      ...prev,
      serviceCategories: prev.serviceCategories.filter(c => c.id !== id),
    }));
  };

  const handleProdCatImage = (id: string, url: string) => {
    setSettings(prev => ({
      ...prev,
      productCategories: prev.productCategories.map(c =>
        c.id === id ? { ...c, image: url } : c
      ),
    }));
  };

  const handleServCatImage = (id: string, url: string) => {
    setSettings(prev => ({
      ...prev,
      serviceCategories: prev.serviceCategories.map(c =>
        c.id === id ? { ...c, image: url } : c
      ),
    }));
  };

  const themeColors = [
    { value: "sakura", label: "Sakura Hồng", class: "bg-pink-500" },
    { value: "gold", label: "Vàng Kim", class: "bg-amber-500" },
    { value: "emerald", label: "Ngọc Lục Bảo", class: "bg-emerald-500" },
    { value: "violet", label: "Tím Violet", class: "bg-violet-500" },
    { value: "rose", label: "Hồng Đậm", class: "bg-rose-600" },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white font-serif">Cài đặt</h1>
          <p className="text-white/50 text-sm mt-1">Quản lý thông tin cửa hàng & nhóm mặc định</p>
        </div>
        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-sakura-500 to-rose-500 text-white rounded-xl text-sm font-medium hover:opacity-90 transition shadow-lg shadow-sakura-500/20"
        >
          {saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          {saved ? "Đã lưu" : "Lưu cài đặt"}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white/5 rounded-xl p-1 border border-white/10 w-fit">
        <button
          onClick={() => setActiveTab("shop")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition ${
            activeTab === "shop" ? "bg-sakura-500/30 text-white" : "text-white/50 hover:text-white"
          }`}
        >
          <Store className="w-4 h-4" /> Cửa hàng
        </button>
        <button
          onClick={() => setActiveTab("product")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition ${
            activeTab === "product" ? "bg-sakura-500/30 text-white" : "text-white/50 hover:text-white"
          }`}
        >
          <Package className="w-4 h-4" /> Nhóm sản phẩm
        </button>
        <button
          onClick={() => setActiveTab("service")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition ${
            activeTab === "service" ? "bg-sakura-500/30 text-white" : "text-white/50 hover:text-white"
          }`}
        >
          <Sparkles className="w-4 h-4" /> Nhóm dịch vụ
        </button>
      </div>

      {/* ─── Shop Config Tab ─── */}
      {activeTab === "shop" && (
        <div className="bg-sakura-card rounded-2xl border border-white/10 p-5 space-y-5">
          <h3 className="text-white font-semibold">Cấu hình thông tin cửa hàng</h3>

          {/* Shop Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-white/50 mb-1.5 block flex items-center gap-1">
                <Store className="w-3 h-3" /> Tên cửa hàng
              </label>
              <input
                type="text"
                value={shopForm.shopName}
                onChange={e => setShopForm(prev => ({ ...prev, shopName: e.target.value }))}
                className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-sakura-400/50"
              />
            </div>
            <div>
              <label className="text-xs text-white/50 mb-1.5 block flex items-center gap-1">
                <Type className="w-3 h-3" /> Slogan
              </label>
              <input
                type="text"
                value={shopForm.slogan}
                onChange={e => setShopForm(prev => ({ ...prev, slogan: e.target.value }))}
                className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-sakura-400/50"
              />
            </div>
          </div>

          {/* Logo URL & Footer */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-white/50 mb-1.5 block flex items-center gap-1">
                <Image className="w-3 h-3" /> Logo URL
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={shopForm.logoUrl}
                  onChange={e => setShopForm(prev => ({ ...prev, logoUrl: e.target.value }))}
                  placeholder="https://..."
                  className="flex-1 px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-sakura-400/50"
                />
                {shopForm.logoUrl && (
                  <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0 bg-white/5 border border-white/10">
                    <img src={shopForm.logoUrl} alt="Logo" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                  </div>
                )}
              </div>
            </div>
            <div>
              <label className="text-xs text-white/50 mb-1.5 block flex items-center gap-1">
                <Globe className="w-3 h-3" /> Footer text
              </label>
              <input
                type="text"
                value={shopForm.footerText}
                onChange={e => setShopForm(prev => ({ ...prev, footerText: e.target.value }))}
                className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-sakura-400/50"
              />
            </div>
          </div>

          {/* Theme Color */}
          <div>
            <label className="text-xs text-white/50 mb-1.5 block flex items-center gap-1">
              <Palette className="w-3 h-3" /> Chủ đề màu sắc
            </label>
            <div className="flex gap-3 flex-wrap">
              {themeColors.map(tc => (
                <button
                  key={tc.value}
                  onClick={() => setShopForm(prev => ({ ...prev, themeColor: tc.value }))}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs transition border ${
                    shopForm.themeColor === tc.value
                      ? "border-white/40 bg-white/10 text-white"
                      : "border-white/10 text-white/60 hover:border-white/30"
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full ${tc.class}`} />
                  {tc.label}
                </button>
              ))}
            </div>
          </div>

          {/* Default Groups */}
          <div>
            <label className="text-xs text-white/50 mb-1.5 block flex items-center gap-1">
              <Layout className="w-3 h-3" /> Nhóm mặc định (phân cách bằng dấu phẩy)
            </label>
            <input
              type="text"
              value={shopForm.defaultGroups.join(", ")}
              onChange={e => setShopForm(prev => ({ ...prev, defaultGroups: e.target.value.split(",").map(s => s.trim()).filter(Boolean) }))}
              placeholder="Skincare, Massage, Chăm sóc da"
              className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-sakura-400/50"
            />
            <p className="text-[10px] text-white/30 mt-1">Những nhóm này sẽ được gợi ý khi thêm sản phẩm/dịch vụ mới</p>
          </div>

          {/* Cascade Avatar Image */}
          <div>
            <label className="text-xs text-white/50 mb-1.5 block flex items-center gap-1">
              <Image className="w-3 h-3" /> Ảnh đại diện cascade (fallback khi không có ảnh)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={shopForm.cascadeImage}
                onChange={e => setShopForm(prev => ({ ...prev, cascadeImage: e.target.value }))}
                placeholder="https://..."
                className="flex-1 px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-sakura-400/50"
              />
              {shopForm.cascadeImage && (
                <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0 bg-white/5 border border-white/10">
                  <img src={shopForm.cascadeImage} alt="Cascade" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                </div>
              )}
            </div>
            <p className="text-[10px] text-white/30 mt-1">Ảnh này sẽ được dùng làm ảnh đại diện mặc định khi cascade không có ảnh riêng</p>
          </div>
        </div>
      )}

      {/* ─── Product Categories Tab ─── */}
      {activeTab === "product" && (
        <div className="bg-sakura-card rounded-2xl border border-white/10 p-5 space-y-4">
          <h3 className="text-white font-semibold">Nhóm sản phẩm</h3>
          <p className="text-xs text-white/40">Khi thêm sản phẩm mới, nếu không có ảnh sẽ tự động dùng ảnh đại diện của nhóm</p>

          {/* Current categories */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {settings.productCategories.map(cat => (
              <div key={cat.id} className="bg-white/5 rounded-xl border border-white/10 p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-sakura-600/30 to-rose-600/20 overflow-hidden flex items-center justify-center">
                      {cat.image ? (
                        <img src={cat.image} alt={cat.name} className="w-full h-full object-cover" />
                      ) : (
                        <Image className="w-5 h-5 text-white/30" />
                      )}
                    </div>
                    <div>
                      <div className="text-white font-medium text-sm">{cat.name}</div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemoveProdCat(cat.id)}
                    className="p-1 rounded-lg bg-white/10 text-rose-400 hover:text-rose-300 hover:bg-rose-500/20 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={cat.image}
                    onChange={e => handleProdCatImage(cat.id, e.target.value)}
                    placeholder="URL ảnh đại diện..."
                    className="flex-1 px-2 py-1.5 bg-white/5 border border-white/10 rounded-lg text-white text-xs placeholder:text-white/30 focus:outline-none focus:border-sakura-400/50"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Add new */}
          <div className="bg-white/5 rounded-xl border border-dashed border-white/20 p-4">
            <div className="flex items-center gap-3 mb-3">
              <Plus className="w-4 h-4 text-gold-400" />
              <span className="text-sm text-white/60">Thêm nhóm sản phẩm mới</span>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={newProdCat}
                onChange={e => setNewProdCat(e.target.value)}
                placeholder="Tên nhóm (VD: Mỹ phẩm cao cấp)"
                className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-sakura-400/50"
                onKeyDown={e => e.key === "Enter" && handleAddProdCat()}
              />
              <input
                type="text"
                value={newProdImg}
                onChange={e => setNewProdImg(e.target.value)}
                placeholder="URL ảnh đại diện (tuỳ chọn)"
                className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-sakura-400/50"
                onKeyDown={e => e.key === "Enter" && handleAddProdCat()}
              />
              <button
                onClick={handleAddProdCat}
                className="px-4 py-2 bg-sakura-500/30 text-sakura-300 rounded-xl text-sm hover:bg-sakura-500/40 transition whitespace-nowrap"
              >
                Thêm
              </button>
            </div>
          </div>

          {/* Preview of auto-image behavior */}
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3">
            <p className="text-xs text-amber-300/80">
              💡 Khi tạo sản phẩm mới thuộc nhóm <strong>{settings.productCategories[0]?.name || "Skincare"}</strong>, nếu không nhập ảnh sản phẩm, hệ thống sẽ tự động lấy ảnh đại diện của nhóm.
            </p>
          </div>
        </div>
      )}

      {/* ─── Service Categories Tab ─── */}
      {activeTab === "service" && (
        <div className="bg-sakura-card rounded-2xl border border-white/10 p-5 space-y-4">
          <h3 className="text-white font-semibold">Nhóm dịch vụ</h3>
          <p className="text-xs text-white/40">Khi thêm dịch vụ mới, nếu không có ảnh sẽ tự động dùng ảnh đại diện của nhóm</p>

          {/* Current categories */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {settings.serviceCategories.map(cat => (
              <div key={cat.id} className="bg-white/5 rounded-xl border border-white/10 p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-sakura-600/30 to-rose-600/20 overflow-hidden flex items-center justify-center">
                      {cat.image ? (
                        <img src={cat.image} alt={cat.name} className="w-full h-full object-cover" />
                      ) : (
                        <Image className="w-5 h-5 text-white/30" />
                      )}
                    </div>
                    <div>
                      <div className="text-white font-medium text-sm">{cat.name}</div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemoveServCat(cat.id)}
                    className="p-1 rounded-lg bg-white/10 text-rose-400 hover:text-rose-300 hover:bg-rose-500/20 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={cat.image}
                    onChange={e => handleServCatImage(cat.id, e.target.value)}
                    placeholder="URL ảnh đại diện..."
                    className="flex-1 px-2 py-1.5 bg-white/5 border border-white/10 rounded-lg text-white text-xs placeholder:text-white/30 focus:outline-none focus:border-sakura-400/50"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Add new */}
          <div className="bg-white/5 rounded-xl border border-dashed border-white/20 p-4">
            <div className="flex items-center gap-3 mb-3">
              <Plus className="w-4 h-4 text-gold-400" />
              <span className="text-sm text-white/60">Thêm nhóm dịch vụ mới</span>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={newServCat}
                onChange={e => setNewServCat(e.target.value)}
                placeholder="Tên nhóm (VD: Xông hơi)"
                className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-sakura-400/50"
                onKeyDown={e => e.key === "Enter" && handleAddServCat()}
              />
              <input
                type="text"
                value={newServImg}
                onChange={e => setNewServImg(e.target.value)}
                placeholder="URL ảnh đại diện (tuỳ chọn)"
                className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-sakura-400/50"
                onKeyDown={e => e.key === "Enter" && handleAddServCat()}
              />
              <button
                onClick={handleAddServCat}
                className="px-4 py-2 bg-sakura-500/30 text-sakura-300 rounded-xl text-sm hover:bg-sakura-500/40 transition whitespace-nowrap"
              >
                Thêm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}