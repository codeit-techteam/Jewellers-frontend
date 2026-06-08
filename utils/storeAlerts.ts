import { dialog } from '@utils/dialog';

export function showComingSoonAlert(feature?: string): void {
  void dialog.alert(
    'Coming Soon',
    feature ? `${feature} will be available shortly.` : 'This feature will be available shortly.',
    undefined,
  );
}

export function showProductDetailComingSoonAlert(): void {
  void dialog.alert('Coming Soon', 'Product detail screen coming soon');
}

export function showMapNavigationComingSoonAlert(): void {
  void dialog.alert('Coming Soon', 'Map navigation coming soon');
}
