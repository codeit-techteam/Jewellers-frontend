import { colors } from '@constants/colors';
import type { BusinessDocumentType, DocumentStatus } from '@/types/profile';
import type { ComponentProps } from 'react';
import type { Ionicons } from '@expo/vector-icons';

type IoniconsName = ComponentProps<typeof Ionicons>['name'];

export function getDocumentIconName(type: BusinessDocumentType): IoniconsName {
  switch (type) {
    case 'gst':
      return 'document-text-outline';
    case 'bis':
      return 'shield-checkmark-outline';
    case 'trade':
      return 'ribbon-outline';
    case 'pan':
      return 'card-outline';
    default:
      return 'document-outline';
  }
}

export function getDocumentStatusAccent(status: DocumentStatus): string {
  switch (status) {
    case 'verified':
      return colors.SUCCESS;
    case 'pending':
      return colors.NAVY;
    case 'expiring':
      return colors.GOLD;
    case 'expired':
      return colors.ERROR;
    default:
      return colors.BORDER;
  }
}

export function getDocumentStatusBadge(status: DocumentStatus): {
  label: string;
  backgroundColor: string;
  color: string;
} {
  switch (status) {
    case 'verified':
      return {
        label: '✓ VERIFIED',
        backgroundColor: `${colors.SUCCESS}22`,
        color: colors.SUCCESS,
      };
    case 'pending':
      return {
        label: '⏳ PENDING',
        backgroundColor: colors.INFO_BG,
        color: colors.NAVY,
      };
    case 'expiring':
      return {
        label: '⚠ RENEW',
        backgroundColor: colors.TIP_BG,
        color: colors.GOLD,
      };
    case 'expired':
      return {
        label: '✗ EXPIRED',
        backgroundColor: `${colors.ERROR}22`,
        color: colors.ERROR,
      };
    default:
      return {
        label: status,
        backgroundColor: colors.SURFACE_MUTED,
        color: colors.BODY_TEXT,
      };
  }
}
