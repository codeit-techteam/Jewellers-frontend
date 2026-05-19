import type {
  BrandingResponse,
  BusinessInfoResponse,
  Step1Data,
  Step4Data,
  UploadDocumentResponse,
} from '@/types/onboarding';

import { api, ApiError } from './api';

export const USE_MOCK = true;

const delay = (ms: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

export async function submitBusinessInfo(data: Step1Data): Promise<BusinessInfoResponse> {
  if (USE_MOCK) {
    await delay(800);
    return { success: true, message: 'Business info saved' };
  }

  try {
    const { data: response } = await api.post<BusinessInfoResponse>('/onboarding/business-info', data);
    return response;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError('Failed to save business information');
  }
}

export async function uploadGSTCertificate(fileUri: string): Promise<UploadDocumentResponse> {
  if (USE_MOCK) {
    await delay(800);
    return {
      success: true,
      fileUrl: fileUri || 'mock://gst-certificate',
      message: 'GST certificate uploaded',
    };
  }

  try {
    const formData = new FormData();
    formData.append('file', {
      uri: fileUri,
      type: 'application/pdf',
      name: 'gst-certificate.pdf',
    } as unknown as Blob);

    const { data } = await api.post<UploadDocumentResponse>('/onboarding/gst', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError('Failed to upload GST certificate');
  }
}

export async function uploadBISCertificate(fileUri: string): Promise<UploadDocumentResponse> {
  if (USE_MOCK) {
    await delay(800);
    return {
      success: true,
      fileUrl: fileUri || 'mock://bis-certificate',
      message: 'BIS certificate uploaded',
    };
  }

  try {
    const formData = new FormData();
    formData.append('file', {
      uri: fileUri,
      type: 'application/pdf',
      name: 'bis-certificate.pdf',
    } as unknown as Blob);

    const { data } = await api.post<UploadDocumentResponse>('/onboarding/bis', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError('Failed to upload BIS certificate');
  }
}

export async function completeFreeOnboarding(): Promise<BrandingResponse> {
  if (USE_MOCK) {
    await delay(800);
    return { success: true, message: 'Free onboarding completed' };
  }

  try {
    const { data: response } = await api.post<BrandingResponse>('/onboarding/complete-free');
    return response;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError('Failed to complete onboarding');
  }
}

export async function submitBranding(data: Step4Data): Promise<BrandingResponse> {
  if (USE_MOCK) {
    await delay(800);
    return { success: true, message: 'Branding saved' };
  }

  try {
    const formData = new FormData();
    formData.append('tagline', data.tagline);
    if (data.logoUri) {
      formData.append('logo', {
        uri: data.logoUri,
        type: 'image/jpeg',
        name: 'store-logo.jpg',
      } as unknown as Blob);
    }

    const { data: response } = await api.post<BrandingResponse>('/onboarding/branding', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError('Failed to save branding');
  }
}
