export type DocumentStatus = 'verified' | 'pending' | 'expiring' | 'expired';

export type BusinessDocumentType = 'gst' | 'bis' | 'trade' | 'pan' | 'other';

export type BusinessDocument = {
  id: string;
  name: string;
  type: BusinessDocumentType;
  status: DocumentStatus;
  updatedAt: string;
  licenseNo?: string;
  fileUri?: string;
};

export type BusinessProfile = {
  businessName: string;
  ownerName: string;
  phone: string;
  address: string;
  taxId: string;
  logoUri: string | null;
  memberId: string;
  isVerified: boolean;
  plan: string;
};
