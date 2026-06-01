import type { InventorySortKey, InventoryStatusFilter } from '@constants/inventoryFilters';
import { trackEvent } from '@services/inventoryService';
import type { InventoryProduct, InventoryTrackEvent } from '@/types/inventory';
import { create } from 'zustand';

export type InventoryListPrefs = {
  sortBy: InventorySortKey;
  statusFilter: InventoryStatusFilter;
  featuredOnly: boolean;
  recentlyAddedOnly: boolean;
};

type InventoryStoreState = {
  products: InventoryProduct[];
  isLoading: boolean;
  selectedCategory: string;
  listPrefs: InventoryListPrefs;
  setProducts: (products: InventoryProduct[]) => void;
  setListPrefs: (prefs: Partial<InventoryListPrefs>) => void;
  addProduct: (product: InventoryProduct) => void;
  removeProduct: (id: string) => void;
  updateProduct: (id: string, data: Partial<InventoryProduct>) => void;
  setCategory: (category: string) => void;
  incrementView: (id: string) => void;
  incrementWishlist: (id: string) => void;
  incrementInquiry: (id: string) => void;
  incrementWaClick: (id: string) => void;
  setLoading: (loading: boolean) => void;
  clearProducts: () => void;
  reset: () => void;
};

const incrementAnalytics = (
  products: InventoryProduct[],
  id: string,
  field: keyof InventoryProduct['analytics'],
): InventoryProduct[] =>
  products.map((product) =>
    product.id === id
      ? {
          ...product,
          analytics: {
            ...product.analytics,
            [field]: product.analytics[field] + 1,
          },
        }
      : product,
  );

const fireTrack = (id: string, event: InventoryTrackEvent): void => {
  trackEvent(id, event);
};

const defaultListPrefs: InventoryListPrefs = {
  sortBy: 'recent',
  statusFilter: 'all',
  featuredOnly: false,
  recentlyAddedOnly: false,
};

export const useInventoryStore = create<InventoryStoreState>((set) => ({
  products: [],
  isLoading: false,
  selectedCategory: 'All',
  listPrefs: defaultListPrefs,

  setProducts: (products) => set({ products }),

  setListPrefs: (prefs) =>
    set((state) => ({
      listPrefs: { ...state.listPrefs, ...prefs },
    })),

  addProduct: (product) =>
    set((state) => ({
      products: [product, ...state.products],
    })),

  removeProduct: (id) =>
    set((state) => ({
      products: state.products.filter((product) => product.id !== id),
    })),

  updateProduct: (id, data) =>
    set((state) => ({
      products: state.products.map((product) =>
        product.id === id ? { ...product, ...data } : product,
      ),
    })),

  setCategory: (category) => set({ selectedCategory: category }),

  incrementView: (id) => {
    set((state) => ({
      products: incrementAnalytics(state.products, id, 'views'),
    }));
    fireTrack(id, 'view');
  },

  incrementWishlist: (id) => {
    set((state) => ({
      products: incrementAnalytics(state.products, id, 'wishlist'),
    }));
    fireTrack(id, 'wishlist');
  },

  incrementInquiry: (id) => {
    set((state) => ({
      products: incrementAnalytics(state.products, id, 'inquiry'),
    }));
    fireTrack(id, 'inquiry');
  },

  incrementWaClick: (id) => {
    set((state) => ({
      products: incrementAnalytics(state.products, id, 'waClicks'),
    }));
    fireTrack(id, 'wa_click');
  },

  setLoading: (loading) => set({ isLoading: loading }),

  clearProducts: () => set({ products: [], isLoading: false }),

  reset: () =>
    set({
      products: [],
      isLoading: false,
      selectedCategory: 'All',
      listPrefs: defaultListPrefs,
    }),
}));

export function getTotalViews(products: InventoryProduct[]): number {
  return products.reduce((sum, product) => sum + product.analytics.views, 0);
}

export function getActiveProducts(products: InventoryProduct[]): InventoryProduct[] {
  return products.filter((product) => !product.isDraft);
}
