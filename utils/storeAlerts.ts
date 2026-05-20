import { Alert } from 'react-native';

export function showComingSoonAlert(): void {
  Alert.alert('Coming Soon', 'This feature will be available shortly.');
}

export function showShareComingSoonAlert(): void {
  Alert.alert('Coming Soon', 'Share feature coming soon');
}

export function showProductDetailComingSoonAlert(): void {
  Alert.alert('Coming Soon', 'Product detail screen coming soon');
}

export function showMapNavigationComingSoonAlert(): void {
  Alert.alert('Coming Soon', 'Map navigation coming soon');
}
