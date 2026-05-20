export type UserRole = 'jeweller' | 'admin' | 'partner';

export type User = {
  id: string;
  name: string;
  phone: string;
  businessName: string;
  isVerified: boolean;
  role: UserRole;
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
};

export type CountryOption = {
  code: string;
  dial: string;
  flag: string;
  name: string;
};
