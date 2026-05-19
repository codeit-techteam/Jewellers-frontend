import { COUNTRIES } from '@constants/countries';
import { colors } from '@constants/colors';
import { useFontScale } from '@hooks/useFontScale';
import type { CountryOption } from '@/types/auth';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';

type CountryPickerProps = {
  selected: CountryOption;
  onSelect: (country: CountryOption) => void;
  visible: boolean;
  onClose: () => void;
};

export function CountryPicker({ selected, onSelect, visible, onClose }: CountryPickerProps) {
  const { body, label } = useFontScale();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable className="flex-1 justify-end bg-black/40" onPress={onClose}>
        <Pressable
          className="rounded-t-3xl bg-white px-4 pb-8 pt-4"
          onPress={(event) => event.stopPropagation()}
        >
          <Text className="mb-4 text-center font-semibold" style={{ fontSize: body, color: colors.NAVY }}>
            Select country
          </Text>
          <ScrollView className="max-h-64">
            {COUNTRIES.map((country) => {
              const isSelected = country.code === selected.code;
              return (
                <Pressable
                  key={country.code}
                  onPress={() => {
                    onSelect(country);
                    onClose();
                  }}
                  className="flex-row items-center rounded-xl px-3 py-3"
                  style={{
                    backgroundColor: isSelected ? colors.CREAM : undefined,
                  }}
                >
                  <Text style={{ fontSize: body }}>{country.flag}</Text>
                  <Text
                    className="ml-3 flex-1 font-medium"
                    style={{ fontSize: body, color: colors.NAVY }}
                  >
                    {country.dial} ({country.code})
                  </Text>
                  <Text style={{ fontSize: label, color: colors.BODY_TEXT }}>{country.name}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

type CountryPickerTriggerProps = {
  selected: CountryOption;
  onPress: () => void;
};

export function CountryPickerTrigger({ selected, onPress }: CountryPickerTriggerProps) {
  const { label } = useFontScale();

  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center justify-center rounded-xl border px-3"
      style={{
        borderColor: colors.BORDER,
        minHeight: 52,
        minWidth: 100,
      }}
    >
      <Text className="font-medium" style={{ fontSize: label, color: colors.NAVY }}>
        {selected.dial} ({selected.code})
      </Text>
      <Text className="ml-1" style={{ fontSize: label, color: colors.BODY_TEXT }}>
        ▾
      </Text>
    </Pressable>
  );
}
