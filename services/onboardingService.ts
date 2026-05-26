import type { BrandingResponse, BusinessInfoResponse, Step4Data, UploadDocumentResponse } from '@/types/onboarding';
import type { BillingCycle } from '@/types/payment';
import type { Href } from 'expo-router';

import { createFileFormData, getMimeType } from '@utils/createFormData';
import { useOnboardingStore } from '@store/useOnboardingStore';
import { api, ApiError } from './api';

// ─── Resume route map ────────────────────────────────────────────────────────

const RESUME_ROUTE_MAP: Record<string, Href> = {
  step1: '/(onboarding)/step1-business-info',
  step2: '/(onboarding)/step2-gst',
  step3: '/(onboarding)/step3-bis',
  step4: '/(onboarding)/step4-branding',
  'step5-subscription': '/(onboarding)/step5-subscription',
  'step5-products': '/(onboarding)/step5-products',
  'step6-products': '/(onboarding)/step5-products',
  'review-pending': '/(onboarding)/review-pending',
  'store-live': '/(onboarding)/store-live',
  dashboard: '/(app)',
};

export async function getOnboardingResume(): Promise<Href> {
  try {
    const { data } = await api.get<{ route: string }>('/onboarding/resume');
    return RESUME_ROUTE_MAP[data.route] ?? '/(onboarding)/step1-business-info';
  } catch {
    return '/(onboarding)/step1-business-info';
  }
}

// ─── Status ──────────────────────────────────────────────────────────────────

export type OnboardingStatus = {
  onboardingStep: number;
  isOnboardingComplete: boolean;
  storeStatus: string;
};

export async function getStatus(): Promise<OnboardingStatus> {
  try {
    const { data } = await api.get<OnboardingStatus>('/onboarding/status');
    return data;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError('Failed to fetch onboarding status');
  }
}

// ─── Step 1 — Business Info ──────────────────────────────────────────────────

type Step1Body = {
  businessName: string;
  ownerName: string;
  contactNumber: string;
  businessAddress: string;
  locality?: string;
  latitude?: number;
  longitude?: number;
};

type Step1Response = {
  boutiqueId: string;
  memberId: string;
  onboardingStep: number;
};

export async function submitBusinessInfo(data: Step1Body): Promise<BusinessInfoResponse> {
  try {
    await api.post<Step1Response>('/onboarding/step1', data);
    useOnboardingStore.getState().setOnboardingStep(2);
    return { success: true, message: 'Business info saved' };
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError('Failed to save business information');
  }
}

// ─── Step 2 — GST Upload ─────────────────────────────────────────────────────

export async function uploadGSTCertificate(
  fileUri: string,
  fileName = 'gst-document.pdf',
): Promise<UploadDocumentResponse> {
  try {
    const formData = createFileFormData(
      'gstDocument',
      fileUri,
      fileName,
      getMimeType(fileName),
    );
    const { data } = await api.post<UploadDocumentResponse>('/onboarding/step2', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    useOnboardingStore.getState().setOnboardingStep(3);
    return data;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError('Failed to upload GST certificate');
  }
}

// ─── Step 3 — BIS Upload ─────────────────────────────────────────────────────

export async function uploadBISCertificate(
  fileUri: string,
  fileName = 'bis-document.pdf',
): Promise<UploadDocumentResponse> {
  try {
    const formData = createFileFormData(
      'bisDocument',
      fileUri,
      fileName,
      getMimeType(fileName),
    );
    const { data } = await api.post<UploadDocumentResponse>('/onboarding/step3', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    useOnboardingStore.getState().setOnboardingStep(4);
    return data;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError('Failed to upload BIS certificate');
  }
}

// ─── Step 4 — Branding ───────────────────────────────────────────────────────

export async function submitBranding(data: Step4Data): Promise<BrandingResponse> {
  try {
    const formData = new FormData();
    formData.append('tagline', data.tagline);

    if (data.logoUri) {
      formData.append('logo', {
        uri: data.logoUri,
        name: 'store-logo.jpg',
        type: 'image/jpeg',
      } as unknown as Blob);
    }

    if (data.coverImageUri) {
      formData.append('coverImage', {
        uri: data.coverImageUri,
        name: 'store-cover.jpg',
        type: 'image/jpeg',
      } as unknown as Blob);
    }

    const { data: response } = await api.post<BrandingResponse>('/onboarding/step4', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    useOnboardingStore.getState().setOnboardingStep(5);
    return response;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError('Failed to save branding');
  }
}

// ─── Step 5 — Subscription ───────────────────────────────────────────────────

export type ChooseSubscriptionResponse = {
  requiresPayment: boolean;
  subscriptionId?: string;
  amount?: number;
  onboardingStep: number;
};

export async function chooseSubscription(
  planId: string,
  billingCycle: BillingCycle,
): Promise<ChooseSubscriptionResponse> {
  try {
    const { data } = await api.post<ChooseSubscriptionResponse>(
      '/onboarding/step5-subscription',
      { planId, billingCycle },
    );
    return data;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError('Failed to choose subscription');
  }
}

// ─── Step 6 — Submit for Review ──────────────────────────────────────────────

export type SubmitForReviewResponse = {
  submitted: boolean;
  autoApproved?: boolean;
  productsCount: number;
  required: number;
  onboardingStep?: number;
};

export async function submitForReview(): Promise<SubmitForReviewResponse> {
  try {
    const { data } = await api.post<SubmitForReviewResponse>('/onboarding/step6-products');
    if (data.submitted) {
      if (data.autoApproved) {
        useOnboardingStore.getState().completeOnboarding();
      } else {
        useOnboardingStore.getState().setOnboardingStep(7);
        useOnboardingStore.getState().setStoreStatus('review');
      }
    }
    return data;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError('Failed to submit store for review');
  }
}
