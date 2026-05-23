export const inventoryQueryKeys = {
  all: ['products'] as const,
  list: (category: string) => ['products', category] as const,
  detail: (id: string) => ['product', id] as const,
};
