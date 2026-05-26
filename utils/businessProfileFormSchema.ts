import { z } from 'zod';

const timeField = z
  .string()
  .optional()
  .refine((v) => !v || !v.trim() || /^\d{1,2}:\d{2}$/.test(v.trim()), 'Use HH:MM format (e.g. 10:00)');

export const businessProfileSchema = z.object({
  businessName: z.string().min(1, 'Business name is required').min(3, 'Minimum 3 characters'),
  ownerName: z.string().min(1, 'Owner name is required').min(2, 'Minimum 2 characters'),
  phone: z
    .string()
    .min(1, 'Phone is required')
    .refine((value) => {
      const digits = value.replace(/\D/g, '');
      return digits.length === 10 || (digits.length === 12 && digits.startsWith('91'));
    }, 'Enter a valid 10-digit number'),
  whatsappNumber: z
    .string()
    .optional()
    .refine((value) => {
      if (!value || !value.trim()) return true;
      const digits = value.replace(/\D/g, '');
      return digits.length === 10 || (digits.length === 12 && digits.startsWith('91'));
    }, 'Enter a valid 10-digit number'),
  address: z.string().min(1, 'Address is required').min(10, 'Minimum 10 characters'),
  taxId: z.string().min(1, 'Tax/GST ID is required'),
  description: z.string().max(200, 'Max 200 characters').optional(),
  locality: z.string().optional(),
  openingTime: timeField,
  closingTime: timeField,
});

export type BusinessProfileFormValues = z.infer<typeof businessProfileSchema>;
