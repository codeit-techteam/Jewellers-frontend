import { colors } from '@constants/colors';
import { useFontScale } from '@hooks/useFontScale';
import { reverseGeocode } from '@services/locationService';
import type { PlaceResult } from '@/types/location';
import { buildAddressMapHtml } from '@utils/addressMapHtml';
import { handleApiError } from '@utils/handleApiError';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';

const DEFAULT_LAT = 22.5726;
const DEFAULT_LNG = 88.3639;

type AddressMapPickerProps = {
  visible: boolean;
  onClose: () => void;
  onConfirm: (place: PlaceResult) => void;
  initialLatitude?: number;
  initialLongitude?: number;
};

export function AddressMapPicker({
  visible,
  onClose,
  onConfirm,
  initialLatitude,
  initialLongitude,
}: AddressMapPickerProps) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { body, label } = useFontScale();
  const button = width * 0.042;

  const startLat = initialLatitude ?? DEFAULT_LAT;
  const startLng = initialLongitude ?? DEFAULT_LNG;

  const [pinLat, setPinLat] = useState(startLat);
  const [pinLng, setPinLng] = useState(startLng);
  const [isConfirming, setIsConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setPinLat(initialLatitude ?? DEFAULT_LAT);
      setPinLng(initialLongitude ?? DEFAULT_LNG);
      setError(null);
    }
  }, [visible, initialLatitude, initialLongitude]);

  const mapHtml = useMemo(
    () => buildAddressMapHtml(initialLatitude ?? pinLat, initialLongitude ?? pinLng),
    [visible, initialLatitude, initialLongitude, pinLat, pinLng],
  );

  const handleConfirm = async () => {
    setIsConfirming(true);
    setError(null);
    try {
      const place = await reverseGeocode(pinLat, pinLng);
      onConfirm(place);
      onClose();
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setIsConfirming(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 bg-white" style={{ paddingTop: insets.top }}>
        <View className="flex-row items-center justify-between px-4 py-3">
          <Pressable onPress={onClose} hitSlop={12}>
            <Text style={{ fontSize: body, color: colors.NAVY, fontWeight: '600' }}>Cancel</Text>
          </Pressable>
          <Text style={{ fontSize: body, color: colors.NAVY, fontWeight: '700' }}>Pick on map</Text>
          <View style={{ width: 56 }} />
        </View>

        <View style={{ flex: 1, marginHorizontal: 16, borderRadius: 12, overflow: 'hidden' }}>
          <WebView
            key={`${startLat}-${startLng}-${visible}`}
            source={{ html: mapHtml }}
            style={{ flex: 1 }}
            onMessage={(event) => {
              try {
                const msg = JSON.parse(event.nativeEvent.data) as { type: string; lat: number; lng: number };
                if (msg.type === 'move' && typeof msg.lat === 'number' && typeof msg.lng === 'number') {
                  setPinLat(msg.lat);
                  setPinLng(msg.lng);
                }
              } catch {
                /* ignore */
              }
            }}
            javaScriptEnabled
            domStorageEnabled
            originWhitelist={['*']}
          />
        </View>

        {error ? (
          <Text className="px-5 pt-2" style={{ fontSize: label, color: colors.ERROR }}>
            {error}
          </Text>
        ) : null}

        <View className="px-5 pt-3" style={{ paddingBottom: insets.bottom + 16 }}>
          <Text className="mb-3 text-center" style={{ fontSize: label, color: colors.BODY_TEXT }}>
            Tap the map or drag the pin to your storefront
          </Text>
          <Pressable
            onPress={() => void handleConfirm()}
            disabled={isConfirming}
            className="items-center rounded-xl py-4"
            style={{ backgroundColor: colors.NAVY, opacity: isConfirming ? 0.7 : 1 }}
          >
            {isConfirming ? (
              <ActivityIndicator color={colors.WHITE} />
            ) : (
              <Text style={{ fontSize: button, color: colors.WHITE, fontWeight: '700' }}>
                Confirm this location
              </Text>
            )}
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
