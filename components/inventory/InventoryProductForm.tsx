import { SelectPickerModal } from '@components/ui/SelectPickerModal';
import { pickImageFromLibrary } from '@components/ui/DocumentUploader';
import {
  CollectionNameSection,
  GenderChipSection,
  MultiChipSection,
  PuritySection,
} from '@components/inventory/ProductFormChips';
import { colors } from '@constants/colors';
import * as ImagePicker from 'expo-image-picker';
import {
  DEFAULT_PURITY,
  GENDER_CHIP_OPTIONS,
  METAL_OPTIONS,
  OCCASION_OPTIONS,
  STYLE_OPTIONS,
} from '@constants/inventory';
import { useCategories } from '@hooks/useCategories';
import { useCollections } from '@hooks/useCollections';
import type { SelectOption } from '@components/ui/SelectPickerModal';
import { formatCategoryName } from '@utils/categoryLabel';
import type { InventoryProduct } from '@/types/inventory';
import {
  inventoryProductDraftSchema,
  inventoryProductEditSchema,
  inventoryProductStrictSchema,
} from '@utils/inventoryFormSchema';
import { generateProductSku, resolveProductPrice } from '@utils/calculateProductPrice';
import { dialog } from '@utils/dialog';
import { normalizeGenderValues, parseStringArrayField } from '@utils/productTagFields';
import { Ionicons } from '@expo/vector-icons';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useRef, useState } from 'react';
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export type InventoryFormSubmitMode = 'draft' | 'publish' | 'update' | 'delete';

type InventoryProductFormProps = {
  mode: 'add' | 'edit';
  initialProduct?: InventoryProduct;
  isSubmitting: boolean;
  onSubmit: (product: InventoryProduct, mode: InventoryFormSubmitMode) => void;
  onDelete?: () => void;
  /** When true, footer sits directly above the tab bar — skip safe-area bottom padding */
  embeddedInTabs?: boolean;
};

type PriceBreakupState = { gold: string; gemstone: string; makingCharge: string; gst: string };
type SpecificationsState = { carat: string; dimensions: string; certification: string };

type FormValues = {
  name: string;
  categoryId: string;
  weight: string;
  purity?: string;
  makingChargesType: 'percentage' | 'flat';
  makingChargesValue: string;
  description?: string;
  discountPercent?: string;
};

const RING_SIZES = ['6', '8', '10', '12', '14', '16', '18', '20'];
const BANGLE_SIZES = ['2/2', '2/4', '2/6', '2/8', '2/10', '2/12'];
const WRIST_SIZES = ['6"', '6.5"', '7"', '7.5"', '8"', '8.5"'];
const CHAIN_LENGTHS = ['14', '16', '18', '20', '22', '24'];
const GENERAL_SIZES = ['XS', 'S', 'M', 'L', 'XL'];

// ── Category-specific field config ───────────────────────────────────────────

type CategoryConfig = {
  /** Which size chips to show */
  sizeType: 'ring' | 'bangle' | 'wrist' | 'chain' | 'general' | 'none';
  sizeLabel: string;
  sizeOptions: string[];
  /** Whether to show the sizes section at all */
  showSizes: boolean;
};

function getCategoryConfig(categoryName: string): CategoryConfig {
  const n = categoryName.toLowerCase();

  if (n.includes('ring') || n.includes('solitaire')) {
    return { sizeType: 'ring', sizeLabel: 'Ring Sizes', sizeOptions: RING_SIZES, showSizes: true };
  }
  if (n.includes('bangle')) {
    return { sizeType: 'bangle', sizeLabel: 'Bangle Sizes', sizeOptions: BANGLE_SIZES, showSizes: true };
  }
  if (n.includes('bracelet')) {
    return { sizeType: 'wrist', sizeLabel: 'Wrist Sizes', sizeOptions: WRIST_SIZES, showSizes: true };
  }
  if (n.includes('necklace') || n.includes('mangalsutra') || n.includes('pendant')) {
    return { sizeType: 'chain', sizeLabel: 'Chain Lengths', sizeOptions: CHAIN_LENGTHS, showSizes: true };
  }
  if (n.includes('earring') || n.includes('nose') || n.includes('coin')) {
    return { sizeType: 'none', sizeLabel: '', sizeOptions: [], showSizes: false };
  }
  // Default: show general sizes for uncategorised / unknown categories
  return { sizeType: 'general', sizeLabel: 'Available Sizes', sizeOptions: [...RING_SIZES, ...GENERAL_SIZES], showSizes: true };
}

const defaultFormValues: FormValues = {
  name: '',
  categoryId: '',
  weight: '',
  purity: '',
  makingChargesType: 'percentage',
  makingChargesValue: '5.00',
  description: '',
  discountPercent: '',
};

// ── Collapsible section header ────────────────────────────────────────────────

type CollapsibleHeaderProps = {
  title: string;
  subtitle?: string;
  expanded: boolean;
  onToggle: () => void;
  body: number;
  micro: number;
  width: number;
};

function CollapsibleHeader({ title, subtitle, expanded, onToggle, body, micro, width }: CollapsibleHeaderProps) {
  return (
    <Pressable onPress={onToggle} className="mt-4 flex-row items-center justify-between py-2">
      <View style={{ flex: 1 }}>
        <Text className="font-semibold" style={{ fontSize: body, color: colors.NAVY }}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={{ fontSize: micro, color: colors.BODY_TEXT }}>{subtitle}</Text>
        ) : null}
      </View>
      <Ionicons
        name={expanded ? 'chevron-up' : 'chevron-down'}
        size={width * 0.05}
        color={colors.NAVY}
      />
    </Pressable>
  );
}

// ── Numeric input with ₹ prefix ───────────────────────────────────────────────

type RupeeInputProps = {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  body: number;
  micro: number;
  label2: number;
};

function RupeeInput({ label, value, onChangeText, placeholder = '0', body, micro, label2 }: RupeeInputProps) {
  return (
    <View style={{ flex: 1 }}>
      <Text className="mb-1" style={{ fontSize: micro, color: colors.BODY_TEXT }}>
        {label}
      </Text>
      <View
        className="flex-row items-center rounded-xl border bg-white px-3"
        style={{ borderColor: colors.BORDER }}
      >
        <Text style={{ fontSize: body, color: colors.NAVY }}>₹</Text>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          keyboardType="numeric"
          placeholderTextColor={colors.BODY_TEXT}
          style={{ flex: 1, fontSize: label2, color: colors.NAVY, paddingVertical: 8, marginLeft: 4 }}
        />
      </View>
    </View>
  );
}

// ── Main form ─────────────────────────────────────────────────────────────────

function SaveProductCheckIcon() {
  return (
    <View
      style={{
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text style={{ color: colors.WHITE, fontSize: 11, fontWeight: '700' }}>✓</Text>
    </View>
  );
}

export function InventoryProductForm({
  mode,
  initialProduct,
  isSubmitting,
  onSubmit,
  onDelete,
  embeddedInTabs = false,
}: InventoryProductFormProps) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const h2 = width * 0.048;
  const body = width * 0.038;
  const label = width * 0.032;
  const micro = width * 0.028;

  // ── Images ─────────────────────────────────────────────────────────────────
  const [imageUris, setImageUris] = useState<string[]>(
    initialProduct?.imageUris?.length
      ? initialProduct.imageUris
      : initialProduct?.imageUri
        ? [initialProduct.imageUri]
        : [],
  );

  // ── Video ──────────────────────────────────────────────────────────────────
  const [videoUri, setVideoUri] = useState<string>(initialProduct?.videoUri ?? initialProduct?.videoUrl ?? '');

  // ── Category / purity pickers ──────────────────────────────────────────────
  const { data: categories = [], isLoading: isLoadingCategories } = useCategories();
  const { data: cmsCollections = [], isLoading: collectionsLoading } = useCollections();
  const categoryOptions: SelectOption[] = categories.map((c) => ({
    value: c.id,
    label: formatCategoryName(c.name),
  }));
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);

  // ── Tag / enrichment state ─────────────────────────────────────────────────
  const [gender, setGender] = useState<string[]>(
    normalizeGenderValues(parseStringArrayField(initialProduct?.gender)),
  );
  const [occasion, setOccasion] = useState<string[]>(
    parseStringArrayField(initialProduct?.occasion),
  );
  const [style, setStyle] = useState<string[]>(parseStringArrayField(initialProduct?.style));
  const [selectedCollectionIds, setSelectedCollectionIds] = useState<string[]>(
    initialProduct?.collectionIds?.length ? [...initialProduct.collectionIds] : [],
  );
  const legacyCollectionsHydrated = useRef(false);

  useEffect(() => {
    if (legacyCollectionsHydrated.current) return;
    if (selectedCollectionIds.length > 0 || cmsCollections.length === 0) return;

    const legacyNames = initialProduct?.collections?.length
      ? initialProduct.collections
      : initialProduct?.collectionName
        ? [initialProduct.collectionName]
        : [];
    if (!legacyNames.length) return;

    const matched = cmsCollections
      .filter((col) =>
        legacyNames.some((name) => name.trim().toLowerCase() === col.title.trim().toLowerCase()),
      )
      .map((col) => col.id);

    if (matched.length > 0) {
      setSelectedCollectionIds(matched);
      legacyCollectionsHydrated.current = true;
    }
  }, [cmsCollections, initialProduct, selectedCollectionIds.length]);
  const [availableSizes, setAvailableSizes] = useState<string[]>(
    initialProduct?.availableSizes ?? [],
  );
  const [availableMetals, setAvailableMetals] = useState<string[]>(
    initialProduct?.availableMetals ?? [],
  );
  const [priceBreakup, setPriceBreakup] = useState<PriceBreakupState>({
    gold: initialProduct?.priceBreakup?.gold ? String(initialProduct.priceBreakup.gold) : '',
    gemstone: initialProduct?.priceBreakup?.gemstone ? String(initialProduct.priceBreakup.gemstone) : '',
    makingCharge: initialProduct?.priceBreakup?.makingCharge
      ? String(initialProduct.priceBreakup.makingCharge)
      : '',
    gst: initialProduct?.priceBreakup?.gst ? String(initialProduct.priceBreakup.gst) : '',
  });
  const [specifications, setSpecifications] = useState<SpecificationsState>({
    carat: initialProduct?.specifications?.carat ?? '',
    dimensions: initialProduct?.specifications?.dimensions ?? '',
    certification: initialProduct?.specifications?.certification ?? '',
  });

  // ── Collapsible sections ───────────────────────────────────────────────────
  const [priceBreakupExpanded, setPriceBreakupExpanded] = useState(false);
  const [specsExpanded, setSpecsExpanded] = useState(false);

  const priceBreakupHeight = useSharedValue(0);
  const specsHeight = useSharedValue(0);

  const priceBreakupAnimStyle = useAnimatedStyle(() => ({
    overflow: 'hidden',
    maxHeight: priceBreakupHeight.value,
    opacity: priceBreakupHeight.value > 0 ? 1 : 0,
  }));

  const specsAnimStyle = useAnimatedStyle(() => ({
    overflow: 'hidden',
    maxHeight: specsHeight.value,
    opacity: specsHeight.value > 0 ? 1 : 0,
  }));

  const togglePriceBreakup = () => {
    const next = !priceBreakupExpanded;
    setPriceBreakupExpanded(next);
    priceBreakupHeight.value = withTiming(next ? 360 : 0, { duration: 250 });
  };

  const toggleSpecs = () => {
    const next = !specsExpanded;
    setSpecsExpanded(next);
    specsHeight.value = withTiming(next ? 220 : 0, { duration: 250 });
  };

  // ── React-hook-form ────────────────────────────────────────────────────────
  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(
      mode === 'edit' ? inventoryProductEditSchema : inventoryProductStrictSchema,
    ),
    defaultValues: initialProduct
      ? {
          name: initialProduct.name,
          categoryId: initialProduct.categoryId,
          weight: initialProduct.weight > 0 ? String(initialProduct.weight) : '',
          purity: initialProduct.purity || DEFAULT_PURITY,
          makingChargesType: initialProduct.makingChargesType,
          makingChargesValue: String(initialProduct.makingChargesValue),
          description: initialProduct.description ?? initialProduct.additionalDetails ?? '',
          discountPercent: initialProduct.discountPercent
            ? String(initialProduct.discountPercent)
            : '',
        }
      : defaultFormValues,
    mode: 'onChange',
  });

  const makingChargesType = watch('makingChargesType');
  const selectedCategoryId = watch('categoryId');
  const selectedCategoryLabel =
    categoryOptions.find((c) => c.value === selectedCategoryId)?.label ?? '';

  // Derive dynamic size config from the selected category name
  const categoryConfig = getCategoryConfig(selectedCategoryLabel);

  // ── Image handlers ─────────────────────────────────────────────────────────
  const handleAddImage = async () => {
    if (imageUris.length >= 5) {
      void dialog.alert('Limit reached', 'You can upload up to 5 images per product.');
      return;
    }
    const picked = await pickImageFromLibrary();
    if (picked?.fileUri) {
      setImageUris((prev) => [...prev, picked.fileUri]);
    }
  };

  const handleRemoveImage = (uri: string) => {
    setImageUris((prev) => prev.filter((item) => item !== uri));
  };

  // ── Video handlers ─────────────────────────────────────────────────────────
  const handlePickVideo = async () => {
    const granted = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!granted.granted) {
      void dialog.alert('Permission required', 'Photo library access is needed to pick a video.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['videos'],
      quality: 1,
    });
    if (!result.canceled && result.assets[0]) {
      setVideoUri(result.assets[0].uri);
    }
  };

  const handleRemoveVideo = () => setVideoUri('');

  // ── Chip togglers ──────────────────────────────────────────────────────────
  const toggleSize = (val: string) =>
    setAvailableSizes((prev) =>
      prev.includes(val) ? prev.filter((v) => v !== val) : [...prev, val],
    );

  const toggleMetal = (val: string) =>
    setAvailableMetals((prev) =>
      prev.includes(val) ? prev.filter((v) => v !== val) : [...prev, val],
    );

  const toggleArrayValue = (
    setter: (fn: (prev: string[]) => string[]) => void,
    val: string,
  ) => setter((prev) => (prev.includes(val) ? prev.filter((v) => v !== val) : [...prev, val]));

  const toggleCollection = (id: string) => toggleArrayValue(setSelectedCollectionIds, id);

  // ── Build product ──────────────────────────────────────────────────────────
  const buildProduct = (values: FormValues, isDraft: boolean): InventoryProduct => {
    const weight = Number(values.weight) || 0;
    const makingChargesValue = Number(values.makingChargesValue) || 0;
    const pbGold = Number(priceBreakup.gold) || 0;
    const pbGemstone = Number(priceBreakup.gemstone) || 0;
    const pbMaking = Number(priceBreakup.makingCharge) || 0;
    const pbGst = Number(priceBreakup.gst) || 0;
    const hasPriceBreakup = pbGold || pbGemstone || pbMaking || pbGst;

    const resolvedBreakup = hasPriceBreakup
      ? {
          gold: pbGold,
          gemstone: pbGemstone,
          makingCharge: pbMaking,
          gst: pbGst,
          total: pbGold + pbGemstone + pbMaking + pbGst,
        }
      : undefined;

    const price = isDraft
      ? 0
      : resolveProductPrice(
          weight,
          values.makingChargesType,
          makingChargesValue,
          resolvedBreakup,
        );

    const categoryName =
      categories.find((c) => c.id === values.categoryId)?.name ?? selectedCategoryLabel;

    const hasSpecs =
      specifications.carat || specifications.dimensions || specifications.certification;

    return {
      id: initialProduct?.id ?? `inv-${Date.now()}`,
      name: values.name.trim(),
      sku: initialProduct?.sku ?? generateProductSku(categoryName || 'PR'),
      categoryId: values.categoryId,
      category: categoryName || '—',
      price,
      weight,
      purity: values.purity?.trim() || '',
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
      description: values.description || undefined,
      additionalDetails: values.description || undefined,
      gender: gender.length > 0 ? gender : undefined,
      occasion: occasion.length > 0 ? occasion : undefined,
      style: style.length > 0 ? style : undefined,
      collectionIds: selectedCollectionIds,
      availableSizes: availableSizes.length > 0 ? availableSizes : undefined,
      availableMetals: availableMetals.length > 0 ? availableMetals : undefined,
      discountPercent: values.discountPercent ? Number(values.discountPercent) : undefined,
      priceBreakup: resolvedBreakup,
      specifications: hasSpecs
        ? {
            carat: specifications.carat || undefined,
            dimensions: specifications.dimensions || undefined,
            certification: specifications.certification || undefined,
          }
        : undefined,
      collectionName:
        cmsCollections.find((c) => c.id === selectedCollectionIds[0])?.title ??
        initialProduct?.collectionName,
      videoUri: videoUri || undefined,
    };
  };

  // ── Submit handlers ────────────────────────────────────────────────────────
  const onSaveDraft = () => {
    const values = watch();
    const parsed = inventoryProductDraftSchema.safeParse(values);
    if (!parsed.success) return;
    onSubmit(buildProduct(values, true), 'draft');
  };

  const onSaveProduct = handleSubmit((values: FormValues) => {
    if (imageUris.length === 0) {
      void dialog.alert('Image required', 'Add at least one product photo before saving.');
      return;
    }
    const product = buildProduct(values, false);
    if (mode === 'edit') {
      onSubmit(
        product,
        'update',
      );
      return;
    }
    onSubmit(product, 'publish');
  });

  // ── Price breakup total ────────────────────────────────────────────────────
  const pbTotal =
    (Number(priceBreakup.gold) || 0) +
    (Number(priceBreakup.gemstone) || 0) +
    (Number(priceBreakup.makingCharge) || 0) +
    (Number(priceBreakup.gst) || 0);

  const canSaveProduct = !isSubmitting && imageUris.length > 0;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={{ flex: 1, backgroundColor: colors.WHITE }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 12,
          paddingBottom: 16,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── Product Name ── */}
        <Text className="mb-1 mt-1 font-medium" style={{ fontSize: label, color: colors.NAVY }}>
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
              placeholder="e.g. Emerald Drop Necklace"
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

        {/* ── Category ── */}
        <Text className="mb-1 mt-3 font-medium" style={{ fontSize: label, color: colors.NAVY }}>
          Category
        </Text>
        <Controller
          control={control}
          name="categoryId"
          render={({ field: { onChange, value } }) => (
            <>
              <Pressable
                onPress={() => {
                  if (!isLoadingCategories && categoryOptions.length > 0) {
                    setCategoryModalVisible(true);
                  }
                }}
                className="flex-row items-center justify-between rounded-xl border px-4 py-3"
                style={{ borderColor: errors.categoryId ? colors.ERROR : colors.BORDER }}
              >
                <Text style={{ fontSize: body, color: value ? colors.NAVY : colors.BODY_TEXT }}>
                  {isLoadingCategories
                    ? 'Loading categories…'
                    : selectedCategoryLabel || 'Select Category'}
                </Text>
                <Ionicons name="chevron-down" size={width * 0.04} color={colors.BODY_TEXT} />
              </Pressable>
              <SelectPickerModal
                visible={categoryModalVisible}
                title="Select category"
                options={categoryOptions}
                selectedValue={value}
                onSelect={onChange}
                onClose={() => setCategoryModalVisible(false)}
              />
            </>
          )}
        />
        {errors.categoryId ? (
          <Text style={{ fontSize: micro, color: colors.ERROR }}>{errors.categoryId.message}</Text>
        ) : null}

        {/* ── Product Images ── */}
        <View style={{ marginTop: 4 }}>
          {imageUris.length === 0 ? (
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
                Add Product Photos
              </Text>
              <Text className="mt-1 text-center" style={{ fontSize: micro, color: colors.BODY_TEXT }}>
                Upload up to 5 high-quality photos
              </Text>
            </Pressable>
          ) : (
            <>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View className="flex-row" style={{ gap: 8, paddingVertical: 4 }}>
                  {imageUris.map((uri) => (
                    <View key={uri} style={{ position: 'relative' }}>
                      <Image
                        source={{ uri }}
                        style={{ width: 80, height: 80, borderRadius: 10 }}
                      />
                      <Pressable
                        onPress={() => handleRemoveImage(uri)}
                        style={{
                          position: 'absolute',
                          top: -6,
                          right: -6,
                          width: 22,
                          height: 22,
                          borderRadius: 11,
                          backgroundColor: colors.ERROR,
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Ionicons name="close" size={12} color={colors.WHITE} />
                      </Pressable>
                    </View>
                  ))}
                  {imageUris.length < 5 && (
                    <Pressable
                      onPress={() => void handleAddImage()}
                      style={{
                        width: 80,
                        height: 80,
                        borderRadius: 10,
                        borderWidth: 1.5,
                        borderStyle: 'dashed',
                        borderColor: colors.UPLOAD_BORDER_DASHED,
                        backgroundColor: colors.UPLOAD_BG,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Ionicons name="add" size={28} color={colors.NAVY} />
                      <Text style={{ fontSize: micro, color: colors.NAVY, marginTop: 2 }}>Add</Text>
                    </Pressable>
                  )}
                </View>
              </ScrollView>
              <Text className="mt-1" style={{ fontSize: micro, color: colors.BODY_TEXT }}>
                {imageUris.length}/5 photos · Tap × to remove
              </Text>
            </>
          )}
        </View>

        {/* ── Short Product Video ── */}
        <View style={{ height: 1, backgroundColor: colors.BORDER, marginTop: 16 }} />
        <Text className="mt-4 font-bold" style={{ fontSize: body, color: colors.NAVY }}>
          Product Video{' '}
          <Text style={{ fontSize: micro, color: colors.BODY_TEXT, fontWeight: '400' }}>
            (optional · 4–5 sec)
          </Text>
        </Text>
        <Text className="mb-2" style={{ fontSize: micro, color: colors.BODY_TEXT }}>
          Show your product in motion — a short clip increases customer interest
        </Text>
        {videoUri ? (
          <View
            className="flex-row items-center rounded-xl border px-3 py-3"
            style={{ borderColor: colors.SUCCESS, backgroundColor: '#F0FDF4' }}
          >
            <View
              className="items-center justify-center rounded-full"
              style={{ width: 36, height: 36, backgroundColor: colors.SUCCESS }}
            >
              <Ionicons name="videocam" size={18} color={colors.WHITE} />
            </View>
            <View className="ml-3 flex-1">
              <Text style={{ fontSize: label, fontWeight: '600', color: colors.NAVY }}>
                Video selected
              </Text>
              <Text style={{ fontSize: micro, color: colors.BODY_TEXT }} numberOfLines={1}>
                {videoUri.startsWith('http') ? 'Uploaded video' : videoUri.split('/').pop()}
              </Text>
            </View>
            <Pressable onPress={handleRemoveVideo} hitSlop={8}>
              <Ionicons name="close-circle" size={22} color={colors.ERROR} />
            </Pressable>
          </View>
        ) : (
          <Pressable
            onPress={() => void handlePickVideo()}
            className="flex-row items-center justify-center rounded-xl border border-dashed py-4"
            style={{ borderColor: colors.UPLOAD_BORDER_DASHED, backgroundColor: colors.UPLOAD_BG }}
          >
            <Ionicons name="videocam-outline" size={22} color={colors.NAVY} />
            <Text className="ml-2 font-semibold" style={{ fontSize: label, color: colors.NAVY }}>
              Pick a Short Video
            </Text>
          </Pressable>
        )}

        {/* ── Weight ── */}
        <View className="mt-4">
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
                <Text style={{ fontSize: micro, color: colors.BODY_TEXT }}>g</Text>
              </View>
            )}
          />
          {errors.weight ? (
            <Text style={{ fontSize: micro, color: colors.ERROR }}>{errors.weight.message}</Text>
          ) : null}
        </View>

        {/* ── Making Charges ── */}
        <View className="mt-4 rounded-xl p-3" style={{ backgroundColor: colors.SURFACE_MUTED }}>
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
                  style={{
                    fontSize: body,
                    color: colors.NAVY,
                    marginLeft: makingChargesType === 'flat' ? 4 : 0,
                  }}
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

        {/* ── SECTION 2: Description ── */}
        <View style={{ height: 1, backgroundColor: colors.BORDER, marginTop: 20 }} />
        <Text className="mb-1 mt-4 font-medium" style={{ fontSize: label, color: colors.NAVY }}>
          Product Description
        </Text>
        <Controller
          control={control}
          name="description"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              placeholder="Describe your product in detail..."
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

        {/* ── Tags: Gender, Occasion, Style ── */}
        <View style={{ height: 1, backgroundColor: colors.BORDER, marginTop: 20 }} />

        <GenderChipSection
          options={GENDER_CHIP_OPTIONS}
          selected={gender}
          onToggle={(val) => toggleArrayValue(setGender, val)}
          labelSize={label}
          micro={micro}
        />

        <MultiChipSection
          label="Occasion"
          optional
          options={[...OCCASION_OPTIONS]}
          selected={occasion}
          onToggle={(val) => toggleArrayValue(setOccasion, val)}
          labelSize={label}
          micro={micro}
        />

        <MultiChipSection
          label="Style"
          optional
          options={[...STYLE_OPTIONS]}
          selected={style}
          onToggle={(val) => toggleArrayValue(setStyle, val)}
          labelSize={label}
          micro={micro}
        />

        <CollectionNameSection
          collections={cmsCollections}
          loading={collectionsLoading}
          selectedIds={selectedCollectionIds}
          onToggle={toggleCollection}
          labelSize={label}
          micro={micro}
        />

        <Controller
          control={control}
          name="purity"
          render={({ field: { onChange, value } }) => (
            <PuritySection
              purity={value ?? ''}
              onSelectPreset={(preset) => onChange(preset)}
              onCustomChange={onChange}
              labelSize={label}
              micro={micro}
              body={body}
            />
          )}
        />

        {/* ── Available Sizes (dynamic by category) ── */}
        {categoryConfig.showSizes && (
          <>
            <View style={{ height: 1, backgroundColor: colors.BORDER, marginTop: 20 }} />
            <MultiChipSection
              label={categoryConfig.sizeLabel}
              optional
              subtitle={
                availableSizes.length === 0 ? 'Tap to select available sizes' : undefined
              }
              options={categoryConfig.sizeOptions}
              selected={availableSizes}
              onToggle={toggleSize}
              labelSize={label}
              micro={micro}
            />
          </>
        )}

        {/* ── Available Metals ── */}
        <View style={{ height: 1, backgroundColor: colors.BORDER, marginTop: 20 }} />

        <MultiChipSection
          label="Available Metals"
          optional
          options={[...METAL_OPTIONS]}
          selected={availableMetals}
          onToggle={toggleMetal}
          labelSize={label}
          micro={micro}
        />

        {/* ── Price Breakup ── */}
        <View style={{ height: 1, backgroundColor: colors.BORDER, marginTop: 20 }} />
        <CollapsibleHeader
          title="Price Breakup"
          subtitle="This appears on customer product page · optional"
          expanded={priceBreakupExpanded}
          onToggle={togglePriceBreakup}
          body={body}
          micro={micro}
          width={width}
        />
        <Animated.View style={priceBreakupAnimStyle}>
          <View style={{ paddingTop: 4, paddingBottom: 8 }}>
            <View className="flex-row" style={{ gap: 10, marginBottom: 10 }}>
              <RupeeInput
                label="Gold / Metal Value"
                value={priceBreakup.gold}
                onChangeText={(v) => setPriceBreakup((p) => ({ ...p, gold: v }))}
                body={body}
                micro={micro}
                label2={label}
              />
              <RupeeInput
                label="Gemstone Value"
                value={priceBreakup.gemstone}
                onChangeText={(v) => setPriceBreakup((p) => ({ ...p, gemstone: v }))}
                body={body}
                micro={micro}
                label2={label}
              />
            </View>
            <View className="flex-row" style={{ gap: 10, marginBottom: 10 }}>
              <RupeeInput
                label="Making Charges"
                value={priceBreakup.makingCharge}
                onChangeText={(v) => setPriceBreakup((p) => ({ ...p, makingCharge: v }))}
                body={body}
                micro={micro}
                label2={label}
              />
              <RupeeInput
                label="GST"
                value={priceBreakup.gst}
                onChangeText={(v) => setPriceBreakup((p) => ({ ...p, gst: v }))}
                body={body}
                micro={micro}
                label2={label}
              />
            </View>
            <View
              className="flex-row items-center justify-between rounded-xl px-4 py-3"
              style={{ backgroundColor: colors.SURFACE_MUTED }}
            >
              <Text className="font-semibold" style={{ fontSize: label, color: colors.NAVY }}>
                Total
              </Text>
              <Text className="font-bold" style={{ fontSize: body, color: colors.NAVY }}>
                ₹{pbTotal.toLocaleString('en-IN')}
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* ── SECTION 7: Specifications ── */}
        <View style={{ height: 1, backgroundColor: colors.BORDER, marginTop: 4 }} />
        <CollapsibleHeader
          title="Product Specifications"
          subtitle="Optional"
          expanded={specsExpanded}
          onToggle={toggleSpecs}
          body={body}
          micro={micro}
          width={width}
        />
        <Animated.View style={specsAnimStyle}>
          <View style={{ paddingTop: 4, paddingBottom: 8, gap: 10 }}>
            <View>
              <Text className="mb-1" style={{ fontSize: micro, color: colors.BODY_TEXT }}>
                Diamond / Stone Carat
              </Text>
              <TextInput
                value={specifications.carat}
                onChangeText={(v) => setSpecifications((s) => ({ ...s, carat: v }))}
                placeholder="e.g. 0.24 CT"
                placeholderTextColor={colors.BODY_TEXT}
                className="rounded-xl border px-4 py-3"
                style={{ borderColor: colors.BORDER, fontSize: label, color: colors.NAVY }}
              />
            </View>
            <View>
              <Text className="mb-1" style={{ fontSize: micro, color: colors.BODY_TEXT }}>
                Dimensions
              </Text>
              <TextInput
                value={specifications.dimensions}
                onChangeText={(v) => setSpecifications((s) => ({ ...s, dimensions: v }))}
                placeholder="e.g. 20mm x 20mm"
                placeholderTextColor={colors.BODY_TEXT}
                className="rounded-xl border px-4 py-3"
                style={{ borderColor: colors.BORDER, fontSize: label, color: colors.NAVY }}
              />
            </View>
            <View>
              <Text className="mb-1" style={{ fontSize: micro, color: colors.BODY_TEXT }}>
                Certification
              </Text>
              <TextInput
                value={specifications.certification}
                onChangeText={(v) => setSpecifications((s) => ({ ...s, certification: v }))}
                placeholder="e.g. IGI Certified"
                placeholderTextColor={colors.BODY_TEXT}
                className="rounded-xl border px-4 py-3"
                style={{ borderColor: colors.BORDER, fontSize: label, color: colors.NAVY }}
              />
            </View>
          </View>
        </Animated.View>

        {/* ── SECTION 8: Discount ── */}
        <View style={{ height: 1, backgroundColor: colors.BORDER, marginTop: 4 }} />
        <Text className="mb-1 mt-4 font-medium" style={{ fontSize: label, color: colors.NAVY }}>
          Discount on Making Charges (%)
        </Text>
        <Controller
          control={control}
          name="discountPercent"
          render={({ field: { onChange, onBlur, value } }) => (
            <View
              className="flex-row items-center rounded-xl border px-4"
              style={{ borderColor: errors.discountPercent ? colors.ERROR : colors.BORDER }}
            >
              <TextInput
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder="0"
                keyboardType="numeric"
                placeholderTextColor={colors.BODY_TEXT}
                className="flex-1 py-3"
                style={{ fontSize: body, color: colors.NAVY }}
              />
              <Text style={{ fontSize: body, color: colors.BODY_TEXT }}>%</Text>
            </View>
          )}
        />
        <Text className="mt-1" style={{ fontSize: micro, color: colors.BODY_TEXT }}>
          Example: 20 = 20% OFF on Making Charges
        </Text>
        {errors.discountPercent ? (
          <Text style={{ fontSize: micro, color: colors.ERROR }}>
            {errors.discountPercent.message}
          </Text>
        ) : null}
      </ScrollView>

      {/* ── Footer — flush above tab bar when embeddedInTabs ── */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          paddingHorizontal: 16,
          paddingTop: 14,
          paddingBottom: embeddedInTabs ? 14 : insets.bottom + 14,
          backgroundColor: colors.WHITE,
          borderTopWidth: 0.5,
          borderTopColor: colors.BORDER,
        }}
      >
        {mode === 'add' ? (
          <>
            <Pressable
              onPress={onSaveDraft}
              disabled={isSubmitting}
              style={{
                flex: 1,
                height: 52,
                borderRadius: 14,
                borderWidth: 1.5,
                borderColor: colors.GOLD,
                backgroundColor: colors.WHITE,
                alignItems: 'center',
                justifyContent: 'center',
                opacity: isSubmitting ? 0.5 : 1,
              }}
            >
              <Text
                style={{
                  color: '#1A1A2E',
                  fontSize: 15,
                  fontWeight: '600',
                  letterSpacing: 0.2,
                }}
              >
                Save Draft
              </Text>
            </Pressable>
            <Pressable
              onPress={() => void onSaveProduct()}
              disabled={!canSaveProduct}
              style={{
                flex: 1.4,
                height: 52,
                borderRadius: 14,
                backgroundColor: colors.NAVY,
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'row',
                gap: 8,
                opacity: !canSaveProduct ? 0.45 : 1,
              }}
            >
              {isSubmitting ? (
                <ActivityIndicator color={colors.WHITE} />
              ) : (
                <>
                  <SaveProductCheckIcon />
                  <Text
                    style={{
                      color: colors.WHITE,
                      fontSize: 15,
                      fontWeight: '700',
                      letterSpacing: 0.2,
                    }}
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
              style={{
                flex: 1,
                height: 52,
                borderRadius: 14,
                borderWidth: 1.5,
                borderColor: colors.ERROR,
                backgroundColor: colors.WHITE,
                alignItems: 'center',
                justifyContent: 'center',
                opacity: isSubmitting ? 0.5 : 1,
              }}
            >
              <Text style={{ fontSize: 15, fontWeight: '600', color: colors.ERROR }}>
                Delete Product
              </Text>
            </Pressable>
            <Pressable
              onPress={() => void onSaveProduct()}
              disabled={isSubmitting}
              style={{
                flex: 1.4,
                height: 52,
                borderRadius: 14,
                backgroundColor: colors.NAVY,
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'row',
                gap: 8,
                opacity: isSubmitting ? 0.5 : 1,
              }}
            >
              {isSubmitting ? (
                <ActivityIndicator color={colors.WHITE} />
              ) : (
                <>
                  <SaveProductCheckIcon />
                  <Text
                    style={{
                      color: colors.WHITE,
                      fontSize: 15,
                      fontWeight: '700',
                      letterSpacing: 0.2,
                    }}
                  >
                    Save Product
                  </Text>
                </>
              )}
            </Pressable>
          </>
        )}
      </View>
      </View>
    </KeyboardAvoidingView>
  );
}
