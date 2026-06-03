export type GeocodeResult = {
  formatted_address: string | null;
  display_name?: string | null;
  name?: string | null;
  locality: string | null;
  city: string | null;
  lat: number;
  lng: number;
  source?: string;
};

export type AddressSuggestion = {
  place_id: string;
  formatted_address: string;
  display_name: string;
  name?: string | null;
  locality: string | null;
  city: string | null;
  lat: number;
  lng: number;
  source?: string;
};

export type PlaceResult = {
  formattedAddress: string;
  name?: string | null;
  locality: string | null;
  city: string | null;
  latitude: number;
  longitude: number;
};

export function geocodeToPlaceResult(data: GeocodeResult): PlaceResult {
  const formattedAddress =
    data.formatted_address?.trim() ||
    data.display_name?.trim() ||
    `Pinned location (${data.lat.toFixed(5)}, ${data.lng.toFixed(5)})`;

  return {
    formattedAddress,
    name: data.name ?? null,
    locality: data.locality,
    city: data.city,
    latitude: data.lat,
    longitude: data.lng,
  };
}

export function suggestionToPlaceResult(s: AddressSuggestion): PlaceResult {
  return {
    formattedAddress: s.formatted_address,
    name: s.name ?? null,
    locality: s.locality,
    city: s.city,
    latitude: s.lat,
    longitude: s.lng,
  };
}
