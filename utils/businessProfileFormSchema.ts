import { z } from 'zod';

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
  address: z.string().min(1, 'Address is required').min(10, 'Minimum 10 characters'),
  taxId: z.string().min(1, 'Tax/GST ID is required'),
});

export type BusinessProfileFormValues = z.infer<typeof businessProfileSchema>;
