import type { AddressSuggestion, GeocodeResult, PlaceResult } from '@/types/location';
import { geocodeToPlaceResult, suggestionToPlaceResult } from '@/types/location';
import * as Location from 'expo-location';

import { api } from './api';

type SearchResponse = {
  suggestions: AddressSuggestion[];
};

export async function reverseGeocode(lat: number, lng: number): Promise<PlaceResult> {
  const { data } = await api.get<GeocodeResult>('/utils/geocode', {
    params: { lat, lng },
  });
  return geocodeToPlaceResult(data);
}

export async function searchAddresses(
  query: string,
  options?: { limit?: number; latitude?: number; longitude?: number },
): Promise<AddressSuggestion[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  const params: Record<string, string | number> = {
    q: trimmed,
    limit: options?.limit ?? 8,
  };
  if (options?.latitude != null && options?.longitude != null) {
    params.lat = options.latitude;
    params.lng = options.longitude;
  }

  const { data } = await api.get<SearchResponse>('/utils/geocode/search', { params });
  return data.suggestions ?? [];
}

export async function getCurrentPositionWithAddress(): Promise<PlaceResult> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') {
    throw new Error('Location permission denied');
  }

  const position = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced,
  });

  const { latitude, longitude } = position.coords;
  return reverseGeocode(latitude, longitude);
}

export { suggestionToPlaceResult };
