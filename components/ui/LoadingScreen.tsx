import { colors } from '@constants/colors';
import { ActivityIndicator, Text, View } from 'react-native';

type LoadingScreenProps = {
  message?: string;
};

export function LoadingScreen({ message }: LoadingScreenProps) {
  return (
    <View className="flex-1 items-center justify-center bg-white px-6">
      <ActivityIndicator size="large" color={colors.NAVY} />
      {message ? (
        <Text className="mt-4 text-center" style={{ fontSize: 16, color: colors.BODY_TEXT }}>
          {message}
        </Text>
      ) : null}
    </View>
  );
}
