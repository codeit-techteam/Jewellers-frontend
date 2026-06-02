import type { Lead } from '@/types/leads';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';

dayjs.extend(customParseFormat);

/** UI grouping derived from API status + appointment date/time (not a separate DB status). */
export type LeadDisplayCategory = 'upcoming' | 'non_visited' | 'visited' | 'cancelled';

export function getLeadAppointmentDateTime(lead: Lead): dayjs.Dayjs | null {
  if (lead.startsAt) {
    const fromIso = dayjs(lead.startsAt);
    if (fromIso.isValid()) {
      return fromIso;
    }
  }

  if (lead.appointmentDateRaw) {
    const time = lead.appointmentTimeRaw?.trim() || '23:59';
    const withSeconds = time.length === 5 ? `${time}:00` : time;
    const combined = dayjs(`${lead.appointmentDateRaw}T${withSeconds}`);
    if (combined.isValid()) {
      return combined;
    }
  }

  if (!lead.appointmentDate || lead.appointmentDate === '—') {
    return null;
  }

  const datePart = dayjs(lead.appointmentDate, 'MMM D, YYYY', true);
  const date = datePart.isValid() ? datePart : dayjs(lead.appointmentDate);
  if (!date.isValid()) {
    return null;
  }

  if (lead.appointmentTime && lead.appointmentTime !== '—') {
    const combined = dayjs(
      `${date.format('YYYY-MM-DD')} ${lead.appointmentTime}`,
      'YYYY-MM-DD h:mm A',
      true,
    );
    if (combined.isValid()) {
      return combined;
    }
  }

  return date.endOf('day');
}

export function isLeadAppointmentInFuture(lead: Lead): boolean {
  const appointmentAt = getLeadAppointmentDateTime(lead);
  if (!appointmentAt) {
    return false;
  }
  return appointmentAt.isAfter(dayjs());
}

export function getLeadDisplayCategory(lead: Lead): LeadDisplayCategory {
  if (lead.status === 'visited') {
    return 'visited';
  }
  if (lead.status === 'cancelled') {
    return 'cancelled';
  }
  return isLeadAppointmentInFuture(lead) ? 'upcoming' : 'non_visited';
}

export function isFutureUpcomingLead(lead: Lead): boolean {
  return getLeadDisplayCategory(lead) === 'upcoming';
}

export function isNonVisitedLead(lead: Lead): boolean {
  return getLeadDisplayCategory(lead) === 'non_visited';
}
