import type { BusinessDocument, BusinessDocumentType, DocumentStatus } from '@/types/profile';

export type StoreSubscription = {
  id: string;
  status: string;
  billingCycle: string;
  planName: string;
  expiresAt: string | null;
};

export type StoreProfile = {
  id: string;
  businessName: string;
  ownerName: string;
  address: string;
  phone: string;
  whatsappNumber: string;
  logoUrl: string | null;
  coverImageUrl: string | null;
  tagline: string;
  description: string;
  openingTime: string;
  closingTime: string;
  workingDays: string[];
  storeStatus: string;
  memberId: string;
  planName: string;
  planRenewalDate: string | null;
  memberSince: string | null;
  documents: BusinessDocument[];
  subscription: StoreSubscription | null;
};

export type UpdateStoreData = {
  description?: string;
  phoneNumber?: string;
  whatsappNumber?: string;
  openingTime?: string;
  closingTime?: string;
  workingDays?: string[];
  name?: string;
  address?: string;
  storeTagline?: string;
};

type BackendDocument = {
  id: string;
  type: string;
  name: string;
  status: string;
  file_url?: string;
  license_no?: string | null;
  updated_at?: string;
  created_at?: string;
};

type BackendSubscription = {
  id: string;
  status: string;
  billing_cycle?: string;
  started_at?: string | null;
  expires_at?: string | null;
  subscription_plans?: {
    name?: string;
    slug?: string;
    price_monthly?: number;
    price_annual?: number;
  } | null;
};

export type BackendStore = {
  id: string;
  name?: string;
  owner_name?: string;
  address?: string;
  logo_url?: string | null;
  cover_image_url?: string | null;
  store_tagline?: string;
  phone_number?: string;
  whatsapp_number?: string;
  opening_time?: string;
  closing_time?: string;
  working_days?: string[] | null;
  description?: string;
  store_status?: string;
  member_id?: string;
  created_at?: string;
  documents?: BackendDocument[];
  subscription?: BackendSubscription | null;
};

function mapDocumentStatus(status: string): DocumentStatus {
  if (status === 'verified') return 'verified';
  if (status === 'rejected' || status === 'expired') return 'expired';
  if (status === 'expiring') return 'expiring';
  return 'pending';
}

function formatDocUpdatedAt(iso?: string): string {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return `Updated ${date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}`;
}

export function mapBackendDocument(doc: BackendDocument): BusinessDocument {
  return {
    id: doc.id,
    name: doc.name,
    type: doc.type as BusinessDocumentType,
    status: mapDocumentStatus(doc.status),
    updatedAt: formatDocUpdatedAt(doc.updated_at ?? doc.created_at),
    licenseNo: doc.license_no ?? undefined,
    fileUri: doc.file_url,
  };
}

export function mapBackendStore(boutique: BackendStore): StoreProfile {
  const sub = boutique.subscription;
  const planName = sub?.subscription_plans?.name ?? 'Free Plan';

  return {
    id: boutique.id,
    businessName: boutique.name ?? '',
    ownerName: boutique.owner_name ?? '',
    address: boutique.address ?? '',
    phone: boutique.phone_number ?? '',
    whatsappNumber: boutique.whatsapp_number ?? boutique.phone_number ?? '',
    logoUrl: boutique.logo_url ?? null,
    coverImageUrl: boutique.cover_image_url ?? null,
    tagline: boutique.store_tagline ?? '',
    description: boutique.description ?? '',
    openingTime: boutique.opening_time ?? '',
    closingTime: boutique.closing_time ?? '',
    workingDays: boutique.working_days ?? [],
    storeStatus: boutique.store_status ?? 'pending',
    memberId: boutique.member_id ?? '',
    planName,
    planRenewalDate: sub?.expires_at ?? null,
    memberSince: boutique.created_at ?? sub?.started_at ?? null,
    documents: (boutique.documents ?? []).map(mapBackendDocument),
    subscription: sub
      ? {
          id: sub.id,
          status: sub.status,
          billingCycle: sub.billing_cycle ?? 'monthly',
          planName,
          expiresAt: sub.expires_at ?? null,
        }
      : null,
  };
}

export function storeProfileToBusinessProfile(store: StoreProfile) {
  return {
    businessName: store.businessName,
    ownerName: store.ownerName,
    phone: store.phone.startsWith('+') ? store.phone : `+91 ${store.phone.replace(/\D/g, '').slice(-10)}`,
    address: store.address,
    taxId: store.documents.find((d) => d.type === 'gst')?.licenseNo ?? '',
    logoUri: store.logoUrl,
    coverUri: store.coverImageUrl,
    memberId: store.memberId,
    isVerified: store.storeStatus === 'approved',
    plan: store.planName,
  };
}
