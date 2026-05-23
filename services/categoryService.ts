import type { ProductCategory } from '@/types/category';

import { api, ApiError } from './api';

type BackendCategory = {
  id: string;
  name: string;
  slug: string | null;
  image?: string | null;
  subtitle?: string | null;
  sort_order: number;
};

function mapCategory(row: BackendCategory): ProductCategory {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    image: row.image,
    subtitle: row.subtitle,
    sortOrder: row.sort_order,
  };
}

export async function getCategories(): Promise<ProductCategory[]> {
  try {
    const { data } = await api.get<BackendCategory[]>('/categories');
    return (Array.isArray(data) ? data : []).map(mapCategory);
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError('Failed to load categories');
  }
}
