import type { Lead, LeadStatus } from '@/types/leads';
import dayjs from 'dayjs';

import { api, ApiError } from './api';

type BackendAppointment = {
  id: string;
  customer_name?: string;
  customer_phone?: string;
  service_requested?: string;
  starts_at?: string;
  date?: string;
  time?: string;
  status: string;
};

function formatPhone(phone?: string): string {
  if (!phone) return '—';
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) {
    return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
  }
  return phone;
}

function mapAppointment(row: BackendAppointment): Lead {
  let appointmentDate = '—';
  let appointmentTime = '—';

  if (row.starts_at) {
    const dt = dayjs(row.starts_at);
    if (dt.isValid()) {
      appointmentDate = dt.format('MMM D, YYYY');
      appointmentTime = dt.format('hh:mm A');
    }
  } else if (row.date) {
    appointmentDate = row.date;
    appointmentTime = row.time ?? '—';
  }

  const status: LeadStatus =
    row.status === 'visited' ? 'visited' : 'upcoming';

  return {
    id: row.id,
    name: row.customer_name ?? 'Customer',
    phone: formatPhone(row.customer_phone),
    appointmentDate,
    appointmentTime,
    serviceRequested: row.service_requested ?? 'Consultation',
    status,
  };
}

export async function getLeads(status?: LeadStatus): Promise<Lead[]> {
  try {
    const { data } = await api.get<BackendAppointment[]>('/appointments', {
      params: status ? { status } : undefined,
    });
    return (Array.isArray(data) ? data : []).map(mapAppointment);
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError('Failed to load leads');
  }
}

export async function updateLeadStatusApi(id: string, status: LeadStatus): Promise<void> {
  try {
    await api.patch(`/appointments/${id}/status`, { status });
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError('Failed to update lead status');
  }
}

export async function downloadLeadsReport(): Promise<void> {
  try {
    await api.get('/appointments/export');
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError('Failed to download leads report');
  }
}
