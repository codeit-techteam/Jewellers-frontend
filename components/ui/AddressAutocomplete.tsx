import { AddressMapPicker } from '@components/ui/AddressMapPicker';
import { colors } from '@constants/colors';
import { useFontScale } from '@hooks/useFontScale';
import { searchAddresses, getCurrentPositionWithAddress } from '@services/locationService';
import type { AddressSuggestion, PlaceResult } from '@/types/location';
import { suggestionToPlaceResult } from '@/types/location';
import { handleApiError } from '@utils/handleApiError';
import { dialog } from '@utils/dialog';
import * as Location from 'expo-location';
import { ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  Text,
  TextInput,
  TextInputProps,
  View,
} from 'react-native';

type AddressAutocompleteProps = Omit<TextInputProps, 'value' | 'onChangeText'> & {
  value: string;
  onChangeText: (text: string) => void;
  onPlaceResolved?: (place: PlaceResult) => void;
  error?: string;
  label?: string;
  icon?: ReactNode;
  showUseCurrentLocation?: boolean;
  showPickOnMap?: boolean;
  mapInitialLatitude?: number;
  mapInitialLongitude?: number;
};

const DEBOUNCE_MS = 400;
const MIN_QUERY_LEN = 2;

export function AddressAutocomplete({
  value,
  onChangeText,
  onBlur,
  onPlaceResolved,
  error,
  label,
  icon,
  showUseCurrentLocation = true,
  showPickOnMap = true,
  mapInitialLatitude,
  mapInitialLongitude,
  multiline,
  placeholder,
  style,
  ...inputProps
}: AddressAutocompleteProps) {
  const { body, label: labelSize, width } = useFontScale();
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [mapVisible, setMapVisible] = useState(false);
  const [searchBias, setSearchBias] = useState<{ lat: number; lng: number } | null>(null);
  const [resolvedCoords, setResolvedCoords] = useState<{
    lat?: number;
    lng?: number;
  }>({
    lat: mapInitialLatitude,
    lng: mapInitialLongitude,
  });
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skipSearchRef = useRef(false);

  useEffect(() => {
    if (mapInitialLatitude != null && mapInitialLongitude != null) {
      setResolvedCoords({ lat: mapInitialLatitude, lng: mapInitialLongitude });
    }
  }, [mapInitialLatitude, mapInitialLongitude]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { status } = await Location.getForegroundPermissionsAsync();
        if (status !== 'granted') {
          const req = await Location.requestForegroundPermissionsAsync();
          if (req.status !== 'granted') return;
        }
        const position = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        if (!cancelled) {
          setSearchBias({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        }
      } catch {
        /* optional bias */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const applyPlace = (place: PlaceResult) => {
    setResolvedCoords({ lat: place.latitude, lng: place.longitude });
    onPlaceResolved?.(place);
  };

  const runSearch = useCallback(
    async (query: string) => {
      const trimmed = query.trim();
      if (trimmed.length < MIN_QUERY_LEN) {
        setSuggestions([]);
        setIsSearching(false);
        return;
      }

      setIsSearching(true);
      try {
        const results = await searchAddresses(trimmed, {
          limit: 8,
          latitude: searchBias?.lat ?? resolvedCoords.lat,
          longitude: searchBias?.lng ?? resolvedCoords.lng,
        });
        setSuggestions(results);
        setShowSuggestions(results.length > 0);
      } catch {
        setSuggestions([]);
      } finally {
        setIsSearching(false);
      }
    },
    [searchBias, resolvedCoords.lat, resolvedCoords.lng],
  );

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const handleChangeText = (text: string) => {
    onChangeText(text);
    if (skipSearchRef.current) {
      skipSearchRef.current = false;
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (text.trim().length < MIN_QUERY_LEN) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    debounceRef.current = setTimeout(() => {
      void runSearch(text);
    }, DEBOUNCE_MS);
  };

  const selectSuggestion = (item: AddressSuggestion) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    skipSearchRef.current = true;
    const place = suggestionToPlaceResult(item);
    onChangeText(place.formattedAddress);
    setSuggestions([]);
    setShowSuggestions(false);
    applyPlace(place);
  };

  const handleUseCurrentLocation = async () => {
    setIsFetchingLocation(true);
    setShowSuggestions(false);
    try {
      const place = await getCurrentPositionWithAddress();
      skipSearchRef.current = true;
      onChangeText(place.formattedAddress);
      setSearchBias({ lat: place.latitude, lng: place.longitude });
      applyPlace(place);
    } catch (err) {
      const message = handleApiError(err);
      void dialog.alert('Could not fetch location', message || 'Please enter your address manually.');
    } finally {
      setIsFetchingLocation(false);
    }
  };

  const handleMapConfirm = (place: PlaceResult) => {
    skipSearchRef.current = true;
    onChangeText(place.formattedAddress);
    setSearchBias({ lat: place.latitude, lng: place.longitude });
    applyPlace(place);
  };

  const mapLat =
    resolvedCoords.lat ?? searchBias?.lat ?? mapInitialLatitude;
  const mapLng =
    resolvedCoords.lng ?? searchBias?.lng ?? mapInitialLongitude;

  const inputBlock = (
    <View
      className="flex-row items-center rounded-xl border px-3"
      style={{
        borderColor: error ? colors.ERROR : colors.BORDER,
        minHeight: multiline ? width * 0.22 : 52,
        alignItems: multiline ? 'flex-start' : 'center',
        paddingTop: multiline ? 12 : 0,
      }}
    >
      {icon ? <View className="mr-2" style={multiline ? { marginTop: 2 } : undefined}>{icon}</View> : null}
      <TextInput
        {...inputProps}
        value={value}
        onChangeText={handleChangeText}
        onBlur={() => {
          setTimeout(() => setShowSuggestions(false), 250);
          onBlur?.();
        }}
        onFocus={() => {
          if (suggestions.length > 0) setShowSuggestions(true);
          if (value.trim().length >= MIN_QUERY_LEN && suggestions.length === 0) {
            void runSearch(value);
          }
        }}
        multiline={multiline}
        placeholder={placeholder}
        placeholderTextColor={colors.BODY_TEXT}
        className="flex-1 py-3"
        style={[
          {
            fontSize: body,
            color: colors.NAVY,
            textAlignVertical: multiline ? 'top' : 'center',
          },
          style,
        ]}
      />
      {isSearching ? (
        <ActivityIndicator size="small" color={colors.NAVY} style={{ marginLeft: 8 }} />
      ) : null}
    </View>
  );

  return (
    <View className="mb-4">
      {label ? (
        <Text className="mb-2 font-medium" style={{ fontSize: labelSize, color: colors.BODY_TEXT }}>
          {label}
        </Text>
      ) : null}

      {inputBlock}

      {showSuggestions && suggestions.length > 0 ? (
        <View
          className="mt-1 overflow-hidden rounded-xl border"
          style={{
            borderColor: colors.BORDER,
            backgroundColor: colors.WHITE,
            maxHeight: 220,
            elevation: 4,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.08,
            shadowRadius: 4,
          }}
        >
          {suggestions.map((item) => (
            <Pressable
              key={item.place_id}
              onPress={() => selectSuggestion(item)}
              className="border-b px-3 py-3"
              style={{ borderColor: colors.BORDER }}
            >
              {item.name ? (
                <Text style={{ fontSize: body, color: colors.NAVY, fontWeight: '600' }} numberOfLines={1}>
                  {item.name}
                </Text>
              ) : null}
              <Text
                style={{
                  fontSize: item.name ? labelSize : body,
                  color: item.name ? colors.BODY_TEXT : colors.NAVY,
                  marginTop: item.name ? 2 : 0,
                }}
                numberOfLines={2}
              >
                {item.formatted_address}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : null}

      {error ? (
        <Text className="mt-1" style={{ fontSize: labelSize, color: colors.ERROR }}>
          {error}
        </Text>
      ) : null}

      {(showUseCurrentLocation || showPickOnMap) ? (
        <View className="mt-2 flex-row flex-wrap items-center justify-end gap-x-4 gap-y-1">
          {isFetchingLocation ? (
            <ActivityIndicator size="small" color={colors.NAVY} />
          ) : null}
          {showPickOnMap ? (
            <Pressable onPress={() => setMapVisible(true)} hitSlop={8}>
              <Text style={{ fontSize: labelSize, color: colors.NAVY, fontWeight: '600' }}>
                🗺️ Pick on map
              </Text>
            </Pressable>
          ) : null}
          {showUseCurrentLocation ? (
            <Pressable
              onPress={() => void handleUseCurrentLocation()}
              disabled={isFetchingLocation}
              hitSlop={8}
            >
              <Text
                style={{
                  fontSize: labelSize,
                  color: isFetchingLocation ? colors.BODY_TEXT : colors.NAVY,
                  fontWeight: '600',
                }}
              >
                📍 Use current location
              </Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}

      <AddressMapPicker
        visible={mapVisible}
        onClose={() => setMapVisible(false)}
        onConfirm={handleMapConfirm}
        initialLatitude={mapLat}
        initialLongitude={mapLng}
      />
    </View>
  );
}
