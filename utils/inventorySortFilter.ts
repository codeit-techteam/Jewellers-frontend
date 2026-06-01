import { INVENTORY_RECENT_DAYS } from '@constants/inventoryFilters';
import type { InventorySortKey, InventoryStatusFilter } from '@constants/inventoryFilters';
import type { InventoryProduct } from '@/types/inventory';
import dayjs from 'dayjs';

export type InventoryListFilters = {
  sortBy: InventorySortKey;
  statusFilter: InventoryStatusFilter;
  featuredOnly: boolean;
  recentlyAddedOnly: boolean;
  categoryId: string;
  searchQuery: string;
};

export function applyInventoryListFilters(
  products: InventoryProduct[],
  filters: InventoryListFilters,
  matchesCategory: (product: InventoryProduct, categoryId: string) => boolean,
): InventoryProduct[] {
  let list = [...products];

  if (filters.statusFilter === 'active') {
    list = list.filter((p) => !p.isDraft && p.status !== 'draft');
  } else if (filters.statusFilter === 'draft') {
    list = list.filter((p) => p.isDraft || p.status === 'draft');
  }

  if (filters.featuredOnly) {
    list = list.filter((p) => p.isTrending === true);
  }

  if (filters.recentlyAddedOnly) {
    const cutoff = dayjs().subtract(INVENTORY_RECENT_DAYS, 'day');
    list = list.filter((p) => dayjs(p.createdAt).isAfter(cutoff));
  }

  if (filters.categoryId !== 'All') {
    list = list.filter((p) => matchesCategory(p, filters.categoryId));
  }

  const q = filters.searchQuery.trim().toLowerCase();
  if (q) {
    list = list.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q),
    );
  }

  switch (filters.sortBy) {
    case 'views_desc':
      list.sort((a, b) => b.analytics.views - a.analytics.views);
      break;
    case 'views_asc':
      list.sort((a, b) => a.analytics.views - b.analytics.views);
      break;
    case 'oldest':
      list.sort((a, b) => dayjs(a.createdAt).valueOf() - dayjs(b.createdAt).valueOf());
      break;
    case 'name_asc':
      list.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
      break;
    case 'recent':
    default:
      list.sort((a, b) => dayjs(b.createdAt).valueOf() - dayjs(a.createdAt).valueOf());
      break;
  }

  return list;
}
