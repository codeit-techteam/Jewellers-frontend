import type { Product, ProductSubmitResponse } from '@/types/product';

import { api, ApiError } from './api';

export async function submitProducts(products: Product[]): Promise<ProductSubmitResponse> {
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

// saveDraft was removed — products in step5 are now saved individually via the
// real POST /products endpoint as soon as the user taps "+ Add Another Product".

