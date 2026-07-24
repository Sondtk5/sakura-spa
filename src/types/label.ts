/** Label configuration types for Sakura Spa label printing */

export interface LabelConfig {
  widthMm: number;
  heightMm: number;
  preset: 'custom' | '35x22' | '50x30' | '60x40' | 'Avery-5160';
  showShopName: boolean;
  showProductName: boolean;
  showProductCode: boolean;
  showBarcodeValue: boolean;
  showPrice: boolean;
  showDiscountBadge: boolean;
  fontSizeSmall: number;
  fontSizeMedium: number;
  barcodeHeightPx: number;
}

export const DEFAULT_LABEL_CONFIG: LabelConfig = {
  widthMm: 35,
  heightMm: 22,
  preset: '35x22',
  showShopName: true,
  showProductName: true,
  showProductCode: true,
  showBarcodeValue: true,
  showPrice: true,
  showDiscountBadge: false,
  fontSizeSmall: 8,
  fontSizeMedium: 11,
  barcodeHeightPx: 30,
};

const STORAGE_KEY = "sakura_spa_label_config_v1";

export function loadLabelConfig(): LabelConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return DEFAULT_LABEL_CONFIG;
}

export function saveLabelConfig(cfg: LabelConfig): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg));
}
