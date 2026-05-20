export const SALES_REPORT_PERIODS = ['Today', 'Week', 'Month', 'Year'] as const;

export type SalesReportPeriod = (typeof SALES_REPORT_PERIODS)[number];

export const MOCK_SALES_REPORT = {
  totalRevenue: 124500,
  growthPercent: '+18.5%',
  orders: 47,
  avgOrder: 2648,
  views: 2450,
  conversion: 1.9,
  topProducts: [
    { rank: 1, name: 'Temple Gold Necklace', revenue: 59350 },
    { rank: 2, name: 'Solitaire Diamond Ring', revenue: 37950 },
    { rank: 3, name: 'Filigree Gold Bangles', revenue: 25850 },
  ],
  recentActivity: [
    { icon: 'chatbubble-outline' as const, text: 'New inquiry on Solitaire Ring', time: '2 hours ago' },
    { icon: 'eye-outline' as const, text: 'Product viewed 45 times today — Diamond Necklace', time: '4 hours ago' },
    { icon: 'heart-outline' as const, text: 'Added to wishlist — Temple Gold Necklace', time: '6 hours ago' },
    { icon: 'logo-whatsapp' as const, text: 'WhatsApp click on Filigree Bangles', time: '8 hours ago' },
    { icon: 'cart-outline' as const, text: 'New order placed — ₹37,950', time: 'Yesterday' },
  ],
};
