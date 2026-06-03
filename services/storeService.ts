import type { BusinessDocumentType } from '@/types/profile';
import type { StoreStatusResponse } from '@/types/product';
import type { BackendStore, StoreProfile, UpdateStoreData } from '@/types/store';
import { mapBackendDocument, mapBackendStore } from '@/types/store';
import { createFileFormData, getMimeType } from '@utils/createFormData';

import { api, ApiError } from './api';

export type { StoreProfile, UpdateStoreData };

function fileNameFromUri(uri: string, fallback: string): string {
  const segment = uri.split('/').pop();
  return segment && segment.includes('.') ? segment : fallback;
}

function toSnakeUpdateBody(data: UpdateStoreData): Record<string, unknown> {
  const body: Record<string, unknown> = {};
  if (data.description !== undefined) body.description = data.description;
  if (data.locality !== undefined) body.locality = data.locality;
  if (data.phoneNumber !== undefined) body.phone_number = data.phoneNumber;
  if (data.whatsappNumber !== undefined) body.whatsapp_number = data.whatsappNumber;
  if (data.openingTime !== undefined) body.opening_time = data.openingTime;
  if (data.closingTime !== undefined) body.closing_time = data.closingTime;
  if (data.workingDays !== undefined) body.working_days = data.workingDays;
  if (data.name !== undefined) body.name = data.name;
  if (data.address !== undefined) body.address = data.address;
  if (data.storeTagline !== undefined) body.store_tagline = data.storeTagline;
  if (data.latitude !== undefined) body.latitude = data.latitude;
  if (data.longitude !== undefined) body.longitude = data.longitude;
  return body;
}

export async function getStore(): Promise<StoreProfile> {
  try {
    const { data } = await api.get<BackendStore>('/store');
    return mapBackendStore(data);
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError('Failed to load store');
  }
}

export async function updateStore(data: UpdateStoreData): Promise<StoreProfile> {
  try {
    const body = toSnakeUpdateBody(data);
    await api.put<BackendStore>('/store', body);
    return getStore();
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError('Failed to update store');
  }
}

export async function updateLogo(fileUri: string): Promise<string> {
  try {
    const fileName = fileNameFromUri(fileUri, 'logo.jpg');
    const formData = createFileFormData('logo', fileUri, fileName, getMimeType(fileName));
    const { data } = await api.put<{ logoUrl?: string; logo_url?: string }>('/store/logo', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data.logoUrl ?? data.logo_url ?? fileUri;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError('Failed to upload logo');
  }
}

export async function updateCover(fileUri: string): Promise<string> {
  try {
    const fileName = fileNameFromUri(fileUri, 'cover.jpg');
    const formData = createFileFormData('cover', fileUri, fileName, getMimeType(fileName));
    const { data } = await api.put<{ coverImageUrl?: string; cover_image_url?: string }>(
      '/store/cover',
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    );
    return data.coverImageUrl ?? data.cover_image_url ?? fileUri;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError('Failed to upload cover');
  }
}

export async function getDocuments() {
  try {
    const { data } = await api.get<Parameters<typeof mapBackendDocument>[0][]>('/store/documents');
    return (Array.isArray(data) ? data : []).map(mapBackendDocument);
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError('Failed to load documents');
  }
}

export async function uploadDocument(
  type: BusinessDocumentType,
  fileUri: string,
  licenseNo?: string,
) {
  try {
    const fileName = fileNameFromUri(fileUri, 'document.pdf');
    const mime = getMimeType(fileName);
    const formData = new FormData();
    formData.append('type', type);
    if (licenseNo) formData.append('licenseNo', licenseNo);
    formData.append('document', {
      uri: fileUri,
      name: fileName,
      type: mime,
    } as unknown as Blob);

    const { data } = await api.post<Parameters<typeof mapBackendDocument>[0]>(
      '/store/documents',
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    );
    return mapBackendDocument(data);
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError('Failed to upload document');
  }
}

export async function replaceDocument(docId: string, fileUri: string) {
  try {
    const fileName = fileNameFromUri(fileUri, 'document.pdf');
    const formData = createFileFormData('document', fileUri, fileName, getMimeType(fileName));
    const { data } = await api.put<Parameters<typeof mapBackendDocument>[0]>(
      `/store/documents/${docId}`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    );
    return mapBackendDocument(data);
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError('Failed to replace document');
  }
}

/** Used by review flow — derives status from full store profile. */
export async function checkStoreStatus(): Promise<StoreStatusResponse> {
  try {
    const store = await getStore();
    const status = store.storeStatus;
    const message =
      status === 'approved'
        ? 'Your store has been approved'
        : status === 'rejected'
          ? 'Your store application was rejected'
          : 'Your store is under administrative review';
    const normalized =
      status === 'approved' || status === 'rejected' || status === 'review'
        ? status
        : 'review';
    return { status: normalized, message };
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError('Failed to check store status');
  }
}
