export type Step1Data = {
  businessName: string;
  ownerName: string;
  contactNumber: string;
  businessAddress: string;
};

export type Step2Data = {
  fileUri: string;
  fileName: string;
  fileSize: string;
};

export type Step3Data = {
  fileUri: string;
  fileName: string;
  fileSize: string;
};

export type Step4Data = {
  logoUri: string | null;
  coverImageUri: string | null;
  tagline: string;
};

export type OnboardingState = {
  step1: Step1Data | null;
  step2: Step2Data | null;
  step3: Step3Data | null;
  step4: Step4Data | null;
};

export type BusinessInfoResponse = {
  success: boolean;
  message: string;
};

export type UploadDocumentResponse = {
  success: boolean;
  fileUrl: string;
  message: string;
};

export type BrandingResponse = {
  success: boolean;
  message: string;
};
