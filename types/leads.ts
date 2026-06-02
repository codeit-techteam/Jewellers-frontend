export type LeadStatus = 'upcoming' | 'visited' | 'cancelled';

export type Lead = {
  id: string;
  name: string;
  phone: string;
  appointmentDate: string;
  appointmentTime: string;
  /** ISO datetime for scheduling logic (from API `starts_at` or date/time fields). */
  startsAt?: string | null;
  /** Raw `YYYY-MM-DD` from API when available. */
  appointmentDateRaw?: string | null;
  /** Raw `HH:mm` from API when available. */
  appointmentTimeRaw?: string | null;
  serviceRequested: string;
  status: LeadStatus;
  notes?: string | null;
};
