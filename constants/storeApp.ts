
export const MOCK_PERFORMANCE_VIEWS = 200;
export const MOCK_PERFORMANCE_LEADS = 18;
export const STORE_MANAGING_SINCE = '2023';
export const STORE_PREMIUM_TIER_LABEL = 'PREMIUM TIER';

export const STOREFRONT_CATEGORIES = [
  'All Collections',
  'Rings',
  'Necklaces',
  'Bracelets',
  'Earrings',
  'Gold',
  'Diamond',
  'Silver',
] as const;

export type StorefrontCategoryTab = (typeof STOREFRONT_CATEGORIES)[number];

export const STOREFRONT_ABOUT_BODY =
  'Legacy of fine craftsmanship since 1985. We specialize in bespoke diamond jewelry and ethically sourced gemstones. Every piece is certified for authenticity.';

export const STOREFRONT_ESTABLISHED_LABEL = 'Est. 1985';
export const STOREFRONT_RATING_LABEL = '4.9 (2.1k reviews)';

export const STOREFRONT_VISIT_ADDRESS = 'Bond Street, London';
export const STOREFRONT_VISIT_HOURS = 'Mon-Sat: 10:00 AM - 08:00 PM';

export type MockStorefrontFiller = {
  name: string;
  category: string;
  price: number;
  imageUri: string;
};

export const MOCK_STOREFRONT_FILLER_PRODUCTS: readonly MockStorefrontFiller[] = [
  { name: 'Solitaire Diamond Ring', category: 'Diamond', price: 4250, imageUri: '' },
  { name: 'Vintage Pearl String', category: 'Pearl', price: 4800, imageUri: '' },
  { name: '24K Gold Bangle', category: 'Gold', price: 2950, imageUri: '' },
  { name: 'Royal Sapphire Studs', category: 'Other', price: 1200, imageUri: '' },
];

export const STOREFRONT_TRUST_BADGES = [
  { id: 'certified', label: 'CERTIFIED', value: 'GIA Diamonds', icon: 'ribbon-outline' as const },
  { id: 'return', label: 'RETURN', value: '30 Day Policy', icon: 'refresh-outline' as const },
  { id: 'warranty', label: 'WARRANTY', value: 'Life-time', icon: 'shield-outline' as const },
  { id: 'shipping', label: 'SHIPPING', value: 'Insured Global', icon: 'car-outline' as const },
];

export const MANAGE_STORE_ACTIONS = [
  {
    id: 'edit-info',
    label: 'Edit Store Info',
    icon: 'create-outline' as const,
    route: '/(app)/business-profile' as const,
    comingSoon: false,
  },
  {
    id: 'add-products',
    label: 'Add Products',
    icon: 'add-circle-outline' as const,
    route: '/(app)/inventory/add' as const,
    comingSoon: false,
  },
  {
    id: 'view-leads',
    label: 'View Leads',
    icon: 'people-outline' as const,
    route: '/(app)/leads' as const,
    comingSoon: false,
  },
  {
    id: 'analytics',
    label: 'Store Analytics',
    icon: 'bar-chart-outline' as const,
    route: '/(app)/sales-report' as const,
    comingSoon: false,
  },
] as const;
