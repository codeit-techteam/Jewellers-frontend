export type Product = {
  id: string;
  name: string;
  categoryId?: string;
  category: string;
  price: number;
  imageUri: string;
};

export type ProductSubmitResponse = {
  success: boolean;
  message: string;
};


export type StoreStatus = 'review' | 'approved' | 'rejected';

export type StoreStatusResponse = {
  status: StoreStatus;
  message: string;
};
