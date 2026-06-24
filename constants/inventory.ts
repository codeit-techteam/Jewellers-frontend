import type { InventoryProduct } from '@/types/inventory';

export const MOCK_TOTAL_LEADS = 18;
export const MOCK_NEW_LEADS = 5;
export const MOCK_VIEWS_GROWTH_PERCENT = '+12%';
export const MOCK_MARKETPLACE_PRODUCTS_EXTRA = 154;
export const MOCK_PLAN_RENEWAL_DATE = 'Oct 12, 2024';

export const INVENTORY_DRAFTS_FILTER = 'Drafts' as const;

export const PURITY_PRESETS = [
  '14K',
  '18K',
  '22K',
  '24K',
  '92.5 Silver',
  '950 Platinum',
] as const;

/** @deprecated Use PURITY_PRESETS — kept for legacy picker references */
export const PURITY_OPTIONS = PURITY_PRESETS.map((p) => ({
  value: p,
  label: p,
}));

export const DEFAULT_PURITY = '22K';

export const GENDER_CHIP_OPTIONS = [
  { label: 'For Her', value: 'female' },
  { label: 'For Him', value: 'male' },
  { label: 'Unisex', value: 'unisex' },
  { label: 'Kids', value: 'kids' },
] as const;

export const OCCASION_OPTIONS = [
  'Wedding',
  'Engagement',
  'Casual',
  'Festival',
  'Daily Wear',
  'Gift',
] as const;

export const STYLE_OPTIONS = [
  'Traditional',
  'Modern',
  'Fusion',
  'Antique',
  'Minimalist',
  'Bridal',
  'Temple',
  'Kundan',
  'Polki',
  'Meenakari',
  'Western',
] as const;

export const METAL_OPTIONS = [
  'Yellow Gold',
  'White Gold',
  'Rose Gold',
  'Silver',
  'Platinum',
] as const;

export const CHIP_STYLES = {
  unselected: {
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    color: '#555555',
    fontSize: 13,
    fontWeight: '500' as const,
  },
  selected: {
    backgroundColor: '#C9A84C',
    borderWidth: 1.5,
    borderColor: '#A8872E',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    color: '#0D0D0D',
    fontSize: 13,
    fontWeight: '700' as const,
  },
};

export const INITIAL_MOCK_INVENTORY_PRODUCTS: InventoryProduct[] = [
  {
    id: 'inv-001',
    name: 'Solitaire Diamond Ring',
    sku: 'ER-77241-DIA',
    categoryId: '',
    category: 'Diamond',
    price: 37950,
    weight: 5.4,
    purity: '22K Gold',
    makingChargesType: 'percentage',
    makingChargesValue: 12,
    imageUri: '',
    analytics: { views: 2450, wishlist: 328, inquiry: 42, waClicks: 18 },
    isDraft: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'inv-002',
    name: 'Temple Gold Necklace',
    sku: 'NK-2024-042',
    categoryId: '',
    category: 'Gold',
    price: 59350,
    weight: 48.2,
    purity: '22K Gold',
    makingChargesType: 'percentage',
    makingChargesValue: 15,
    imageUri: '',
    analytics: { views: 2450, wishlist: 328, inquiry: 42, waClicks: 18 },
    isDraft: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'inv-003',
    name: 'Filigree Gold Bangles',
    sku: 'BG-2024-019',
    categoryId: '',
    category: 'Gold',
    price: 25850,
    weight: 18.2,
    purity: '24K Gold',
    makingChargesType: 'percentage',
    makingChargesValue: 8,
    imageUri: '',
    analytics: { views: 2450, wishlist: 328, inquiry: 42, waClicks: 18 },
    isDraft: false,
    createdAt: new Date().toISOString(),
  },
];
