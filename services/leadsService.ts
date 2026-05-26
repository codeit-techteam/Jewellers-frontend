import type { Lead, LeadStatus } from '@/types/leads';
import dayjs from 'dayjs';

import { api, ApiError } from './api';

type BackendAppointment = {
  id: string;
  customer_name?: string | null;
  customer_phone?: string | null;
  service_requested?: string | null;
  notes?: string | null;
  type?: string | null;
  starts_at?: string | null;
  date?: string | null;
  time?: string | null;
  status: string;
};

function formatPhone(phone?: string | null): string {
  if (!phone || !phone.trim()) return 'Not provided';
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) {
    return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
  }
  return phone;
}

function formatDate(date?: string | null): string {
  if (!date) return '—';
  const d = dayjs(date);
  return d.isValid() ? d.format('MMM D, YYYY') : date;
}

function formatTime(date: string, time?: string | null): string {
  if (!time) return '—';
  const d = dayjs(`${date}T${time}:00`);
  return d.isValid() ? d.format('h:mm A') : time;
}

function mapAppointment(row: BackendAppointment): Lead {
  let appointmentDate = '—';
  let appointmentTime = '—';

  // Prefer explicit date/time fields (stored as local values) over starts_at
  // which is stored as UTC and would shift on display in local timezone.
  if (row.date) {
    appointmentDate = formatDate(row.date);
    appointmentTime = formatTime(row.date, row.time);
  } else if (row.starts_at) {
    const dt = dayjs(row.starts_at);
    if (dt.isValid()) {
      appointmentDate = dt.format('MMM D, YYYY');
      appointmentTime = dt.format('h:mm A');
    }
  }

  const status: LeadStatus =
    row.status === 'visited'
      ? 'visited'
      : row.status === 'cancelled'
        ? 'cancelled'
        : 'upcoming';

  return {
    id: row.id,
    name: row.customer_name?.trim() || 'Walk-in Customer',
    phone: formatPhone(row.customer_phone),
    appointmentDate,
    appointmentTime,
    serviceRequested: row.service_requested?.trim() || row.type || 'Consultation',
    status,
    notes: row.notes?.trim() || null,
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
