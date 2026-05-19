import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import * as SecureStore from 'expo-secure-store';

import { config } from '@constants/config';

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
    const token = await SecureStore.getItemAsync(AUTH_TOKEN_KEY);
    if (token && requestConfig.headers) {
      requestConfig.headers.Authorization = `Bearer ${token}`;
    }
    return requestConfig;
  },
  (error: AxiosError) => Promise.reject(error),
);

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<{ message?: string; code?: string }>) => {
    const status = error.response?.status;
    const message =
      error.response?.data?.message ?? error.message ?? 'Something went wrong';
    const code = error.response?.data?.code;

    if (status === 401) {
      await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
    }

    return Promise.reject(new ApiError(message, status, code));
  },
);

export const setAuthToken = async (token: string): Promise<void> => {
  await SecureStore.setItemAsync(AUTH_TOKEN_KEY, token);
};

export const clearAuthToken = async (): Promise<void> => {
  await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
};
