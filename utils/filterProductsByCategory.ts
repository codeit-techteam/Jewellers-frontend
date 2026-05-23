export function matchesCategoryFilter(
  product: { category: string; categoryId?: string; name: string },
  selectedCategoryId: string,
): boolean {
  if (selectedCategoryId === 'All' || selectedCategoryId === 'All Collections') {
    return true;
  }

  if (product.categoryId && product.categoryId === selectedCategoryId) {
    return true;
  }

  const needle = selectedCategoryId.toLowerCase();
  return (
    product.category.toLowerCase() === needle ||
    product.name.toLowerCase().includes(needle)
  );
}
