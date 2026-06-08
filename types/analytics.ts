export type AnalyticsRange = 'today' | 'yesterday' | '7days' | '30days' | 'this_month';

export type AnalyticsOverview = {
  /** @deprecated Use storeViews + productViews — kept for backwards compatibility */
  views: number;
  storeViews: number;
  productViews: number;
  uniqueVisitors: number;
  wishlist: number;
  inquiry: number;
  waClicks: number;
  appointments: number;
  range: AnalyticsRange;
  startDate: string;
  endDate: string;
};

export type ProductAnalyticsRow = {
  productId: string;
  productName: string;
  price: number;
  status: string;
  sku: string;
  views: number;
  wishlist: number;
  inquiry: number;
  waClicks: number;
};

export type StoreAnalytics = {
  boutiqueVisits: number;
  visits: number;
  contactClicks: {
    total: number;
    call: number;
    whatsapp: number;
  };
  period: string;
};
