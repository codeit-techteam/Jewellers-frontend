import type { BusinessDocument, BusinessProfile } from '@/types/profile';
import { useOnboardingStore } from '@store/useOnboardingStore';

export const SUPPORT_PHONE = '+919876543210';
export const SUPPORT_EMAIL = 'support@psltd.com';
export const PROFILE_TAGLINE = 'Premium Jewelry Partner';

export function createInitialProfile(): BusinessProfile {
  const { step1, step4, step5 } = useOnboardingStore.getState();
  const contact = step1?.contactNumber ?? '9876543210';
  const formattedPhone = contact.startsWith('+') ? contact : `+91 ${contact}`;

  return {
    businessName: step1?.businessName ?? 'Royal Jewellers',
    ownerName: step1?.ownerName ?? 'Utkarsh',
    phone: formattedPhone,
    address: step1?.businessAddress ?? '12/A Zaveri Bazaar, Mumbai, MH',
    taxId: 'TX-9827341',
    logoUri: step4?.logoUri ?? null,
    coverUri: step4?.coverImageUri ?? null,
    memberId: 'JW-86293',
    isVerified: true,
    plan: step5?.planName ?? 'Free',
  };
}

export const INITIAL_MOCK_DOCUMENTS: BusinessDocument[] = [
  {
    id: 'doc-gst',
    name: 'GST Registration',
    type: 'gst',
    status: 'verified',
    updatedAt: 'Updated Oct 12, 2023',
  },
  {
    id: 'doc-bis',
    name: 'BIS Hallmark',
    type: 'bis',
    status: 'pending',
    updatedAt: 'Uploaded 2 days ago',
  },
  {
    id: 'doc-trade',
    name: 'Trade License',
    type: 'trade',
    status: 'expiring',
    updatedAt: 'Expires in 14 days',
  },
  {
    id: 'doc-pan',
    name: 'Company PAN',
    type: 'pan',
    status: 'verified',
    updatedAt: 'Verified on Jan 05, 2023',
  },
];

export const DOCUMENT_TYPE_OPTIONS = [
  { label: 'GST Registration', type: 'gst' as const },
  { label: 'BIS Hallmark', type: 'bis' as const },
  { label: 'Trade License', type: 'trade' as const },
  { label: 'Company PAN', type: 'pan' as const },
  { label: 'Other', type: 'other' as const },
];
