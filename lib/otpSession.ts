import type { AuthFlowMode } from '@store/useAuthStore';
import * as SecureStore from 'expo-secure-store';

export const OTP_SESSION_KEY = 'otp_session';

export type OtpSession = {
  phone: string;
  countryCode: string;
  authMode?: AuthFlowMode;
};

export async function saveOtpSession(session: OtpSession): Promise<void> {
  await SecureStore.setItemAsync(OTP_SESSION_KEY, JSON.stringify(session));
}

export async function loadOtpSession(): Promise<OtpSession | null> {
  const raw = await SecureStore.getItemAsync(OTP_SESSION_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as OtpSession;
    if (typeof parsed.phone === 'string' && typeof parsed.countryCode === 'string') {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

export async function clearOtpSession(): Promise<void> {
  await SecureStore.deleteItemAsync(OTP_SESSION_KEY);
}
