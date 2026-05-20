export type ProductAnalytics = {
  views: number;
  wishlist: number;
  inquiry: number;
  waClicks: number;
};

export type MakingChargesType = 'percentage' | 'flat';

export type InventoryProduct = {
  id: string;
  name: string;
  sku: string;
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
  createdAt: string;
  additionalDetails?: string;
};

export type AddProductForm = {
  name: string;
  category: string;
  weight: number;
  purity: string;
  makingChargesType: MakingChargesType;
  makingChargesValue: number;
  imageUri: string;
  imageUris?: string[];
  additionalDetails?: string;
};

export type InventoryTrackEvent = 'view' | 'wishlist' | 'inquiry' | 'wa_click';
