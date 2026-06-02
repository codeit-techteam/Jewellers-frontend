import { colors } from '@constants/colors';
import type { Lead } from '@/types/leads';
import type { LeadStatus } from '@/types/leads';
import { getLeadDisplayCategory, type LeadDisplayCategory } from '@utils/leadSchedule';

export function normalizePhoneForLink(phone: string): string {
  return phone.replace(/[^\d+]/g, '');
}

export function getLeadDisplayBadgeStyle(category: LeadDisplayCategory): {
  backgroundColor: string;
  color: string;
  label: string;
} {
  switch (category) {
    case 'upcoming':
      return {
        backgroundColor: colors.NAVY,
        color: colors.WHITE,
        label: 'Upcoming',
      };
    case 'non_visited':
      return {
        backgroundColor: colors.TIP_BG,
        color: colors.NAVY,
        label: 'Non Visited',
      };
    case 'visited':
      return {
        backgroundColor: colors.SUCCESS,
        color: colors.WHITE,
        label: 'Visited',
      };
    case 'cancelled':
      return {
        backgroundColor: colors.SURFACE_MUTED,
        color: colors.BODY_TEXT,
        label: 'Cancelled',
      };
  }
}

export function getLeadBadgeStyle(lead: Lead) {
  return getLeadDisplayBadgeStyle(getLeadDisplayCategory(lead));
}

/** @deprecated Prefer getLeadBadgeStyle(lead) for display grouping. */
export function getLeadStatusBadgeStyle(status: LeadStatus): {
  backgroundColor: string;
  color: string;
  label: string;
} {
  if (status === 'visited') {
    return getLeadDisplayBadgeStyle('visited');
  }
  if (status === 'cancelled') {
    return getLeadDisplayBadgeStyle('cancelled');
  }
  return getLeadDisplayBadgeStyle('upcoming');
}

export function canMarkLeadVisited(lead: Lead): boolean {
  const category = getLeadDisplayCategory(lead);
  return category === 'upcoming' || category === 'non_visited';
}
