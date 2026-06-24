import type { MakingChargesType, PriceBreakup } from '@/types/inventory';

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

/** Prefer explicit price breakup total over weight-based estimate. */
export function resolveProductPrice(
  weight: number,
  makingChargesType: MakingChargesType,
  makingChargesValue: number,
  priceBreakup?: PriceBreakup | null,
): number {
  if (priceBreakup) {
    const total = Number(priceBreakup.total);
    if (Number.isFinite(total) && total > 0) return Math.round(total);
    const sum =
      (Number(priceBreakup.gold) || 0) +
      (Number(priceBreakup.gemstone) || 0) +
      (Number(priceBreakup.makingCharge) || 0) +
      (Number(priceBreakup.gst) || 0);
    if (sum > 0) return Math.round(sum);
  }
  return calculateProductPrice(weight, makingChargesType, makingChargesValue);
}

export function generateProductSku(category: string): string {
  const prefix = category.slice(0, 2).toUpperCase() || 'PR';
  return `${prefix}-${Date.now()}`;
}
