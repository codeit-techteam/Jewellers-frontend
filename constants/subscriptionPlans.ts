import type { Plan } from '@/types/payment';

export const SUBSCRIPTION_PLANS: Plan[] = [
  {
    id: 'free',
    name: 'Free',
    monthlyPrice: 0,
    checkoutPrice: 0,
    billingCycle: 'monthly',
    features: [
      'Basic Inventory Management',
      'Single Store Access',
      'Standard Email Support',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    monthlyPrice: 1999,
    checkoutPrice: 12000,
    billingCycle: 'annual',
    isBestValue: true,
    features: [
      'Everything in Free',
      'Advanced Sales Analytics',
      'Unlimited Product Uploads',
      'Customer CRM Tools',
      'Priority 24/7 Support',
    ],
  },
  {
    id: 'featured',
    name: 'Featured',
    monthlyPrice: 4999,
    checkoutPrice: 59990,
    billingCycle: 'annual',
    features: [
      'Everything in Pro',
      'Homepage Placement',
      'Featured Jeweller Badge',
      'SEO Optimization Tools',
    ],
  },
];

export function getPlanById(planId: Plan['id']): Plan {
  const plan = SUBSCRIPTION_PLANS.find((item) => item.id === planId);
  if (!plan) {
    throw new Error(`Unknown plan: ${planId}`);
  }
  return plan;
}
