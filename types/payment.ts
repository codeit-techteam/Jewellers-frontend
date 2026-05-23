export type PaymentMethod = 'upi' | 'card';

/** Plans now use backend UUIDs — no longer a fixed union. */
export type PlanId = string;

export type BillingCycle = 'monthly' | 'annual';

export type Plan = {
  id: string;
  name: string;
  monthlyPrice: number;
  checkoutPrice: number;
  billingCycle: BillingCycle;
  features: string[];
  isBestValue?: boolean;
};

export type Step5Data = {
  planId: string;
  planName: string;
  price: number;
  billingCycle: BillingCycle;
  /** Returned by chooseSubscription for paid plans; absent for free. */
  subscriptionId?: string;
};

export type Step6Data = {
  paymentMethod: PaymentMethod;
  status: 'pending' | 'success' | 'failed';
  transactionId?: string;
};

export type MockPaymentResponse = {
  success: boolean;
  transactionId: string;
};
