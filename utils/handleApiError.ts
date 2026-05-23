import { ApiError } from '@services/api';
import type { AxiosError } from 'axios';

function isNetworkError(error: unknown): boolean {
  if (error instanceof ApiError) {
    return false;
  }

  const axiosErr = error as AxiosError | undefined;
  if (axiosErr?.isAxiosError && !axiosErr.response) {
    return (
      axiosErr.code === 'ERR_NETWORK' ||
      axiosErr.message === 'Network Error' ||
      axiosErr.message.toLowerCase().includes('network')
    );
  }

  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    return msg === 'network error' || msg.includes('network request failed');
  }

  return false;
}

export function handleApiError(error: unknown, setErrorFn?: (message: string) => void): string {
  let message: string;

  if (error instanceof ApiError) {
    if (error.statusCode === 401) {
      return '';
    }
    if (error.statusCode === 400) {
      message = error.message || 'Invalid request';
    } else if (error.statusCode && error.statusCode >= 500) {
      message = 'Server error. Please try again.';
    } else {
      message = error.message || 'Something went wrong';
    }
  } else if (isNetworkError(error)) {
    message = 'No internet connection';
  } else if (error instanceof Error) {
    message = error.message || 'Something went wrong';
  } else {
    message = 'Something went wrong';
  }

  if (setErrorFn && message) {
    setErrorFn(message);
  }

  return message;
}
