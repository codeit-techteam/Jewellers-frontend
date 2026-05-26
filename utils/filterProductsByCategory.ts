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

  const needle = selectedCategoryId.toLowerCase().trim();
  const productCategory = product.category.toLowerCase().trim();

  // Exact match
  if (productCategory === needle) return true;

  // Handle singular/plural variants (e.g. "ring" ↔ "rings", "necklace" ↔ "necklaces")
  const needleSingular = needle.endsWith('s') ? needle.slice(0, -1) : needle;
  const categorySingular = productCategory.endsWith('s') ? productCategory.slice(0, -1) : productCategory;
  return needleSingular === categorySingular;
}
