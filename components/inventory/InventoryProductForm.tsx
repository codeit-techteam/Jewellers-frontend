import { SelectPickerModal } from '@components/ui/SelectPickerModal';
import { pickImageFromLibrary } from '@components/ui/DocumentUploader';
import { colors } from '@constants/colors';
import {
  DEFAULT_PURITY,
  INVENTORY_FORM_CATEGORIES,
  PURITY_OPTIONS,
} from '@constants/inventory';
import type { InventoryProduct } from '@/types/inventory';
import { inventoryProductDraftSchema, inventoryProductStrictSchema } from '@utils/inventoryFormSchema';
import { calculateProductPrice, generateProductSku } from '@utils/calculateProductPrice';
import { Ionicons } from '@expo/vector-icons';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

export type InventoryFormSubmitMode = 'draft' | 'publish' | 'update' | 'delete';

type InventoryProductFormProps = {
  mode: 'add' | 'edit';
  initialProduct?: InventoryProduct;
  isSubmitting: boolean;
  onSubmit: (product: InventoryProduct, mode: InventoryFormSubmitMode) => void;
  onDelete?: () => void;
};

type FormValues = {
  name: string;
  category: string;
  weight: string;
  purity: string;
  makingChargesType: 'percentage' | 'flat';
  makingChargesValue: string;
  additionalDetails?: string;
};

const defaultValues: FormValues = {
  name: '',
  category: '',
  weight: '',
  purity: DEFAULT_PURITY,
  makingChargesType: 'percentage',
  makingChargesValue: '5.00',
  additionalDetails: '',
};

export function InventoryProductForm({
  mode,
  initialProduct,
  isSubmitting,
  onSubmit,
  onDelete,
}: InventoryProductFormProps) {
  const { width } = useWindowDimensions();
  const h2 = width * 0.048;
  const body = width * 0.038;
  const label = width * 0.032;
  const micro = width * 0.028;
  const button = width * 0.042;

  const [imageUris, setImageUris] = useState<string[]>(
    initialProduct?.imageUris?.length
      ? initialProduct.imageUris
      : initialProduct?.imageUri
        ? [initialProduct.imageUri]
        : [],
  );
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [purityModalVisible, setPurityModalVisible] = useState(false);
  const [detailsExpanded, setDetailsExpanded] = useState(false);
  const detailsHeight = useSharedValue(0);

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(inventoryProductStrictSchema),
    defaultValues: initialProduct
      ? {
          name: initialProduct.name,
          category: initialProduct.category,
          weight: String(initialProduct.weight),
          purity: initialProduct.purity,
          makingChargesType: initialProduct.makingChargesType,
          makingChargesValue: String(initialProduct.makingChargesValue),
          additionalDetails: initialProduct.additionalDetails ?? '',
        }
      : defaultValues,
    mode: 'onChange',
  });

  const makingChargesType = watch('makingChargesType');
  const selectedCategory = watch('category');

  const detailsAnimatedStyle = useAnimatedStyle(() => ({
    opacity: detailsHeight.value,
    maxHeight: detailsHeight.value,
  }));

  const toggleDetails = () => {
    const next = !detailsExpanded;
    setDetailsExpanded(next);
    detailsHeight.value = withTiming(next ? 120 : 0, { duration: 250 });
  };

  const handleAddImage = async () => {
    if (imageUris.length >= 5) {
      return;
    }
    const picked = await pickImageFromLibrary();
    if (picked?.fileUri) {
      setImageUris((prev) => [...prev, picked.fileUri]);
    }
  };

  const buildProduct = (values: FormValues, isDraft: boolean): InventoryProduct => {
    const weight = Number(values.weight) || 0;
    const makingChargesValue = Number(values.makingChargesValue) || 0;
    const price = isDraft
      ? 0
      : calculateProductPrice(weight, values.makingChargesType, makingChargesValue);

    return {
      id: initialProduct?.id ?? `inv-${Date.now()}`,
      name: values.name.trim(),
      sku: initialProduct?.sku ?? generateProductSku(values.category || 'OT'),
      category: values.category || 'Other',
      price: initialProduct?.price && mode === 'edit' ? initialProduct.price : price,
      weight,
      purity: values.purity,
      makingChargesType: values.makingChargesType,
      makingChargesValue,
      imageUri: imageUris[0] ?? '',
      imageUris,
      analytics: initialProduct?.analytics ?? {
        views: 0,
        wishlist: 0,
        inquiry: 0,
        waClicks: 0,
      },
      isDraft,
      createdAt: initialProduct?.createdAt ?? new Date().toISOString(),
      additionalDetails: values.additionalDetails,
    };
  };

  const onSaveDraft = () => {
    const values = watch();
    const parsed = inventoryProductDraftSchema.safeParse(values);
    if (!parsed.success) {
      return;
    }
    onSubmit(buildProduct(values, true), 'draft');
  };

  const onSaveProduct = handleSubmit((values: FormValues) => {
    if (imageUris.length === 0) {
      return;
    }
    const product = buildProduct(values, false);
    if (mode === 'edit') {
      onSubmit(
        {
          ...product,
          price: calculateProductPrice(
            product.weight,
            product.makingChargesType,
            product.makingChargesValue,
          ),
        },
        'update',
      );
      return;
    }
    onSubmit(product, 'publish');
  });

  return (
    <KeyboardAvoidingView
      className="flex-1"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        className="flex-1 px-5"
        contentContainerStyle={{ paddingBottom: 120 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Pressable
          onPress={() => void handleAddImage()}
          className="items-center rounded-xl border border-dashed px-4 py-8"
          style={{ borderColor: colors.UPLOAD_BORDER_DASHED, backgroundColor: colors.UPLOAD_BG }}
        >
          <View
            className="mb-3 items-center justify-center rounded-full"
            style={{
              width: width * 0.14,
              height: width * 0.14,
              backgroundColor: colors.INFO_BG,
            }}
          >
            <Ionicons name="camera" size={width * 0.07} color={colors.NAVY} />
          </View>
          <Text className="font-bold" style={{ fontSize: body, color: colors.NAVY }}>
            Product Images
          </Text>
          <Text className="mt-2 text-center" style={{ fontSize: micro, color: colors.BODY_TEXT }}>
            Upload high-quality photos to showcase the jewellery details
          </Text>
          <Pressable
            onPress={() => void handleAddImage()}
            className="mt-4 rounded-lg px-4 py-2"
            style={{ backgroundColor: colors.INFO_BG }}
          >
            <Text className="font-semibold" style={{ fontSize: label, color: colors.NAVY }}>
              Add Image
            </Text>
          </Pressable>
          {imageUris.length > 0 ? (
            <View className="mt-4 flex-row flex-wrap justify-center" style={{ gap: 8 }}>
              {imageUris.map((uri) => (
                <Image
                  key={uri}
                  source={{ uri }}
                  style={{ width: 64, height: 64, borderRadius: 8 }}
                />
              ))}
            </View>
          ) : null}
        </Pressable>

        <Text className="mb-1 mt-4 font-medium" style={{ fontSize: label, color: colors.NAVY }}>
          Product Name
        </Text>
        <Controller
          control={control}
          name="name"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              placeholder="e.g. Emerald Drop Nec..."
              placeholderTextColor={colors.BODY_TEXT}
              className="rounded-xl border px-4 py-3"
              style={{
                borderColor: errors.name ? colors.ERROR : colors.BORDER,
                fontSize: body,
                color: colors.NAVY,
              }}
            />
          )}
        />
        {errors.name ? (
          <Text style={{ fontSize: micro, color: colors.ERROR }}>{errors.name.message}</Text>
        ) : null}

        <Text className="mb-1 mt-3 font-medium" style={{ fontSize: label, color: colors.NAVY }}>
          Category
        </Text>
        <Controller
          control={control}
          name="category"
          render={({ field: { onChange, value } }) => (
            <>
              <Pressable
                onPress={() => setCategoryModalVisible(true)}
                className="flex-row items-center justify-between rounded-xl border px-4 py-3"
                style={{ borderColor: errors.category ? colors.ERROR : colors.BORDER }}
              >
                <Text style={{ fontSize: body, color: value ? colors.NAVY : colors.BODY_TEXT }}>
                  {value || 'Select Category'}
                </Text>
                <Ionicons name="chevron-down" size={width * 0.04} color={colors.BODY_TEXT} />
              </Pressable>
              <SelectPickerModal
                visible={categoryModalVisible}
                title="Select category"
                options={INVENTORY_FORM_CATEGORIES}
                selectedValue={selectedCategory}
                onSelect={onChange}
                onClose={() => setCategoryModalVisible(false)}
              />
            </>
          )}
        />
        {errors.category ? (
          <Text style={{ fontSize: micro, color: colors.ERROR }}>{errors.category.message}</Text>
        ) : null}

        <View className="mt-3 flex-row" style={{ gap: width * 0.03 }}>
          <View className="flex-1">
            <Text className="mb-1 font-medium" style={{ fontSize: label, color: colors.NAVY }}>
              Weight (g)
            </Text>
            <Controller
              control={control}
              name="weight"
              render={({ field: { onChange, onBlur, value } }) => (
                <View
                  className="flex-row items-center rounded-xl border px-3"
                  style={{ borderColor: errors.weight ? colors.ERROR : colors.BORDER }}
                >
                  <TextInput
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    placeholder="0.00"
                    keyboardType="decimal-pad"
                    placeholderTextColor={colors.BODY_TEXT}
                    className="flex-1 py-3"
                    style={{ fontSize: body, color: colors.NAVY }}
                  />
                  <Text style={{ fontSize: micro, color: colors.BODY_TEXT }}>grams</Text>
                </View>
              )}
            />
            {errors.weight ? (
              <Text style={{ fontSize: micro, color: colors.ERROR }}>{errors.weight.message}</Text>
            ) : null}
          </View>

          <View className="flex-1">
            <Text className="mb-1 font-medium" style={{ fontSize: label, color: colors.NAVY }}>
              Purity
            </Text>
            <Controller
              control={control}
              name="purity"
              render={({ field: { onChange, value } }) => (
                <>
                  <Pressable
                    onPress={() => setPurityModalVisible(true)}
                    className="flex-row items-center justify-between rounded-xl border px-3 py-3"
                    style={{ borderColor: colors.BORDER }}
                  >
                    <Text style={{ fontSize: label, color: colors.NAVY }} numberOfLines={1}>
                      {value}
                    </Text>
                    <Ionicons name="chevron-down" size={width * 0.035} color={colors.BODY_TEXT} />
                  </Pressable>
                  <SelectPickerModal
                    visible={purityModalVisible}
                    title="Select purity"
                    options={PURITY_OPTIONS}
                    selectedValue={value}
                    onSelect={onChange}
                    onClose={() => setPurityModalVisible(false)}
                  />
                </>
              )}
            />
          </View>
        </View>

        <View
          className="mt-4 rounded-xl p-3"
          style={{ backgroundColor: colors.SURFACE_MUTED }}
        >
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center">
              <Ionicons name="cash-outline" size={width * 0.05} color={colors.NAVY} />
              <Text className="ml-2 font-bold" style={{ fontSize: body, color: colors.NAVY }}>
                Making Charges
              </Text>
            </View>
            <Controller
              control={control}
              name="makingChargesType"
              render={({ field: { onChange, value } }) => (
                <View className="flex-row rounded-lg border" style={{ borderColor: colors.BORDER }}>
                  <Pressable
                    onPress={() => onChange('percentage')}
                    className="rounded-l-lg px-2 py-1"
                    style={{
                      backgroundColor: value === 'percentage' ? colors.NAVY : colors.WHITE,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: micro,
                        color: value === 'percentage' ? colors.WHITE : colors.BODY_TEXT,
                      }}
                    >
                      Percentage (%)
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => onChange('flat')}
                    className="rounded-r-lg px-2 py-1"
                    style={{
                      backgroundColor: value === 'flat' ? colors.NAVY : colors.WHITE,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: micro,
                        color: value === 'flat' ? colors.WHITE : colors.BODY_TEXT,
                      }}
                    >
                      Flat Fee (₹)
                    </Text>
                  </Pressable>
                </View>
              )}
            />
          </View>

          <Controller
            control={control}
            name="makingChargesValue"
            render={({ field: { onChange, onBlur, value } }) => (
              <View
                className="mt-3 flex-row items-center rounded-xl border bg-white px-3"
                style={{ borderColor: errors.makingChargesValue ? colors.ERROR : colors.BORDER }}
              >
                {makingChargesType === 'flat' ? (
                  <Text style={{ fontSize: body, color: colors.NAVY }}>₹</Text>
                ) : null}
                <TextInput
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  placeholder="5.00"
                  keyboardType="decimal-pad"
                  placeholderTextColor={colors.BODY_TEXT}
                  className="flex-1 py-3"
                  style={{ fontSize: body, color: colors.NAVY, marginLeft: makingChargesType === 'flat' ? 4 : 0 }}
                />
                {makingChargesType === 'percentage' ? (
                  <Text style={{ fontSize: body, color: colors.BODY_TEXT }}>%</Text>
                ) : null}
              </View>
            )}
          />
          {errors.makingChargesValue ? (
            <Text style={{ fontSize: micro, color: colors.ERROR }}>
              {errors.makingChargesValue.message}
            </Text>
          ) : null}
          <Text className="mt-2" style={{ fontSize: micro, color: colors.BODY_TEXT }}>
            Applied on top of current gold rate per gram
          </Text>
        </View>

        <Pressable onPress={toggleDetails} className="mt-4 flex-row items-center justify-between py-2">
          <Text className="font-semibold" style={{ fontSize: body, color: colors.NAVY }}>
            Additional Details (Optional)
          </Text>
          <Ionicons
            name={detailsExpanded ? 'chevron-up' : 'chevron-down'}
            size={width * 0.05}
            color={colors.NAVY}
          />
        </Pressable>
        <Animated.View style={detailsAnimatedStyle}>
          <Controller
            control={control}
            name="additionalDetails"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder="Add any special notes, certifications, or additional specifications..."
                placeholderTextColor={colors.BODY_TEXT}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                className="rounded-xl border px-4 py-3"
                style={{
                  borderColor: colors.BORDER,
                  fontSize: body,
                  color: colors.NAVY,
                  minHeight: 100,
                }}
              />
            )}
          />
        </Animated.View>
      </ScrollView>

      <View className="flex-row border-t px-5 py-3" style={{ borderColor: colors.BORDER }}>
        {mode === 'add' ? (
          <>
            <Pressable
              onPress={onSaveDraft}
              disabled={isSubmitting}
              className="flex-1 items-center justify-center rounded-xl border py-3"
              style={{ borderColor: colors.BORDER }}
            >
              <Text className="font-semibold" style={{ fontSize: button, color: colors.NAVY }}>
                Save Draft
              </Text>
            </Pressable>
            <Pressable
              onPress={() => void onSaveProduct()}
              disabled={isSubmitting || imageUris.length === 0}
              className="ml-2 flex-1 flex-row items-center justify-center rounded-xl py-3"
              style={{
                backgroundColor:
                  isSubmitting || imageUris.length === 0 ? colors.SURFACE_MUTED : colors.NAVY,
              }}
            >
              {isSubmitting ? (
                <ActivityIndicator color={colors.WHITE} />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={width * 0.05} color={colors.WHITE} />
                  <Text
                    className="ml-1 font-semibold"
                    style={{ fontSize: button, color: colors.WHITE }}
                  >
                    Save Product
                  </Text>
                </>
              )}
            </Pressable>
          </>
        ) : (
          <>
            <Pressable
              onPress={onDelete}
              disabled={isSubmitting}
              className="flex-1 items-center justify-center rounded-xl border py-3"
              style={{ borderColor: colors.ERROR }}
            >
              <Text className="font-semibold" style={{ fontSize: button, color: colors.ERROR }}>
                Delete Product
              </Text>
            </Pressable>
            <Pressable
              onPress={() => void onSaveProduct()}
              disabled={isSubmitting}
              className="ml-2 flex-1 flex-row items-center justify-center rounded-xl py-3"
              style={{ backgroundColor: colors.NAVY }}
            >
              {isSubmitting ? (
                <ActivityIndicator color={colors.WHITE} />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={width * 0.05} color={colors.WHITE} />
                  <Text
                    className="ml-1 font-semibold"
                    style={{ fontSize: button, color: colors.WHITE }}
                  >
                    Save Product
                  </Text>
                </>
              )}
            </Pressable>
          </>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}
