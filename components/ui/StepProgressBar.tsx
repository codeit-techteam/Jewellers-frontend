import { colors } from '@constants/colors';
import { useFontScale } from '@hooks/useFontScale';
import { Text, View } from 'react-native';

type StepProgressBarProps = {
  currentStep: number;
  totalSteps: number;
  percentLabel: string;
  showStepLabels?: boolean;
};

export function StepProgressBar({
  currentStep,
  totalSteps,
  percentLabel,
  showStepLabels = true,
}: StepProgressBarProps) {
  const { width, label, micro } = useFontScale();
  const gap = width * 0.015;

  return (
    <View>
      {showStepLabels ? (
        <View className="mb-2 flex-row items-center justify-between">
          <Text
            className="font-semibold uppercase tracking-wide"
            style={{ fontSize: micro, color: colors.NAVY }}
          >
            STEP {currentStep} OF {totalSteps}
          </Text>
          <Text style={{ fontSize: micro, color: colors.BODY_TEXT }}>{percentLabel}</Text>
        </View>
      ) : null}

      <View className="flex-row" style={{ gap }}>
        {Array.from({ length: totalSteps }).map((_, index) => {
          const stepNumber = index + 1;
          const isFilled = stepNumber <= currentStep;
          return (
            <View
              key={stepNumber}
              className="flex-1 rounded-full"
              style={{
                height: width * 0.012,
                backgroundColor: isFilled ? colors.NAVY : colors.BORDER,
              }}
            />
          );
        })}
      </View>
    </View>
  );
}
