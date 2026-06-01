export type ProductAnalytics = {
  views: number;
  wishlist: number;
  inquiry: number;
  waClicks: number;
};

export type MakingChargesType = 'percentage' | 'flat';

export type PriceBreakup = {
  gold: number;
  gemstone: number;
  makingCharge: number;
  gst: number;
  total: number;
};

export type ProductSpecifications = {
  metal?: string;
  weight?: string;
  carat?: string;
  dimensions?: string;
  certification?: string;
};

export type InventoryProduct = {
  id: string;
  name: string;
  sku: string;
  categoryId: string;
  /** Display name from categories table */
  category: string;
  price: number;
  weight: number;
  purity: string;
  makingChargesType: MakingChargesType;
  makingChargesValue: number;
  imageUri: string;
  imageUris?: string[];
  analytics: ProductAnalytics;
  isDraft: boolean;
  /** active | draft | other lifecycle from API */
  status?: string;
  isTrending?: boolean;
  createdAt: string;
  /** Legacy alias — same as description */
  additionalDetails?: string;
  // ── enrichment fields ───────────────────────────────────────────────────
  description?: string;
  gender?: string;
  occasion?: string;
  style?: string;
  availableSizes?: string[];
  availableMetals?: string[];
  discountPercent?: number;
  priceBreakup?: PriceBreakup;
  specifications?: ProductSpecifications;
  collectionName?: string;
  videoUri?: string;
  videoUrl?: string;
};

export type AddProductForm = {
  name: string;
  categoryId: string;
  weight: number;
  purity: string;
  makingChargesType: MakingChargesType;
  makingChargesValue: number;
  imageUri: string;
  imageUris?: string[];
  /** Legacy alias — same as description */
  additionalDetails?: string;
  // ── enrichment fields ───────────────────────────────────────────────────
  description?: string;
  gender?: string;
  occasion?: string;
  style?: string;
  availableSizes?: string[];
  availableMetals?: string[];
  discountPercent?: number;
  priceBreakup?: PriceBreakup;
  specifications?: ProductSpecifications;
  collectionName?: string;
  videoUrl?: string;
  videoUri?: string;
};

export type InventoryTrackEvent = 'view' | 'wishlist' | 'inquiry' | 'wa_click';
