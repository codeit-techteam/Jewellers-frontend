export type InventorySortKey =
  | 'views_desc'
  | 'views_asc'
  | 'recent'
  | 'oldest'
  | 'name_asc';

export type InventoryStatusFilter = 'all' | 'active' | 'draft';

export const INVENTORY_SORT_OPTIONS: { key: InventorySortKey; label: string }[] = [
  { key: 'views_desc', label: 'Most Viewed' },
  { key: 'views_asc', label: 'Least Viewed' },
  { key: 'recent', label: 'Recently Added' },
  { key: 'oldest', label: 'Oldest' },
  { key: 'name_asc', label: 'Product Name (A–Z)' },
];

export const INVENTORY_STATUS_OPTIONS: { key: InventoryStatusFilter; label: string }[] = [
  { key: 'all', label: 'All Status' },
  { key: 'active', label: 'Active' },
  { key: 'draft', label: 'Draft' },
];

export const INVENTORY_RECENT_DAYS = 7;
