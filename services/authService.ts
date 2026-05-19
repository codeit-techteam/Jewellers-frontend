import type { SendOtpResponse, User, VerifyOtpResponse } from '@/types/auth';

import { api, ApiError } from './api';

const USE_MOCK = true; // set to false when real backend is ready

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
      message: 'OTP sent successfully',
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
    return {
      success: true,
      token: MOCK_TOKEN,
      user: buildMockUser(phone),
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

export async function resendOtp(phone: string): Promise<SendOtpResponse> {
  if (USE_MOCK) {
    await delay(500);
    return {
      success: true,
      message: 'OTP resent successfully',
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
