import type { AddProductForm, InventoryProduct, InventoryTrackEvent } from '@/types/inventory';

import { api, ApiError } from './api';

export const USE_MOCK = true;

const delay = (ms: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

export async function addProduct(data: AddProductForm): Promise<InventoryProduct> {
  if (USE_MOCK) {
    await delay(800);
    const categoryPrefix = data.category.slice(0, 2).toUpperCase();
    return {
      id: `inv-${Date.now()}`,
      name: data.name,
      sku: `${categoryPrefix}-${Date.now()}`,
      category: data.category,
      price: 0,
      weight: data.weight,
      purity: data.purity,
      makingChargesType: data.makingChargesType,
      makingChargesValue: data.makingChargesValue,
      imageUri: data.imageUri,
      imageUris: data.imageUris,
      analytics: { views: 0, wishlist: 0, inquiry: 0, waClicks: 0 },
      isDraft: false,
      createdAt: new Date().toISOString(),
      additionalDetails: data.additionalDetails,
    };
  }

  try {
    const { data: response } = await api.post<InventoryProduct>('/inventory/add', data);
    return response;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError('Failed to add product');
  }
}

export async function saveDraftProduct(data: AddProductForm): Promise<InventoryProduct> {
  if (USE_MOCK) {
    await delay(500);
    const categoryPrefix = data.category.slice(0, 2).toUpperCase() || 'DR';
    return {
      id: `draft-${Date.now()}`,
      name: data.name,
      sku: `${categoryPrefix}-${Date.now()}`,
      category: data.category || 'Other',
      price: 0,
      weight: data.weight,
      purity: data.purity,
      makingChargesType: data.makingChargesType,
      makingChargesValue: data.makingChargesValue,
      imageUri: data.imageUri,
      imageUris: data.imageUris,
      analytics: { views: 0, wishlist: 0, inquiry: 0, waClicks: 0 },
      isDraft: true,
      createdAt: new Date().toISOString(),
      additionalDetails: data.additionalDetails,
    };
  }

  try {
    const { data: response } = await api.post<InventoryProduct>('/inventory/draft', data);
    return response;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError('Failed to save draft');
  }
}

export async function updateProductApi(
  id: string,
  data: Partial<InventoryProduct>,
): Promise<InventoryProduct> {
  if (USE_MOCK) {
    await delay(600);
    return { id, ...data } as InventoryProduct;
  }

  try {
    const { data: response } = await api.put<InventoryProduct>(`/inventory/${id}`, data);
    return response;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError('Failed to update product');
  }
}

export async function removeProductApi(id: string): Promise<void> {
  if (USE_MOCK) {
    await delay(500);
    return;
  }

  try {
    await api.delete(`/inventory/${id}`);
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError('Failed to remove product');
  }
}

export async function trackEvent(productId: string, event: InventoryTrackEvent): Promise<void> {
  if (USE_MOCK) {
    return;
  }

  try {
    await api.post('/inventory/track', { productId, event });
  } catch {
    // Fire and forget
  }
}
