import { MOCK_PERFORMANCE_LEADS, MOCK_PERFORMANCE_VIEWS } from '@/constants/storeApp';

import { api, ApiError } from './api';

export const USE_MOCK = true;

export type StorePerformanceSnapshot = {
  views: number;
  leads: number;
};

const delay = (ms: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

export async function getPerformanceSnapshot(): Promise<StorePerformanceSnapshot> {
  if (USE_MOCK) {
    await delay(200);
    return { views: MOCK_PERFORMANCE_VIEWS, leads: MOCK_PERFORMANCE_LEADS };
  }

  try {
    const { data } = await api.get<StorePerformanceSnapshot>('/store/performance');
    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError('Failed to load performance snapshot');
  }
}
