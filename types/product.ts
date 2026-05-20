export const PRODUCT_CATEGORIES = [
  'Gold',
  'Diamond',
  'Silver',
  'Platinum',
  'Pearl',
  'Other',
] as const;

export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];

export type Product = {
  id: string;
  name: string;
  category: ProductCategory;
  price: number;
  imageUri: string;
};

export type ProductSubmitResponse = {
  success: boolean;
  message: string;
};

export type DraftSaveResponse = {
  success: boolean;
};

export type StoreStatus = 'review' | 'approved' | 'rejected';

export type StoreStatusResponse = {
  status: StoreStatus;
  message: string;
};
