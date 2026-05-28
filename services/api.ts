import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import * as SecureStore from 'expo-secure-store';

import { config } from '@constants/config';

type RetryableConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
  /** Set true on a request to skip the automatic one-retry on network errors. */
  _noRetry?: boolean;
};

const AUTH_TOKEN_KEY = 'auth_token';

export class ApiError extends Error {
  statusCode?: number;
  code?: string;

  constructor(message: string, statusCode?: number, code?: string) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code;
  }
}

// Set by useAuthStore to avoid circular imports (api → store → service → api)
let _onUnauthorized: (() => void) | null = null;
export function registerUnauthorizedHandler(fn: () => void): void {
  _onUnauthorized = fn;
}

// In-memory token cache — avoids a SecureStore read on every outgoing request.
// Kept in sync by setAuthToken / clearAuthToken; warmed on first interceptor miss.
let _memToken: string | null = null;

/** True while a bearer token is considered active — stale 401s after logout are ignored. */
let _sessionActive = false;

/** True during intentional logout — prevents 401 on /auth/logout from re-triggering logout. */
let _isLoggingOut = false;

export function setLoggingOut(value: boolean): void {
  _isLoggingOut = value;
}

export const api = axios.create({
  baseURL: config.apiUrl,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

api.interceptors.request.use(
  async (requestConfig: InternalAxiosRequestConfig) => {
    // Use the in-memory cache; fall back to SecureStore only on the very first request
    // after a cold start (before setAuthToken has been called with the restored token).
    let token = _memToken;
    if (!token) {
      token = await SecureStore.getItemAsync(AUTH_TOKEN_KEY);
      if (token) _memToken = token; // warm cache for subsequent requests
    }
    if (token && requestConfig.headers) {
      requestConfig.headers.Authorization = `Bearer ${token}`;
    }
    return requestConfig;
  },
  (error: AxiosError) => Promise.reject(error),
);

api.interceptors.response.use(
  (response) => {
    // Unwrap backend envelope: { success, data, message } → payload
    if (
      response.data !== null &&
      typeof response.data === 'object' &&
      'success' in response.data &&
      'data' in response.data
    ) {
      response.data = response.data.data;
    }
    return response;
  },
  async (error: AxiosError<{ message?: string; code?: string }>) => {
    const config = error.config as RetryableConfig | undefined;
    const status = error.response?.status;

    // Retry once on network/timeout errors (no response from server, not a 4xx/5xx)
    const isNetworkError =
      !error.response &&
      (error.code === 'ERR_NETWORK' ||
        error.code === 'ECONNABORTED' ||
        error.message === 'Network Error');

    if (isNetworkError && config && !config._retry && !config._noRetry) {
      config._retry = true;
      await new Promise<void>((resolve) => setTimeout(resolve, 1000));
      return api.request(config);
    }

    const message = error.response?.data?.message ?? error.message ?? 'Something went wrong';
    const code = error.response?.data?.code;

    if (status === 401) {
      const requestUrl = config?.url ?? '';
      const isLogoutRequest = requestUrl.includes('/auth/logout');

      // Only force a session reset when we still believe the user is signed in.
      // Ignores stale in-flight 401s after logout and breaks the logout→401→logout loop.
      if (_sessionActive && !_isLoggingOut && !isLogoutRequest) {
        _sessionActive = false;
        _memToken = null;
        await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
        _onUnauthorized?.();
      }
    }

    return Promise.reject(new ApiError(message, status, code));
  },
);

/** Populate the in-memory cache without writing to SecureStore (use on cold-start restore). */
export function primeTokenCache(token: string): void {
  _memToken = token;
  _sessionActive = true;
}

export const setAuthToken = async (token: string): Promise<void> => {
  _memToken = token;
  _sessionActive = true;
  await SecureStore.setItemAsync(AUTH_TOKEN_KEY, token);
};

export const clearAuthToken = async (): Promise<void> => {
  _memToken = null;
  _sessionActive = false;
  await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
};
