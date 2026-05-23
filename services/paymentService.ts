import type { MockPaymentResponse, PaymentMethod, Plan } from '@/types/payment';

import { api, ApiError } from './api';

// Raw shape from backend /subscription/plans
type BackendPlan = {
  id: string;
  name: string;
  price_monthly: number;
  price_annual: number;
  features: string[] | Record<string, string>;
  is_active: boolean;
};

/** Fetches subscription plans from the backend (public endpoint, no auth). */
export async function getPlans(): Promise<Plan[]> {
  try {
    const { data } = await api.get<BackendPlan[]>('/subscription/plans');

    return data.map((bp, index) => {
      const hasAnnual = bp.price_annual > 0;
      return {
        id: bp.id,
        name: bp.name,
        monthlyPrice: bp.price_monthly,
        checkoutPrice: hasAnnual ? bp.price_annual : bp.price_monthly,
        billingCycle: hasAnnual ? 'annual' : 'monthly',
        features: Array.isArray(bp.features)
          ? bp.features
          : Object.values(bp.features as Record<string, string>),
        // Second plan in the sorted list is "Best Value" (middle paid tier)
        isBestValue: index === 1 && bp.price_monthly > 0,
      };
    });
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError('Failed to load subscription plans');
  }
}

/** Mock payment gateway — dev only. Backend always succeeds and returns a transaction ID. */
export async function mockPayment(
  subscriptionId: string,
  method: PaymentMethod,
): Promise<MockPaymentResponse> {
  try {
    const { data } = await api.post<MockPaymentResponse>('/subscription/payment/mock', {
      subscriptionId,
      method,
    });
    return data;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError('Payment failed. Please try again.');
  }
}
