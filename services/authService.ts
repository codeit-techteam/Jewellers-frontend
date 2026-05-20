import { getResumeRoute } from '@lib/getResumeRoute';
import { loadOnboardingMeta } from '@lib/onboardingMeta';
import type { Href } from 'expo-router';
import type { SendOtpResponse, User, VerifyOtpResponse } from '@/types/auth';
import { useAuthStore } from '@store/useAuthStore';

import { api, ApiError } from './api';

export const USE_MOCK = true;

const MOCK_TOKEN = 'mock-jwt-token-for-testing';
const MOCK_OTP = '123456';

type SendOtpBody = {
  countryCode: string;
  phone: string;
};

type VerifyOtpBody = {
  phone: string;
  otp: string;
};

type ResendOtpBody = {
  phone: string;
};

const delay = (ms: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

function buildMockUser(phone: string): User {
  return {
    id: 'mock-user-001',
    name: 'Test Jeweller',
    phone,
    businessName: 'Test Jewels Pvt Ltd',
    isVerified: true,
    role: 'jeweller',
  };
}

export async function sendOtp(countryCode: string, phone: string): Promise<SendOtpResponse> {
  if (USE_MOCK) {
    await delay(1000);
    return {
      success: true,
      message: 'OTP sent',
      expiresIn: 45,
    };
  }

  try {
    const { data } = await api.post<SendOtpResponse>('/auth/send-otp', {
      countryCode,
      phone,
    } satisfies SendOtpBody);
    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError('Failed to send OTP');
  }
}

export async function verifyOtp(phone: string, otp: string): Promise<VerifyOtpResponse> {
  if (USE_MOCK) {
    await delay(500);
    if (otp !== MOCK_OTP) {
      throw new ApiError('Invalid OTP. Please try again.');
    }

    const authMode = useAuthStore.getState().authMode;
    let onboardingStep = 1;
    let isOnboardingComplete = false;

    if (authMode === 'login') {
      const existingMeta = await loadOnboardingMeta();
      if (existingMeta) {
        onboardingStep = existingMeta.currentOnboardingStep;
        isOnboardingComplete = existingMeta.isOnboardingComplete;
      }
    }

    return {
      success: true,
      token: MOCK_TOKEN,
      user: buildMockUser(phone),
      onboardingStep,
      isOnboardingComplete,
    };
  }

  try {
    const { data } = await api.post<VerifyOtpResponse>('/auth/verify-otp', {
      phone,
      otp,
    } satisfies VerifyOtpBody);
    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError('Failed to verify OTP');
  }
}

/** Delegates to lib/getResumeRoute — single source of truth for navigation. */
export function getResumeRouteForStep(
  isOnboardingComplete: boolean,
  onboardingStep: number,
): Href {
  return getResumeRoute(isOnboardingComplete, onboardingStep);
}

export async function resendOtp(phone: string): Promise<SendOtpResponse> {
  if (USE_MOCK) {
    await delay(500);
    return {
      success: true,
      message: 'OTP sent',
      expiresIn: 45,
    };
  }

  try {
    const { data } = await api.post<SendOtpResponse>('/auth/resend-otp', {
      phone,
    } satisfies ResendOtpBody);
    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError('Failed to resend OTP');
  }
}
