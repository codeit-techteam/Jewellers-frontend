export function matchesCategoryFilter(
  product: { category: string; name: string },
  selectedCategory: string,
): boolean {
  if (selectedCategory === 'All' || selectedCategory === 'All Collections') {
    return true;
  }

  const needle = selectedCategory.toLowerCase();
  return (
    product.category.toLowerCase() === needle ||
    product.name.toLowerCase().includes(needle)
  );
}
