import type { Href } from 'expo-router';
import type { SendOtpResponse, User, VerifyOtpResponse } from '@/types/auth';

import { getResumeRoute } from '@lib/getResumeRoute';
import { api, ApiError } from './api';

// Raw shape returned by /auth/me before mapping
type RawMeResponse = {
  id: string;
  phone: string;
  role: 'jeweller' | 'customer' | 'admin';
  name?: string;
  full_name?: string;
  is_phone_verified: boolean;
};

// sendOtp / resendOtp are lightweight (no DB write in mock mode) — short timeout,
// no retry so users get fast feedback on connectivity issues.
const OTP_SEND_CONFIG = { timeout: 10000, _noRetry: true } as const;

// verifyOtp triggers user lookup, user creation, bcrypt hashing, token storage,
// and boutique queries — heavier chain that can be slow on a cold Supabase
// connection. Give it the full 30 s but still skip the auto-retry (retrying a
// verify with the same code is safe, but we don't want silent double-submits).
const OTP_VERIFY_CONFIG = { timeout: 30000, _noRetry: true } as const;

export async function sendOtp(countryCode: string, phone: string): Promise<SendOtpResponse> {
  try {
    const { data } = await api.post<SendOtpResponse>(
      '/auth/send-otp',
      { phone, countryCode },
      OTP_SEND_CONFIG,
    );
    return data;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError('Failed to send OTP');
  }
}

export async function verifyOtp(phone: string, otp: string): Promise<VerifyOtpResponse> {
  try {
    const { data } = await api.post<VerifyOtpResponse>(
      '/auth/verify-otp',
      { phone, otp },
      OTP_VERIFY_CONFIG,
    );
    return data;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError('Failed to verify OTP');
  }
}

export async function resendOtp(phone: string, countryCode?: string): Promise<SendOtpResponse> {
  try {
    const { data } = await api.post<SendOtpResponse>(
      '/auth/resend-otp',
      { phone, countryCode },
      OTP_SEND_CONFIG,
    );
    return data;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError('Failed to resend OTP');
  }
}

export async function getMe(): Promise<User> {
  const { data } = await api.get<RawMeResponse>('/auth/me');
  return {
    id: data.id,
    phone: data.phone,
    role: data.role,
    isVerified: data.is_phone_verified,
    name: data.name ?? data.full_name,
  };
}

export async function logout(): Promise<void> {
  try {
    await api.post('/auth/logout');
  } catch {
    // Best effort — local cleanup always happens regardless
  }
}

/** Delegates to lib/getResumeRoute — single source of truth for navigation. */
export function getResumeRouteForStep(
  isOnboardingComplete: boolean,
  onboardingStep: number,
  storeStatus?: string,
  needsSubscription?: boolean,
): Href {
  return getResumeRoute(isOnboardingComplete, onboardingStep, storeStatus, needsSubscription);
}
