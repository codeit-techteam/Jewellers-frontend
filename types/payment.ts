export type PaymentMethod = 'upi' | 'card';

export type PlanId = 'free' | 'pro' | 'featured';

export type BillingCycle = 'monthly' | 'annual';

export type Plan = {
  id: PlanId;
  name: string;
  monthlyPrice: number;
  checkoutPrice: number;
  billingCycle: BillingCycle;
  features: string[];
  isBestValue?: boolean;
};

export type Step5Data = {
  planId: PlanId;
  planName: string;
  price: number;
  billingCycle: BillingCycle;
};

export type Step6Data = {
  paymentMethod: PaymentMethod;
  status: 'pending' | 'success' | 'failed';
  transactionId?: string;
};

export type PaymentInitiateResponse = {
  success: boolean;
  transactionId: string;
  message: string;
};

export type PaymentVerifyResponse = {
  success: boolean;
  status: string;
};
