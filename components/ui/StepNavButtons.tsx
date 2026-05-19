import { colors } from '@constants/colors';
import { useFontScale } from '@hooks/useFontScale';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

type StepNavButtonsProps = {
  onBack: () => void;
  onNext: () => void;
  nextLabel?: string;
  isLoading?: boolean;
  isNextDisabled?: boolean;
};

export function StepNavButtons({
  onBack,
  onNext,
  nextLabel = 'Next Step',
  isLoading = false,
  isNextDisabled = false,
}: StepNavButtonsProps) {
  const { button, body, width } = useFontScale();

  return (
    <View className="flex-row items-center" style={{ gap: width * 0.03 }}>
      <Pressable
        onPress={onBack}
        disabled={isLoading}
        className="items-center justify-center rounded-xl border px-5"
        style={{
          borderColor: colors.BORDER,
          backgroundColor: colors.WHITE,
          minHeight: 52,
          minWidth: width * 0.28,
        }}
      >
        <Text className="font-semibold" style={{ fontSize: body, color: colors.NAVY }}>
          Back
        </Text>
      </Pressable>

      <Pressable
        onPress={onNext}
        disabled={isLoading || isNextDisabled}
        className="flex-1 items-center justify-center rounded-xl"
        style={{
          backgroundColor: isNextDisabled ? `${colors.NAVY}99` : colors.NAVY,
          minHeight: 52,
        }}
      >
        {isLoading ? (
          <ActivityIndicator color={colors.WHITE} />
        ) : (
          <Text className="font-semibold" style={{ fontSize: button, color: colors.WHITE }}>
            {nextLabel.endsWith('→') ? nextLabel : `${nextLabel} →`}
          </Text>
        )}
      </Pressable>
    </View>
  );
}
