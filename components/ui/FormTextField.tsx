import { colors } from '@constants/colors';
import { useFontScale } from '@hooks/useFontScale';
import { ReactNode } from 'react';
import { Text, TextInput, TextInputProps, View } from 'react-native';

type FormTextFieldProps = TextInputProps & {
  label: string;
  icon: ReactNode;
  error?: string;
};

export function FormTextField({ label, icon, error, style, ...inputProps }: FormTextFieldProps) {
  const { body, label: labelSize, width } = useFontScale();

  return (
    <View className="mb-4">
      <Text className="mb-2 font-medium" style={{ fontSize: labelSize, color: colors.BODY_TEXT }}>
        {label}
      </Text>
      <View
        className="flex-row items-center rounded-xl border px-3"
        style={{
          borderColor: error ? colors.ERROR : colors.BORDER,
          minHeight: inputProps.multiline ? width * 0.22 : 52,
        }}
      >
        <View className="mr-2">{icon}</View>
        <TextInput
          {...inputProps}
          className="flex-1 py-3"
          placeholderTextColor={colors.BODY_TEXT}
          style={[
            {
              fontSize: body,
              color: colors.NAVY,
              textAlignVertical: inputProps.multiline ? 'top' : 'center',
            },
            style,
          ]}
        />
      </View>
      {error ? (
        <Text className="mt-1" style={{ fontSize: labelSize, color: colors.ERROR }}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}
