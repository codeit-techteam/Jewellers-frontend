import { z } from 'zod';

const weightField = z
  .string()
  .refine((value) => {
    if (!value.trim()) return false;
    const parsed = Number(value);
    return !Number.isNaN(parsed) && parsed > 0;
  }, 'Enter a valid positive weight (grams)');

const weightFieldOptional = z
  .string()
  .refine((value) => {
    if (!value.trim()) return true;
    const parsed = Number(value);
    return !Number.isNaN(parsed) && parsed >= 0;
  }, 'Enter a valid weight (grams)');

const baseFields = {
  name: z.string().min(1, 'Product name is required').min(3, 'Minimum 3 characters'),
  categoryId: z.string().uuid('Select a category'),
  purity: z.string().optional(),
  makingChargesType: z.enum(['percentage', 'flat']),
  makingChargesValue: z
    .string()
    .min(1, 'Making charges value is required')
    .refine((value) => {
      const parsed = Number(value);
      return !Number.isNaN(parsed) && parsed >= 0;
    }, 'Enter a valid value'),
  // description replaces additionalDetails
  description: z.string().optional(),
  discountPercent: z
    .string()
    .optional()
    .refine((v) => {
      if (!v || !v.trim()) return true;
      const n = Number(v);
      return !Number.isNaN(n) && n >= 0 && n <= 100;
    }, 'Enter 0–100'),
};

export const inventoryProductStrictSchema = z.object({
  ...baseFields,
  weight: weightField,
});

/** Edit flow: weight optional for simple/onboarding products stored without weight. */
export const inventoryProductEditSchema = z.object({
  ...baseFields,
  weight: weightFieldOptional,
});

export const inventoryProductDraftSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  categoryId: z.string().optional(),
  weight: z.string().optional(),
  purity: z.string().optional(),
  makingChargesType: z.enum(['percentage', 'flat']),
  makingChargesValue: z.string().optional(),
  description: z.string().optional(),
  discountPercent: z.string().optional(),
});

export type InventoryFormValues = {
  name: string;
  categoryId: string;
  weight: string;
  purity?: string;
  makingChargesType: 'percentage' | 'flat';
  makingChargesValue: string;
  description: string;
  discountPercent: string;
};
