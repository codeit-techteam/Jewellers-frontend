import type { DraftSaveResponse, Product, ProductSubmitResponse } from '@/types/product';

import { api, ApiError } from './api';

export const USE_MOCK = true;

const delay = (ms: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

export async function submitProducts(products: Product[]): Promise<ProductSubmitResponse> {
  if (USE_MOCK) {
    await delay(1000);
    return { success: true, message: 'Products submitted for review' };
  }

  try {
    const { data } = await api.post<ProductSubmitResponse>('/products/submit', { products });
    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError('Failed to submit products');
  }
}

export async function saveDraft(products: Product[]): Promise<DraftSaveResponse> {
  if (USE_MOCK) {
    await delay(500);
    return { success: true };
  }

  try {
    const { data } = await api.post<DraftSaveResponse>('/products/draft', { products });
    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError('Failed to save draft');
  }
}
