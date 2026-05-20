import { colors } from '@constants/colors';
import { Modal, Pressable, ScrollView, Text, useWindowDimensions } from 'react-native';

type SelectPickerModalProps = {
  visible: boolean;
  title: string;
  options: readonly string[];
  selectedValue: string;
  onSelect: (value: string) => void;
  onClose: () => void;
};

export function SelectPickerModal({
  visible,
  title,
  options,
  selectedValue,
  onSelect,
  onClose,
}: SelectPickerModalProps) {
  const { width } = useWindowDimensions();
  const body = width * 0.038;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable className="flex-1 justify-end" style={{ backgroundColor: colors.OVERLAY_DARK }} onPress={onClose}>
        <Pressable
          className="rounded-t-3xl bg-white px-4 pb-8 pt-4"
          onPress={(event) => event.stopPropagation()}
        >
          <Text className="mb-4 text-center font-semibold" style={{ fontSize: body, color: colors.NAVY }}>
            {title}
          </Text>
          <ScrollView className="max-h-80">
            {options.map((option) => {
              const isSelected = option === selectedValue;
              return (
                <Pressable
                  key={option}
                  onPress={() => {
                    onSelect(option);
                    onClose();
                  }}
                  className="rounded-xl px-3 py-3"
                  style={{ backgroundColor: isSelected ? colors.INFO_BG : undefined }}
                >
                  <Text style={{ fontSize: body, color: colors.NAVY }}>{option}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
