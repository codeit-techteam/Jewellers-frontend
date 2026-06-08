import type { AnalyticsOverview, AnalyticsRange, ProductAnalyticsRow, StoreAnalytics } from '@/types/analytics';

import { api, ApiError } from './api';

type BackendOverview = {
  views?: number;
  storeViews?: number;
  store_views?: number;
  productViews?: number;
  product_views?: number;
  uniqueVisitors?: number;
  unique_visitors?: number;
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
  const storeViews = data.storeViews ?? data.store_views ?? 0;
  const productViews = data.productViews ?? data.product_views ?? 0;
  const views = data.views ?? storeViews + productViews;
  return {
    views,
    storeViews,
    productViews,
    uniqueVisitors: data.uniqueVisitors ?? data.unique_visitors ?? 0,
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

export async function getProductAnalytics(
  range: AnalyticsRange = 'today',
): Promise<ProductAnalyticsRow[]> {
  try {
    const { data } = await api.get<ProductAnalyticsRow[]>('/analytics/products', {
      params: { range },
    });
    return Array.isArray(data) ? data : [];
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError('Failed to load product analytics');
  }
}

type BackendStoreAnalytics = StoreAnalytics & {
  boutique_visits?: number;
};

function mapStoreAnalytics(data: BackendStoreAnalytics): StoreAnalytics {
  const boutiqueVisits = data.boutiqueVisits ?? data.boutique_visits ?? data.visits ?? 0;
  return {
    boutiqueVisits,
    visits: boutiqueVisits,
    contactClicks: data.contactClicks,
    period: data.period,
  };
}

export async function getStoreAnalytics(range: AnalyticsRange = 'today'): Promise<StoreAnalytics> {
  try {
    const { data } = await api.get<BackendStoreAnalytics>('/analytics/store', {
      params: { range },
    });
    return mapStoreAnalytics(data);
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError('Failed to load store analytics');
  }
}
