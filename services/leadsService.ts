import type { Lead, LeadStatus } from '@/types/leads';
import { INITIAL_MOCK_LEADS } from '@constants/leads';

import { api, ApiError } from './api';

export const USE_MOCK = true;

const delay = (ms: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

export async function getLeads(): Promise<Lead[]> {
  if (USE_MOCK) {
    await delay(500);
    return INITIAL_MOCK_LEADS;
  }

  try {
    const { data } = await api.get<Lead[]>('/leads');
    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError('Failed to load leads');
  }
}

export async function updateLeadStatusApi(id: string, status: LeadStatus): Promise<void> {
  if (USE_MOCK) {
    await delay(400);
    return;
  }

  try {
    await api.put(`/leads/${id}/status`, { status });
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError('Failed to update lead status');
  }
}

export async function downloadLeadsReport(): Promise<void> {
  if (USE_MOCK) {
    return;
  }

  try {
    await api.get('/leads/export');
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError('Failed to download leads report');
  }
}
