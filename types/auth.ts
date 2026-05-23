export type UserRole = 'jeweller' | 'customer' | 'admin';

export type User = {
  id: string;
  phone: string;
  role: UserRole;
  /** Mapped from backend is_phone_verified */
  isVerified: boolean;
  name?: string;
  /** Kept for UI compatibility — not returned by /auth/me */
  businessName?: string;
};

export type SendOtpResponse = {
  success: boolean;
  message: string;
  expiresIn: number;
};

export type VerifyOtpResponse = {
  success: boolean;
  token: string;
  user: User;
  onboardingStep: number;
  isOnboardingComplete: boolean;
  storeStatus: string | null;
  isNewUser: boolean;
};

export type CountryOption = {
  code: string;
  dial: string;
  flag: string;
  name: string;
};
