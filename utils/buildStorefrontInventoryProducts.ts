import type { InventoryProduct } from '@/types/inventory';

export type StorefrontDisplayProduct = {
  id: string;
  name: string;
  price: number;
  imageUri: string;
  categoryId?: string;
  category: string;
};

/** Maps live inventory to storefront cards — no mock/filler products. */
export function buildStorefrontInventoryProducts(
  products: InventoryProduct[],
): StorefrontDisplayProduct[] {
  return products
    .filter((product) => !product.isDraft && product.status !== 'draft')
    .map((product) => ({
      id: product.id,
      name: product.name,
      price: product.price,
      imageUri: product.imageUri,
      categoryId: product.categoryId,
      category: product.category,
    }));
}
