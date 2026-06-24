import { CHIP_STYLES, PURITY_PRESETS } from '@constants/inventory';
import { colors } from '@constants/colors';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';

type TagChipProps = {
  label: string;
  selected: boolean;
  onPress: () => void;
  showRemove?: boolean;
};

export function TagChip({ label, selected, onPress, showRemove }: TagChipProps) {
  const style = selected ? CHIP_STYLES.selected : CHIP_STYLES.unselected;
  return (
    <Pressable
      onPress={onPress}
      style={{
        paddingHorizontal: style.paddingHorizontal,
        paddingVertical: style.paddingVertical,
        borderRadius: style.borderRadius,
        backgroundColor: style.backgroundColor,
        borderWidth: style.borderWidth,
        borderColor: style.borderColor,
      }}
    >
      <Text style={{ fontSize: style.fontSize, color: style.color, fontWeight: style.fontWeight }}>
        {selected ? '✓ ' : ''}
        {label}
        {showRemove ? ' ✕' : ''}
      </Text>
    </Pressable>
  );
}

type MultiChipSectionProps = {
  label: string;
  optional?: boolean;
  subtitle?: string;
  options: string[];
  selected: string[];
  onToggle: (val: string) => void;
  labelSize: number;
  micro: number;
};

export function MultiChipSection({
  label,
  optional,
  subtitle,
  options,
  selected,
  onToggle,
  labelSize,
  micro,
}: MultiChipSectionProps) {
  return (
    <View className="mt-4">
      <View className="flex-row items-center justify-between">
        <Text className="font-medium" style={{ fontSize: labelSize, color: colors.NAVY }}>
          {label}
        </Text>
        {optional ? (
          <Text style={{ fontSize: micro, color: colors.BODY_TEXT }}>optional</Text>
        ) : null}
      </View>
      {subtitle ? (
        <Text className="mb-2 mt-1" style={{ fontSize: micro, color: colors.BODY_TEXT }}>
          {subtitle}
        </Text>
      ) : null}
      <View className="flex-row flex-wrap" style={{ gap: 8 }}>
        {options.map((opt) => (
          <TagChip
            key={opt}
            label={opt}
            selected={selected.includes(opt)}
            onPress={() => onToggle(opt)}
          />
        ))}
      </View>
    </View>
  );
}

type GenderChipSectionProps = {
  options: readonly { label: string; value: string }[];
  selected: string[];
  onToggle: (value: string) => void;
  labelSize: number;
  micro: number;
};

export function GenderChipSection({
  options,
  selected,
  onToggle,
  labelSize,
  micro,
}: GenderChipSectionProps) {
  return (
    <View className="mt-4">
      <View className="flex-row items-center justify-between">
        <Text className="font-medium" style={{ fontSize: labelSize, color: colors.NAVY }}>
          Gender / For Whom
        </Text>
        <Text style={{ fontSize: micro, color: colors.BODY_TEXT }}>optional</Text>
      </View>
      <View className="mt-2 flex-row flex-wrap" style={{ gap: 8 }}>
        {options.map((opt) => (
          <TagChip
            key={opt.value}
            label={opt.label}
            selected={selected.includes(opt.value)}
            onPress={() => onToggle(opt.value)}
          />
        ))}
      </View>
    </View>
  );
}

type CollectionNameSectionProps = {
  collections: readonly { id: string; title: string }[];
  loading: boolean;
  selectedIds: string[];
  onToggle: (id: string) => void;
  labelSize: number;
  micro: number;
};

export function CollectionNameSection({
  collections,
  loading,
  selectedIds,
  onToggle,
  labelSize,
  micro,
}: CollectionNameSectionProps) {
  return (
    <View className="mt-4" style={{ marginBottom: 24 }}>
      <View className="flex-row items-center justify-between">
        <Text className="font-medium" style={{ fontSize: labelSize, color: colors.NAVY }}>
          Collection Name
        </Text>
        <Text style={{ fontSize: micro, color: colors.BODY_TEXT }}>optional</Text>
      </View>
      <Text className="mb-3 mt-1" style={{ fontSize: micro, color: colors.BODY_TEXT }}>
        Assign product to a collection
      </Text>
      {loading ? (
        <ActivityIndicator size="small" color="#C9A84C" />
      ) : collections.length === 0 ? null : (
        <View className="flex-row flex-wrap" style={{ gap: 8 }}>
          {collections.map((col) => (
            <TagChip
              key={col.id}
              label={col.title}
              selected={selectedIds.includes(col.id)}
              onPress={() => onToggle(col.id)}
            />
          ))}
        </View>
      )}
    </View>
  );
}

type PuritySectionProps = {
  purity: string;
  onSelectPreset: (preset: string) => void;
  onCustomChange: (value: string) => void;
  labelSize: number;
  micro: number;
  body: number;
};

export function PuritySection({
  purity,
  onSelectPreset,
  onCustomChange,
  labelSize,
  micro,
  body,
}: PuritySectionProps) {
  const presets = [...PURITY_PRESETS];
  const isCustomActive = Boolean(purity) && !presets.includes(purity as (typeof presets)[number]);

  return (
    <View className="mt-4">
      <View className="flex-row items-center justify-between">
        <Text className="font-medium" style={{ fontSize: labelSize, color: colors.NAVY }}>
          Purity
        </Text>
        <Text style={{ fontSize: micro, color: colors.BODY_TEXT }}>optional</Text>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8, paddingVertical: 10 }}
      >
        {presets.map((p) => (
          <TagChip
            key={p}
            label={p}
            selected={purity === p}
            onPress={() => onSelectPreset(p)}
          />
        ))}
      </ScrollView>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          marginTop: 4,
          borderWidth: 1,
          borderColor: isCustomActive ? '#C9A84C' : '#E0E0E0',
          borderRadius: 12,
          paddingHorizontal: 14,
          paddingVertical: 10,
          gap: 8,
        }}
      >
        <TextInput
          value={isCustomActive ? purity : ''}
          onChangeText={onCustomChange}
          placeholder="Enter custom purity"
          placeholderTextColor={colors.BODY_TEXT}
          keyboardType="numeric"
          style={{ flex: 1, fontSize: 15, color: '#1A1A2E' }}
        />
        <Text style={{ color: '#888', fontSize: 13 }}>KT / %</Text>
      </View>
    </View>
  );
}
