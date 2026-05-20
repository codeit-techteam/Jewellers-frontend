import { INITIAL_MOCK_INVENTORY_PRODUCTS } from '@constants/inventory';
import { trackEvent } from '@services/inventoryService';
import type { InventoryProduct, InventoryTrackEvent } from '@/types/inventory';
import { create } from 'zustand';

type InventoryStoreState = {
  products: InventoryProduct[];
  isLoading: boolean;
  selectedCategory: string;
  addProduct: (product: InventoryProduct) => void;
  removeProduct: (id: string) => void;
  updateProduct: (id: string, data: Partial<InventoryProduct>) => void;
  setCategory: (category: string) => void;
  incrementView: (id: string) => void;
  incrementWishlist: (id: string) => void;
  incrementInquiry: (id: string) => void;
  incrementWaClick: (id: string) => void;
  setLoading: (loading: boolean) => void;
  resetToInitial: () => void;
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

const trackAnalyticsEvent = (id: string, event: InventoryTrackEvent): void => {
  void trackEvent(id, event);
};

export const useInventoryStore = create<InventoryStoreState>((set) => ({
  products: INITIAL_MOCK_INVENTORY_PRODUCTS,
  isLoading: false,
  selectedCategory: 'All',

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
    trackAnalyticsEvent(id, 'view');
  },

  incrementWishlist: (id) => {
    set((state) => ({
      products: incrementAnalytics(state.products, id, 'wishlist'),
    }));
    trackAnalyticsEvent(id, 'wishlist');
  },

  incrementInquiry: (id) => {
    set((state) => ({
      products: incrementAnalytics(state.products, id, 'inquiry'),
    }));
    trackAnalyticsEvent(id, 'inquiry');
  },

  incrementWaClick: (id) => {
    set((state) => ({
      products: incrementAnalytics(state.products, id, 'waClicks'),
    }));
    trackAnalyticsEvent(id, 'wa_click');
  },

  setLoading: (loading) => set({ isLoading: loading }),

  resetToInitial: () =>
    set({
      products: INITIAL_MOCK_INVENTORY_PRODUCTS,
      isLoading: false,
      selectedCategory: 'All',
    }),
}));

export function getTotalViews(products: InventoryProduct[]): number {
  return products.reduce((sum, product) => sum + product.analytics.views, 0);
}

export function getActiveProducts(products: InventoryProduct[]): InventoryProduct[] {
  return products.filter((product) => !product.isDraft);
}
