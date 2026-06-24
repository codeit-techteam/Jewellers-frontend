import type { AddProductForm, InventoryProduct, InventoryTrackEvent, MakingChargesType } from '@/types/inventory';
import { config } from '@constants/config';
import { resolveProductPrice } from '@utils/calculateProductPrice';
import { appendImagesToFormData } from '@utils/createFormData';
import { normalizeGenderValues, parseStringArrayField } from '@utils/productTagFields';
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

type BackendPriceBreakup = {
  gold?: number;
  gemstone?: number;
  makingCharge?: number;
  gst?: number;
  total?: number;
};

type BackendSpecifications = Record<string, string | number | null | undefined>;

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
  description?: string | null;
  specifications?: BackendSpecifications | null;
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
  /** Can be an array of URL strings (from products.images jsonb) or image objects. */
  images?: Array<BackendProductImage | string>;
  // ── enrichment fields ────────────────────────────────────────────────────
  gender?: string[] | string | null;
  occasion?: string[] | string | null;
  style?: string[] | string | null;
  collections?: string[] | null;
  collection_ids?: string[] | null;
  available_sizes?: string[] | null;
  available_metals?: string[] | null;
  discount_percentage?: number | null;
  price_breakup?: BackendPriceBreakup | null;
  collection_name?: string | null;
  video_url?: string | null;
  status?: string;
  is_trending?: boolean;
  trending?: boolean;
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

  const desc = bp.description ?? bp.additional_details ?? undefined;

  const pbRaw = bp.price_breakup;
  const priceBreakup = pbRaw
    ? {
        gold: Number(pbRaw.gold ?? 0),
        gemstone: Number(pbRaw.gemstone ?? 0),
        makingCharge: Number(pbRaw.makingCharge ?? 0),
        gst: Number(pbRaw.gst ?? 0),
        total: Number(pbRaw.total ?? 0),
      }
    : undefined;

  const specsRaw = bp.specifications;
  const specifications =
    specsRaw &&
    (specsRaw.carat || specsRaw.dimensions || specsRaw.certification || specsRaw.metal || specsRaw.weight)
      ? {
          metal: specsRaw.metal ? String(specsRaw.metal) : undefined,
          weight: specsRaw.weight ? String(specsRaw.weight) : undefined,
          carat: specsRaw.carat ? String(specsRaw.carat) : undefined,
          dimensions: specsRaw.dimensions ? String(specsRaw.dimensions) : undefined,
          certification: specsRaw.certification ? String(specsRaw.certification) : undefined,
        }
      : undefined;

  const genderArr = normalizeGenderValues(parseStringArrayField(bp.gender));
  const occasionArr = parseStringArrayField(bp.occasion);
  const styleArr = parseStringArrayField(bp.style);
  const collectionsArr =
    parseStringArrayField(bp.collections).length > 0
      ? parseStringArrayField(bp.collections)
      : bp.collection_name
        ? [bp.collection_name]
        : [];
  const collectionIdsArr = parseStringArrayField(bp.collection_ids);

  // Resolve display price: prefer price_breakup.total, then component sum,
  // then fall back to products.price (which can be stale on older records).
  const resolvedPrice = (() => {
    if (priceBreakup) {
      if (priceBreakup.total > 0) return priceBreakup.total;
      const sum =
        priceBreakup.gold + priceBreakup.gemstone + priceBreakup.makingCharge + priceBreakup.gst;
      if (sum > 0) return sum;
    }
    return bp.price ?? 0;
  })();

  return {
    id: bp.id,
    name: bp.name,
    sku: bp.sku ?? '',
    categoryId,
    category,
    price: resolvedPrice,
    weight: bp.weight ?? 0,
    purity: bp.purity ?? '',
    makingChargesType: (bp.making_charges_type as MakingChargesType) ?? 'percentage',
    makingChargesValue: bp.making_charges_value ?? 0,
    imageUri: imageUrls[0] ?? '',
    imageUris: imageUrls.length > 0 ? imageUrls : undefined,
    analytics: mapAnalytics(bp.product_analytics),
    isDraft: bp.is_draft ?? false,
    status: bp.status ?? (bp.is_draft ? 'draft' : 'active'),
    isTrending: bp.is_trending === true || bp.trending === true,
    createdAt: bp.created_at ?? new Date().toISOString(),
    additionalDetails: desc,
    description: desc,
    gender: genderArr.length > 0 ? genderArr : undefined,
    occasion: occasionArr.length > 0 ? occasionArr : undefined,
    style: styleArr.length > 0 ? styleArr : undefined,
    collections: collectionsArr.length > 0 ? collectionsArr : undefined,
    collectionIds: collectionIdsArr.length > 0 ? collectionIdsArr : undefined,
    availableSizes: bp.available_sizes ?? undefined,
    availableMetals: bp.available_metals ?? undefined,
    discountPercent: bp.discount_percentage ?? undefined,
    priceBreakup,
    specifications,
    collectionName: collectionsArr[0] ?? bp.collection_name ?? undefined,
    videoUrl: bp.video_url ?? undefined,
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

/**
 * Upload a short product video using native fetch + FormData.
 * Backend: POST /products/:id/video — accepts video/mp4 (max 50MB).
 */
export async function uploadProductVideo(productId: string, videoUri: string): Promise<void> {
  const formData = new FormData();
  formData.append('video', {
    uri: videoUri,
    type: 'video/mp4',
    name: `product_video_${Date.now()}.mp4`,
  } as unknown as Blob);

  const token = await SecureStore.getItemAsync('auth_token');

  const response = await fetch(`${config.apiUrl}/products/${productId}/video`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });

  if (!response.ok) {
    let message = 'Failed to upload video';
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
  const price = resolveProductPrice(
    data.weight,
    data.makingChargesType,
    data.makingChargesValue,
    data.priceBreakup,
  );
  return {
    name: data.name,
    categoryId: data.categoryId,
    price,
    weight: data.weight,
    purity: data.purity,
    makingChargesType: data.makingChargesType,
    makingChargesValue: data.makingChargesValue,
    description: data.description ?? data.additionalDetails,
    isDraft,
    gender: data.gender?.length ? data.gender : undefined,
    occasion: data.occasion?.length ? data.occasion : undefined,
    style: data.style?.length ? data.style : undefined,
    collectionIds: data.collectionIds ?? [],
    availableSizes: data.availableSizes,
    availableMetals: data.availableMetals,
    discountPercent: data.discountPercent,
    priceBreakup: data.priceBreakup,
    specifications: data.specifications,
    collectionName: data.collections?.[0] ?? data.collectionName,
  };
}

async function createProduct(data: AddProductForm, isDraft: boolean): Promise<InventoryProduct> {
  const { data: created } = await api.post<BackendProduct>('/products', buildCreateBody(data, isDraft));
  const localUris = getLocalImageUris(data);
  if (localUris.length > 0) {
    await uploadImages(created.id, localUris);
  }
  // Upload video if a local URI was provided
  if (data.videoUri && !data.videoUri.startsWith('http')) {
    await uploadProductVideo(created.id, data.videoUri);
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
 */
export async function saveSimpleProduct(data: {
  name: string;
  categoryId: string;
  price: number;
  imageUri: string;
  imageFileName?: string;
}): Promise<InventoryProduct> {
  const { data: created } = await api.post<BackendProduct>('/products', {
    name: data.name,
    categoryId: data.categoryId,
    price: data.price,
    isDraft: false,
  });

  if (data.imageUri) {
    const names = data.imageFileName ? [data.imageFileName] : undefined;
    await uploadImages(created.id, [data.imageUri], names);
  }

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
  if (data.description !== undefined) body.description = data.description;
  if (data.additionalDetails !== undefined && body.description === undefined) {
    body.description = data.additionalDetails;
  }
  if (data.isDraft !== undefined) body.isDraft = data.isDraft;
  if (data.price !== undefined) body.price = data.price;
  // ── enrichment fields ──────────────────────────────────────────────────────
  if (data.gender !== undefined) body.gender = data.gender?.length ? data.gender : [];
  if (data.occasion !== undefined) body.occasion = data.occasion?.length ? data.occasion : [];
  if (data.style !== undefined) body.style = data.style?.length ? data.style : [];
  if (data.collectionIds !== undefined) body.collectionIds = data.collectionIds;
  if (data.availableSizes !== undefined) body.availableSizes = data.availableSizes;
  if (data.availableMetals !== undefined) body.availableMetals = data.availableMetals;
  if (data.discountPercent !== undefined) body.discountPercent = data.discountPercent;
  if (data.priceBreakup !== undefined) {
    body.priceBreakup = data.priceBreakup;
    // Keep products.price in sync with the price breakup so listing cards and
    // detail pages always display the same amount.
    if (body.price === undefined) {
      const resolvedPrice = resolveProductPrice(
        data.weight ?? 0,
        data.makingChargesType ?? 'percentage',
        data.makingChargesValue ?? 0,
        data.priceBreakup ?? undefined,
      );
      if (resolvedPrice > 0) body.price = resolvedPrice;
    }
  }
  if (data.specifications !== undefined) body.specifications = data.specifications;
  if (data.collectionName !== undefined && data.collectionIds === undefined) {
    body.collectionName = data.collectionName || null;
  }

  try {
    const { data: updated } = await api.put<BackendProduct>(`/products/${id}`, body);

    const allUris = [...(data.imageUris ?? []), ...(data.imageUri ? [data.imageUri] : [])];
    const localUris = allUris.filter((u) => u && !u.startsWith('http'));
    const hasNewVideo = data.videoUri && !data.videoUri.startsWith('http');

    if (localUris.length > 0 || hasNewVideo) {
      if (localUris.length > 0) await uploadImages(id, localUris);
      if (hasNewVideo) await uploadProductVideo(id, data.videoUri!);
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
export async function trackEvent(
  productId: string,
  eventType: InventoryTrackEvent,
  options?: { source?: 'marketplace' | 'partner_preview' },
): Promise<void> {
  const { getVisitorId } = await import('@lib/visitorId');
  const visitorId = await getVisitorId();
  const source = options?.source ?? 'partner_preview';

  void api
    .post(`/products/${productId}/track`, {
      eventType,
      userId: null,
      visitorId,
      source,
    })
    .catch(() => undefined);
}
