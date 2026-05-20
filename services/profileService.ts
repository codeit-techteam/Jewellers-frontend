import type { BusinessDocument, BusinessProfile } from '@/types/profile';

import { api, ApiError } from './api';

export const USE_MOCK = true;

const delay = (ms: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

export async function updateBusinessProfile(data: Partial<BusinessProfile>): Promise<BusinessProfile> {
  if (USE_MOCK) {
    await delay(1000);
    return data as BusinessProfile;
  }

  try {
    const { data: response } = await api.put<BusinessProfile>('/profile/business', data);
    return response;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError('Failed to update business profile');
  }
}

export async function uploadDocument(
  type: string,
  fileUri: string,
): Promise<{ status: 'pending'; fileUri: string }> {
  if (USE_MOCK) {
    await delay(800);
    return { status: 'pending', fileUri };
  }

  try {
    const formData = new FormData();
    formData.append('type', type);
    formData.append('file', {
      uri: fileUri,
      type: 'application/pdf',
      name: 'document.pdf',
    } as unknown as Blob);

    const { data } = await api.post<{ status: 'pending'; fileUri: string }>(
      '/profile/documents',
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    );
    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError('Failed to upload document');
  }
}
