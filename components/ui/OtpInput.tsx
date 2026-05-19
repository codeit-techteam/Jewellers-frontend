import { colors } from '@constants/colors';
import { useFontScale } from '@hooks/useFontScale';
import { useCallback, useRef, useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';

type OtpInputProps = {
  length?: number;
  onComplete: (otp: string) => void;
  onChangeOtp: (otp: string) => void;
  hasError?: boolean;
};

export function OtpInput({
  length = 6,
  onComplete,
  onChangeOtp,
  hasError = false,
}: OtpInputProps) {
  const { h1, width } = useFontScale();
  const inputsRef = useRef<(TextInput | null)[]>([]);
  const [digits, setDigits] = useState<string[]>(() => Array(length).fill(''));

  const boxWidth = (width - 48 - (length - 1) * 8) / length;

  const syncOtp = useCallback(
    (nextDigits: string[]) => {
      const otp = nextDigits.join('');
      onChangeOtp(otp);
      if (otp.length === length && nextDigits.every((d) => d.length === 1)) {
        onComplete(otp);
      }
    },
    [length, onChangeOtp, onComplete],
  );

  const updateDigits = (nextDigits: string[]) => {
    setDigits(nextDigits);
    syncOtp(nextDigits);
  };

  const handleChange = (text: string, index: number) => {
    const sanitized = text.replace(/\D/g, '');

    if (sanitized.length > 1) {
      const pasted = sanitized.slice(0, length).split('');
      const next = Array(length)
        .fill('')
        .map((_, i) => pasted[i] ?? digits[i] ?? '');
      updateDigits(next);
      const focusIndex = Math.min(pasted.length, length - 1);
      inputsRef.current[focusIndex]?.focus();
      return;
    }

    const next = [...digits];
    next[index] = sanitized;
    updateDigits(next);

    if (sanitized && index < length - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !digits[index] && index > 0) {
      const next = [...digits];
      next[index - 1] = '';
      updateDigits(next);
      inputsRef.current[index - 1]?.focus();
    }
  };

  return (
    <View className="flex-row justify-between">
      {digits.map((digit, index) => (
        <Pressable key={index} onPress={() => inputsRef.current[index]?.focus()}>
          <View
            className="items-center justify-end"
            style={{
              width: boxWidth,
              borderBottomWidth: 2,
              borderBottomColor: hasError ? colors.ERROR : digit ? colors.NAVY : colors.BORDER,
              paddingBottom: 4,
            }}
          >
            <TextInput
              ref={(ref) => {
                inputsRef.current[index] = ref;
              }}
              value={digit}
              onChangeText={(text) => handleChange(text, index)}
              onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
              keyboardType="number-pad"
              maxLength={index === 0 ? length : 1}
              selectTextOnFocus
              className="w-full text-center font-bold"
              style={{
                fontSize: h1,
                color: colors.NAVY,
                paddingVertical: 4,
              }}
              accessibilityLabel={`OTP digit ${index + 1}`}
            />
          </View>
        </Pressable>
      ))}
    </View>
  );
}
