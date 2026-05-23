import type { AddProductForm, InventoryProduct, InventoryTrackEvent, MakingChargesType } from '@/types/inventory';
import { config } from '@constants/config';
import { calculateProductPrice } from '@utils/calculateProductPrice';
import { appendImagesToFormData } from '@utils/createFormData';
import * as SecureStore from 'expo-secure-store';

import { api, ApiError } from './api';

type BackendProductImage = {
  image_url?: string;
  url?: string;
};

type BackendCategoryJoin = {
  id: string;
  name: string;
  slug?: string | null;
};

type BackendProduct = {
  id: string;
  name: string;
  sku?: string;
  category_id?: string | null;
  categories?: BackendCategoryJoin | BackendCategoryJoin[] | null;
  /** Legacy — specifications.category from older products */
  category?: string;
  price?: number;
  weight?: number;
  purity?: string;
  making_charges_type?: string;
  making_charges_value?: number;
  is_draft?: boolean;
  created_at?: string;
  additional_details?: string | null;
  /** Category text is stored here when there is no dedicated TEXT column. */
  specifications?: { category?: string } | null;
  product_analytics?:
    | {
        views?: number;
        wishlist?: number;
        wishlist_count?: number;
        inquiry?: number;
        inquiry_count?: number;
        wa_clicks?: number;
      }
    | Array<{
        views?: number;
        wishlist?: number;
        wishlist_count?: number;
        inquiry?: number;
        inquiry_count?: number;
        wa_clicks?: number;
      }>;
  product_images?: Array<{ image_url?: string; url?: string; is_primary?: boolean }>;
  /** Can be an array of URL strings (from products.images jsonb) or image objects (from product_images join). */
  images?: Array<BackendProductImage | string>;
};

function mapAnalytics(
  raw: BackendProduct['product_analytics'],
): InventoryProduct['analytics'] {
  const row = Array.isArray(raw) ? raw[0] : raw;
  return {
    views: row?.views ?? 0,
    wishlist: row?.wishlist_count ?? row?.wishlist ?? 0,
    inquiry: row?.inquiry_count ?? row?.inquiry ?? 0,
    waClicks: row?.wa_clicks ?? 0,
  };
}

function mapProduct(bp: BackendProduct): InventoryProduct {
  const fromJoin = (bp.product_images ?? [])
    .map((img) => img.image_url ?? img.url ?? '')
    .filter(Boolean);

  const imageUrls =
    fromJoin.length > 0
      ? fromJoin
      : (bp.images ?? [])
          .map((img: BackendProductImage | string) => {
            if (typeof img === 'string') return img;
            return img.image_url ?? img.url ?? '';
          })
          .filter(Boolean);

  const joined = Array.isArray(bp.categories) ? bp.categories[0] : bp.categories;
  const categoryId = joined?.id ?? bp.category_id ?? '';
  const category =
    joined?.name ??
    (bp.specifications as { category?: string } | null)?.category ??
    bp.category ??
    '';

  return {
    id: bp.id,
    name: bp.name,
    sku: bp.sku ?? '',
    categoryId,
    category,
    price: bp.price ?? 0,
    weight: bp.weight ?? 0,
    purity: bp.purity ?? '',
    makingChargesType: (bp.making_charges_type as MakingChargesType) ?? 'percentage',
    makingChargesValue: bp.making_charges_value ?? 0,
    imageUri: imageUrls[0] ?? '',
    imageUris: imageUrls.length > 0 ? imageUrls : undefined,
    analytics: mapAnalytics(bp.product_analytics),
    isDraft: bp.is_draft ?? false,
    createdAt: bp.created_at ?? new Date().toISOString(),
    additionalDetails: bp.additional_details ?? undefined,
  };
}

export type GetProductsFilters = {
  category?: string;
  is_draft?: boolean;
  status?: string;
};

export async function getProducts(filters?: GetProductsFilters): Promise<InventoryProduct[]> {
  try {
    const params: Record<string, string> = {};
    if (filters?.category) params.category = filters.category;
    if (filters?.is_draft !== undefined) params.is_draft = String(filters.is_draft);
    if (filters?.status) params.status = filters.status;

    const { data } = await api.get<BackendProduct[]>('/products', { params });
    return (Array.isArray(data) ? data : []).map(mapProduct);
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError('Failed to load products');
  }
}

export async function getProduct(id: string): Promise<InventoryProduct> {
  try {
    const { data } = await api.get<BackendProduct>(`/products/${id}`);
    return mapProduct(data);
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError('Failed to load product');
  }
}

/**
 * Upload product images using native fetch instead of axios.
 * React Native's fetch correctly sets multipart/form-data with boundary;
 * axios does not reliably do this in the RN environment.
 */
export async function uploadImages(
  productId: string,
  imageUris: string[],
  fileNames?: string[],
): Promise<void> {
  const formData = new FormData();
  appendImagesToFormData(formData, 'images', imageUris, fileNames);

  const token = await SecureStore.getItemAsync('auth_token');

  const response = await fetch(`${config.apiUrl}/products/${productId}/images`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });

  if (!response.ok) {
    let message = 'Failed to upload images';
    try {
      const json = (await response.json()) as { message?: string; data?: { message?: string } };
      message = json?.data?.message ?? json?.message ?? message;
    } catch {
      // non-JSON response body
    }
    throw new ApiError(message, response.status);
  }
}

function getLocalImageUris(data: AddProductForm): string[] {
  const uris: string[] = [];
  if (data.imageUris?.length) {
    uris.push(...data.imageUris.filter((u) => !u.startsWith('http')));
  } else if (data.imageUri && !data.imageUri.startsWith('http')) {
    uris.push(data.imageUri);
  }
  return uris;
}

function buildCreateBody(data: AddProductForm, isDraft: boolean) {
  const price = calculateProductPrice(data.weight, data.makingChargesType, data.makingChargesValue);
  return {
    name: data.name,
    categoryId: data.categoryId,
    price,
    weight: data.weight,
    purity: data.purity,
    makingChargesType: data.makingChargesType,
    makingChargesValue: data.makingChargesValue,
    description: data.additionalDetails,
    isDraft,
  };
}

async function createProduct(data: AddProductForm, isDraft: boolean): Promise<InventoryProduct> {
  const { data: created } = await api.post<BackendProduct>('/products', buildCreateBody(data, isDraft));
  const localUris = getLocalImageUris(data);
  if (localUris.length > 0) {
    // Use native fetch for reliable multipart uploads in React Native
    await uploadImages(created.id, localUris);
  }
  const { data: full } = await api.get<BackendProduct>(`/products/${created.id}`);
  return mapProduct(full);
}

export async function addProduct(data: AddProductForm): Promise<InventoryProduct> {
  try {
    return await createProduct(data, false);
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError('Failed to add product');
  }
}

export async function saveDraftProduct(data: AddProductForm): Promise<InventoryProduct> {
  try {
    return await createProduct(data, true);
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError('Failed to save draft');
  }
}

/**
 * Simplified product save for the onboarding step5 form.
 * Only requires name, category, price, and a single local image URI.
 * Weight and purity are optional and default to null on the backend.
 */
export async function saveSimpleProduct(data: {
  name: string;
  categoryId: string;
  price: number;
  imageUri: string;
  imageFileName?: string;
}): Promise<InventoryProduct> {
  // Step 1 — create the product record (JSON, no FormData)
  const { data: created } = await api.post<BackendProduct>('/products', {
    name: data.name,
    categoryId: data.categoryId,
    price: data.price,
    isDraft: false,
  });

  // Step 2 — upload the image via native fetch (reliable multipart in RN)
  if (data.imageUri) {
    const names = data.imageFileName ? [data.imageFileName] : undefined;
    await uploadImages(created.id, [data.imageUri], names);
  }

  // Step 3 — re-fetch the full product so images are resolved to public URLs
  const { data: full } = await api.get<BackendProduct>(`/products/${created.id}`);
  return mapProduct(full);
}

export async function updateProductApi(
  id: string,
  data: Partial<InventoryProduct>,
): Promise<InventoryProduct> {
  const body: Record<string, unknown> = {};
  if (data.name !== undefined) body.name = data.name;
  if (data.categoryId !== undefined && data.categoryId) body.categoryId = data.categoryId;
  if (data.weight !== undefined) body.weight = data.weight > 0 ? data.weight : null;
  if (data.purity !== undefined) body.purity = data.purity;
  if (data.makingChargesType !== undefined) body.makingChargesType = data.makingChargesType;
  if (data.makingChargesValue !== undefined) body.makingChargesValue = data.makingChargesValue;
  if (data.additionalDetails !== undefined) body.description = data.additionalDetails;
  if (data.isDraft !== undefined) body.isDraft = data.isDraft;
  if (data.price !== undefined) body.price = data.price;

  try {
    const { data: updated } = await api.put<BackendProduct>(`/products/${id}`, body);

    const allUris = [...(data.imageUris ?? []), ...(data.imageUri ? [data.imageUri] : [])];
    const localUris = allUris.filter((u) => u && !u.startsWith('http'));
    if (localUris.length > 0) {
      await uploadImages(id, localUris);
      const { data: full } = await api.get<BackendProduct>(`/products/${id}`);
      return mapProduct(full);
    }

    return mapProduct(updated);
  } catch (error) {
    if (error instanceof ApiError) throw error;
    const msg = error instanceof Error ? error.message : 'Failed to update product';
    throw new ApiError(msg);
  }
}

export async function removeProductApi(id: string): Promise<void> {
  try {
    await api.delete(`/products/${id}`);
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError('Failed to remove product');
  }
}

// Fire and forget — no await, tracking failures never surface to the user.
export function trackEvent(productId: string, eventType: InventoryTrackEvent): void {
  void api
    .post(`/products/${productId}/track`, { eventType, userId: null })
    .catch(() => undefined);
}
