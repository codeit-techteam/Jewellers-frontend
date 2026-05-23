import type { AnalyticsOverview, AnalyticsRange, ProductAnalyticsRow, StoreAnalytics } from '@/types/analytics';

import { api, ApiError } from './api';

type BackendOverview = {
  views: number;
  wishlist: number;
  inquiry: number;
  wa_clicks?: number;
  waClicks?: number;
  appointments: number;
  range: AnalyticsRange;
  startDate: string;
  endDate: string;
};

function mapOverview(data: BackendOverview): AnalyticsOverview {
  return {
    views: data.views ?? 0,
    wishlist: data.wishlist ?? 0,
    inquiry: data.inquiry ?? 0,
    waClicks: data.waClicks ?? data.wa_clicks ?? 0,
    appointments: data.appointments ?? 0,
    range: data.range,
    startDate: data.startDate,
    endDate: data.endDate,
  };
}

export async function getOverview(range: AnalyticsRange = 'today'): Promise<AnalyticsOverview> {
  try {
    const { data } = await api.get<BackendOverview>('/analytics/overview', {
      params: { range },
    });
    return mapOverview(data);
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError('Failed to load analytics overview');
  }
}

export async function getProductAnalytics(): Promise<ProductAnalyticsRow[]> {
  try {
    const { data } = await api.get<ProductAnalyticsRow[]>('/analytics/products');
    return Array.isArray(data) ? data : [];
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError('Failed to load product analytics');
  }
}

export async function getStoreAnalytics(): Promise<StoreAnalytics> {
  try {
    const { data } = await api.get<StoreAnalytics>('/analytics/store');
    return data;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError('Failed to load store analytics');
  }
}
