export const MIN_PRODUCTS_REQUIRED = 5;

export const PRODUCT_UPLOAD_BENEFITS = [
  'Customers can explore your collection',
  'Products increase trust and conversions',
  'Minimum 5 listings required to go live',
] as const;

export const REVIEW_TIMELINE_STEPS = [
  {
    id: 'business',
    title: 'Business Information Submitted',
    subtitle: 'Verified on Oct 24',
    status: 'completed' as const,
  },
  {
    id: 'gst',
    title: 'GST Certificate Verified',
    subtitle: 'Government database matched',
    status: 'completed' as const,
  },
  {
    id: 'bis',
    title: 'BIS Hallmark Uploaded',
    subtitle: 'Authenticity verified',
    status: 'completed' as const,
  },
] as const;
