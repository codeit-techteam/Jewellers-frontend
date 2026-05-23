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

export async function sendOtp(countryCode: string, phone: string): Promise<SendOtpResponse> {
  try {
    const { data } = await api.post<SendOtpResponse>('/auth/send-otp', { phone, countryCode });
    return data;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError('Failed to send OTP');
  }
}

export async function verifyOtp(phone: string, otp: string): Promise<VerifyOtpResponse> {
  try {
    const { data } = await api.post<VerifyOtpResponse>('/auth/verify-otp', { phone, otp });
    return data;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError('Failed to verify OTP');
  }
}

export async function resendOtp(phone: string, countryCode?: string): Promise<SendOtpResponse> {
  try {
    const { data } = await api.post<SendOtpResponse>('/auth/resend-otp', { phone, countryCode });
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
): Href {
  return getResumeRoute(isOnboardingComplete, onboardingStep);
}
