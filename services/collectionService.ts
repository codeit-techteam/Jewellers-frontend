import type { ProductCollection } from '@/types/collection';

import { api, ApiError } from './api';

type BackendCollection = {
  id: string;
  title: string;
  subtitle?: string | null;
  slug?: string | null;
  sort_order: number;
};

function mapCollection(row: BackendCollection): ProductCollection {
  return {
    id: row.id,
    title: row.title,
    subtitle: row.subtitle ?? null,
    slug: row.slug ?? null,
    sortOrder: row.sort_order,
  };
}

export async function getCollections(): Promise<ProductCollection[]> {
  try {
    const { data } = await api.get<BackendCollection[]>('/collections');
    return (Array.isArray(data) ? data : []).map(mapCollection);
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError('Failed to load collections');
  }
}
