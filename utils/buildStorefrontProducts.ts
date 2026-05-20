import { MOCK_STOREFRONT_FILLER_PRODUCTS } from '@/constants/storeApp';
import type { Product } from '@/types/product';

const MIN_STOREFRONT_PRODUCTS = 4;

export function buildStorefrontProducts(products: Product[]): Product[] {
  if (products.length >= MIN_STOREFRONT_PRODUCTS) {
    return products;
  }

  const merged: Product[] = [...products];
  let fillerIndex = 0;

  while (merged.length < MIN_STOREFRONT_PRODUCTS && fillerIndex < MOCK_STOREFRONT_FILLER_PRODUCTS.length) {
    const filler = MOCK_STOREFRONT_FILLER_PRODUCTS[fillerIndex];
    fillerIndex += 1;
    merged.push({
      id: `mock-storefront-${fillerIndex}`,
      name: filler.name,
      category: filler.category,
      price: filler.price,
      imageUri: filler.imageUri,
    });
  }

  return merged;
}
