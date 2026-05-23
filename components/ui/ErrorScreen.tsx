import { colors } from '@constants/colors';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';

type ErrorScreenProps = {
  message: string;
  onRetry: () => void;
};

export function ErrorScreen({ message, onRetry }: ErrorScreenProps) {
  const displayMessage = message.trim() || 'Something went wrong';

  return (
    <View className="flex-1 items-center justify-center bg-white px-8">
      <View
        className="mb-4 items-center justify-center rounded-full"
        style={{
          width: 72,
          height: 72,
          backgroundColor: colors.SURFACE_MUTED,
        }}
      >
        <Ionicons name="cloud-offline-outline" size={36} color={colors.NAVY} />
      </View>
      <Text className="text-center font-bold" style={{ fontSize: 18, color: colors.NAVY }}>
        Unable to load
      </Text>
      <Text className="mt-2 text-center leading-relaxed" style={{ fontSize: 15, color: colors.BODY_TEXT }}>
        {displayMessage}
      </Text>
      <Pressable
        onPress={onRetry}
        className="mt-6 rounded-xl px-6 py-3"
        style={{ backgroundColor: colors.NAVY }}
        accessibilityRole="button"
        accessibilityLabel="Try again"
      >
        <Text className="font-semibold" style={{ fontSize: 16, color: colors.WHITE }}>
          Try Again
        </Text>
      </Pressable>
    </View>
  );
}
