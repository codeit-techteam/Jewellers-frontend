import type { InventoryProduct } from '@/types/inventory';

export const MOCK_TOTAL_LEADS = 18;
export const MOCK_NEW_LEADS = 5;
export const MOCK_VIEWS_GROWTH_PERCENT = '+12%';
export const MOCK_MARKETPLACE_PRODUCTS_EXTRA = 154;
export const MOCK_PLAN_RENEWAL_DATE = 'Oct 12, 2024';

export const INVENTORY_FILTER_CATEGORIES = [
  'All',
  'Rings',
  'Necklaces',
  'Earrings',
  'Bracelets',
  'Gold',
  'Diamond',
  'Silver',
] as const;

export const INVENTORY_DRAFTS_FILTER = 'Drafts' as const;

export const INVENTORY_FORM_CATEGORIES = [
  'Gold',
  'Diamond',
  'Silver',
  'Platinum',
  'Pearl',
  'Rings',
  'Necklaces',
  'Earrings',
  'Bracelets',
  'Bangles',
  'Other',
] as const;

export const PURITY_OPTIONS = [
  '14K (58.5%)',
  '18K (75%)',
  '22K (91.6%)',
  '24K (99.9%)',
  '925 Silver',
  '950 Platinum',
] as const;

export const DEFAULT_PURITY = '22K (91.6%)';

export const INITIAL_MOCK_INVENTORY_PRODUCTS: InventoryProduct[] = [
  {
    id: 'inv-001',
    name: 'Solitaire Diamond Ring',
    sku: 'ER-77241-DIA',
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
