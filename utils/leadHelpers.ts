import { colors } from '@constants/colors';
import type { LeadStatus } from '@/types/leads';

export function normalizePhoneForLink(phone: string): string {
  return phone.replace(/[^\d+]/g, '');
}

export function getLeadStatusBadgeStyle(status: LeadStatus): {
  backgroundColor: string;
  color: string;
  label: string;
} {
  switch (status) {
    case 'upcoming':
      return {
        backgroundColor: colors.NAVY,
        color: colors.WHITE,
        label: 'Upcoming',
      };
    case 'visited':
      return {
        backgroundColor: colors.SUCCESS,
        color: colors.WHITE,
        label: 'Visited',
      };
    default:
      return {
        backgroundColor: colors.SURFACE_MUTED,
        color: colors.BODY_TEXT,
        label: status,
      };
  }
}
