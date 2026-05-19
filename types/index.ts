export type { CountryOption, SendOtpResponse, User, UserRole, VerifyOtpResponse } from './auth';

export type ApiErrorResponse = {
  message: string;
  code?: string;
  statusCode?: number;
};

export type PaginatedResponse<T> = {
  data: T[];
  total: number;
  page: number;
  limit: number;
};

export type ThemeMode = 'light' | 'dark' | 'system';
