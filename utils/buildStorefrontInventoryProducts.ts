import { MOCK_STOREFRONT_FILLER_PRODUCTS } from '@constants/storeApp';
import type { InventoryProduct } from '@/types/inventory';

const MIN_DISPLAY = 4;

export type StorefrontDisplayProduct = {
  id: string;
  name: string;
  price: number;
  imageUri: string;
  category: string;
};

export function buildStorefrontInventoryProducts(
  products: InventoryProduct[],
): StorefrontDisplayProduct[] {
  const active = products
    .filter((product) => !product.isDraft)
    .map((product) => ({
      id: product.id,
      name: product.name,
      price: product.price,
      imageUri: product.imageUri,
      category: product.category,
    }));

  if (active.length >= MIN_DISPLAY) {
    return active;
  }

  const merged: StorefrontDisplayProduct[] = [...active];
  let fillerIndex = 0;

  while (merged.length < MIN_DISPLAY && fillerIndex < MOCK_STOREFRONT_FILLER_PRODUCTS.length) {
    const filler = MOCK_STOREFRONT_FILLER_PRODUCTS[fillerIndex];
    fillerIndex += 1;
    merged.push({
      id: `mock-sf-${fillerIndex}`,
      name: filler.name,
      price: filler.price,
      imageUri: filler.imageUri,
      category: filler.category,
    });
  }

  return merged;
}
