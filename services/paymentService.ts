import type {
  PaymentInitiateResponse,
  PaymentMethod,
  PaymentVerifyResponse,
  PlanId,
} from '@/types/payment';

import { api, ApiError } from './api';

export const USE_MOCK = true;

const delay = (ms: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

type InitiatePaymentBody = {
  planId: PlanId;
  paymentMethod: PaymentMethod;
  amount: number;
};

type VerifyPaymentBody = {
  transactionId: string;
};

export async function initiatePayment(
  planId: PlanId,
  paymentMethod: PaymentMethod,
  amount: number,
): Promise<PaymentInitiateResponse> {
  if (USE_MOCK) {
    await delay(1500);
    return {
      success: true,
      transactionId: 'TXN123456',
      message: 'Payment initiated successfully',
    };
  }

  try {
    const { data } = await api.post<PaymentInitiateResponse>('/payment/initiate', {
      planId,
      paymentMethod,
      amount,
    } satisfies InitiatePaymentBody);
    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError('Payment initiation failed');
  }
}

export async function verifyPayment(transactionId: string): Promise<PaymentVerifyResponse> {
  if (USE_MOCK) {
    await delay(800);
    return { success: true, status: 'completed' };
  }

  try {
    const { data } = await api.post<PaymentVerifyResponse>('/payment/verify', {
      transactionId,
    } satisfies VerifyPaymentBody);
    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError('Payment verification failed');
  }
}
