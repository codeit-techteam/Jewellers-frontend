import { z } from 'zod';

export const inventoryProductStrictSchema = z.object({
  name: z.string().min(1, 'Product name is required').min(3, 'Minimum 3 characters'),
  category: z.string().min(1, 'Select a category'),
  weight: z
    .string()
    .min(1, 'Weight is required')
    .refine((value) => {
      const parsed = Number(value);
      return !Number.isNaN(parsed) && parsed > 0;
    }, 'Enter a valid positive weight'),
  purity: z.string().min(1, 'Select purity'),
  makingChargesType: z.enum(['percentage', 'flat']),
  makingChargesValue: z
    .string()
    .min(1, 'Making charges value is required')
    .refine((value) => {
      const parsed = Number(value);
      return !Number.isNaN(parsed) && parsed >= 0;
    }, 'Enter a valid value'),
  additionalDetails: z.string().optional(),
});

export const inventoryProductDraftSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  category: z.string().optional(),
  weight: z.string().optional(),
  purity: z.string().optional(),
  makingChargesType: z.enum(['percentage', 'flat']),
  makingChargesValue: z.string().optional(),
  additionalDetails: z.string().optional(),
});

export type InventoryFormValues = {
  name: string;
  category: string;
  weight: string;
  purity: string;
  makingChargesType: 'percentage' | 'flat';
  makingChargesValue: string;
  additionalDetails: string;
};
