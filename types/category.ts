export type ProductCategory = {
  id: string;
  name: string;
  slug: string | null;
  image?: string | null;
  subtitle?: string | null;
  sortOrder: number;
};
