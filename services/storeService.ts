import type { StoreStatusResponse } from '@/types/product';

import { api, ApiError } from './api';

export const USE_MOCK = true;

let statusCallCount = 0;

const delay = (ms: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

export function resetStoreStatusMockCounter(): void {
  statusCallCount = 0;
}

export async function checkStoreStatus(): Promise<StoreStatusResponse> {
  if (USE_MOCK) {
    await delay(300);
    statusCallCount += 1;
    if (statusCallCount <= 3) {
      return {
        status: 'review',
        message: 'Your store is under administrative review',
      };
    }
    return {
      status: 'approved',
      message: 'Your store has been approved',
    };
  }

  try {
    const { data } = await api.get<StoreStatusResponse>('/store/status');
    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError('Failed to check store status');
  }
}
