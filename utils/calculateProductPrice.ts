import type { MakingChargesType } from '@/types/inventory';

const BASE_RATE_PER_GRAM = 7500;

export function calculateProductPrice(
  weight: number,
  makingChargesType: MakingChargesType,
  makingChargesValue: number,
): number {
  const base = weight * BASE_RATE_PER_GRAM;
  if (makingChargesType === 'percentage') {
    return Math.round(base * (1 + makingChargesValue / 100));
  }
  return Math.round(base + makingChargesValue);
}

export function generateProductSku(category: string): string {
  const prefix = category.slice(0, 2).toUpperCase() || 'PR';
  return `${prefix}-${Date.now()}`;
}
