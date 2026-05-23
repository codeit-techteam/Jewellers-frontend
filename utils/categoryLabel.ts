/** Display label for a category (title-case friendly). */
export function formatCategoryName(name: string): string {
  if (!name) return '';
  return name
    .toLowerCase()
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
