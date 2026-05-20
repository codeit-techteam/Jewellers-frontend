import { colors } from '@constants/colors';
import { DOCUMENT_TYPE_OPTIONS } from '@constants/profile';
import { uploadDocument } from '@services/profileService';
import { useProfileStore } from '@store/useProfileStore';
import type { BusinessDocument } from '@/types/profile';
import {
  getDocumentIconName,
  getDocumentStatusAccent,
  getDocumentStatusBadge,
} from '@utils/documentHelpers';
import { showComingSoonAlert } from '@utils/storeAlerts';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { navigateBack } from '@lib/navigateBack';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef } from 'react';
import { Alert, Pressable, ScrollView, Text, View, useWindowDimensions } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

async function pickDocumentFile(): Promise<string | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: ['application/pdf', 'image/*'],
    copyToCacheDirectory: true,
  });
  if (result.canceled || !result.assets?.[0]) {
    return null;
  }
  return result.assets[0].uri;
}

function DocumentCard({
  doc,
  body,
  label,
  micro,
  highlight,
  onLayout,
  onView,
  onReplace,
  onUpdate,
}: {
  doc: BusinessDocument;
  body: number;
  label: number;
  micro: number;
  highlight: boolean;
  onLayout: (y: number) => void;
  onView: () => void;
  onReplace: () => void;
  onUpdate: () => void;
}) {
  const badge = getDocumentStatusBadge(doc.status);
  const accent = getDocumentStatusAccent(doc.status);
  const isExpiring = doc.status === 'expiring';
  const isPanOnlyView = doc.type === 'pan';
  const highlightOpacity = useSharedValue(0);

  useEffect(() => {
    if (!highlight) {
      return;
    }
    highlightOpacity.value = withSequence(
      withTiming(0, { duration: 0 }),
      withTiming(0.35, { duration: 280 }),
      withTiming(0, { duration: 280 }),
      withTiming(0.35, { duration: 280 }),
      withTiming(0, { duration: 280 }),
    );
  }, [highlight, highlightOpacity]);

  const highlightStyle = useAnimatedStyle(() => ({
    opacity: highlightOpacity.value,
  }));

  return (
    <View
      onLayout={(event) => onLayout(event.nativeEvent.layout.y)}
      className="mb-3 overflow-hidden rounded-xl border"
      style={{
        borderColor: colors.BORDER,
        backgroundColor: colors.WHITE,
        borderLeftWidth: 4,
        borderLeftColor: accent,
      }}
    >
      <Animated.View
        pointerEvents="none"
        style={[
          {
            position: 'absolute',
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
            backgroundColor: colors.GOLD,
            borderRadius: 12,
          },
          highlightStyle,
        ]}
      />
      <View className="p-4">
      <View className="flex-row items-start">
        <View
          className="mr-3 items-center justify-center rounded-lg"
          style={{
            width: 40,
            height: 40,
            backgroundColor: colors.INFO_BG,
          }}
        >
          <Ionicons name={getDocumentIconName(doc.type)} size={22} color={colors.NAVY} />
        </View>
        <View className="flex-1">
          <Text className="font-bold" style={{ fontSize: body, color: colors.NAVY }}>
            {doc.name}
          </Text>
          <Text style={{ fontSize: micro, color: colors.BODY_TEXT }}>{doc.updatedAt}</Text>
        </View>
        <View className="rounded-full px-2 py-1" style={{ backgroundColor: badge.backgroundColor }}>
          <Text style={{ fontSize: micro, color: badge.color, fontWeight: '700' }}>
            {badge.label}
          </Text>
        </View>
      </View>

      <View className="mt-3 flex-row" style={{ gap: 8 }}>
        {isExpiring ? (
          <Pressable
            onPress={onUpdate}
            className="flex-1 flex-row items-center justify-center rounded-lg py-3"
            style={{ backgroundColor: colors.NAVY }}
          >
            <Text style={{ fontSize: label, color: colors.WHITE, fontWeight: '600' }}>
              📄 Update Document
            </Text>
          </Pressable>
        ) : isPanOnlyView ? (
          <Pressable
            onPress={onView}
            className="flex-1 items-center justify-center rounded-lg border py-3"
            style={{ borderColor: colors.BORDER }}
          >
            <Text style={{ fontSize: label, color: colors.NAVY, fontWeight: '600' }}>
              👁 View Certificate
            </Text>
          </Pressable>
        ) : (
          <>
            <Pressable
              onPress={onView}
              className="flex-1 items-center justify-center rounded-lg border py-3"
              style={{ borderColor: colors.BORDER }}
            >
              <Text style={{ fontSize: label, color: colors.NAVY, fontWeight: '600' }}>
                👁 View
              </Text>
            </Pressable>
            <Pressable
              onPress={onReplace}
              className="flex-1 items-center justify-center rounded-lg border py-3"
              style={{ borderColor: colors.BORDER }}
            >
              <Text style={{ fontSize: label, color: colors.NAVY, fontWeight: '600' }}>
                ↻ Replace
              </Text>
            </Pressable>
          </>
        )}
      </View>
      </View>
    </View>
  );
}

export default function BusinessDocumentsScreen() {
  const router = useRouter();
  const { highlightDoc, returnTo } = useLocalSearchParams<{
    highlightDoc?: string;
    returnTo?: string;
  }>();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const h1 = width * 0.055;
  const h2 = width * 0.048;
  const body = width * 0.038;
  const label = width * 0.032;
  const micro = width * 0.028;

  const documents = useProfileStore((state) => state.documents);
  const updateDocument = useProfileStore((state) => state.updateDocument);
  const addDocument = useProfileStore((state) => state.addDocument);
  const scrollRef = useRef<ScrollView>(null);
  const cardOffsetsRef = useRef<Record<string, number>>({});

  const highlightType =
    highlightDoc === 'gst' || highlightDoc === 'bis' ? highlightDoc : undefined;

  useEffect(() => {
    if (!highlightType) {
      return;
    }
    const target = documents.find((doc) => doc.type === highlightType);
    if (!target) {
      return;
    }
    const offset = cardOffsetsRef.current[target.id];
    if (offset !== undefined) {
      scrollRef.current?.scrollTo({ y: Math.max(0, offset - 12), animated: true });
    }
  }, [highlightType, documents]);

  const handleReplace = async (doc: BusinessDocument) => {
    const uri = await pickDocumentFile();
    if (!uri) {
      return;
    }
    await uploadDocument(doc.type, uri);
    updateDocument(doc.id, {
      fileUri: uri,
      status: 'pending',
      updatedAt: 'Just now',
    });
  };

  const handleAddDocument = () => {
    Alert.alert('Add Document', 'Select document type', [
      ...DOCUMENT_TYPE_OPTIONS.map((item) => ({
        text: item.label,
        onPress: () => {
          void (async () => {
            const uri = await pickDocumentFile();
            if (!uri) {
              return;
            }
            await uploadDocument(item.type, uri);
            addDocument({
              id: String(Date.now()),
              name: item.label,
              type: item.type,
              status: 'pending',
              updatedAt: 'Just now',
              fileUri: uri,
            });
          })();
        },
      })),
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  return (
    <View className="flex-1 bg-white" style={{ paddingTop: insets.top + 8 }}>
      <StatusBar style="dark" />

      <View className="mb-4 flex-row items-center px-5">
        <Pressable
          onPress={() => navigateBack(router, returnTo)}
          className="h-10 w-10 items-center justify-center rounded-full"
          style={{ backgroundColor: colors.SURFACE_MUTED }}
        >
          <Ionicons name="chevron-back" size={width * 0.06} color={colors.NAVY} />
        </Pressable>
        <Text
          className="flex-1 text-center font-bold"
          style={{ fontSize: h2, color: colors.NAVY, marginRight: width * 0.1 }}
        >
          Business Documents
        </Text>
      </View>

      <ScrollView
        ref={scrollRef}
        className="flex-1 px-5"
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        showsVerticalScrollIndicator={false}
      >
        <Text className="font-bold" style={{ fontSize: h1, color: colors.NAVY }}>
          Manage Certificates
        </Text>
        <Text className="mt-2 leading-relaxed" style={{ fontSize: body, color: colors.BODY_TEXT }}>
          Upload and manage your business compliance documents to maintain your verified status
          on the platform.
        </Text>

        {documents.map((doc) => (
          <DocumentCard
            key={doc.id}
            doc={doc}
            body={body}
            label={label}
            micro={micro}
            highlight={highlightType === doc.type}
            onLayout={(y) => {
              cardOffsetsRef.current[doc.id] = y;
            }}
            onView={() => Alert.alert('Coming Soon', 'Document viewer coming soon')}
            onReplace={() => void handleReplace(doc)}
            onUpdate={() => void handleReplace(doc)}
          />
        ))}

        <Pressable
          onPress={handleAddDocument}
          className="mb-4 items-center justify-center rounded-xl border border-dashed py-10"
          style={{ borderColor: colors.BORDER }}
        >
          <Ionicons name="add" size={32} color={colors.BODY_TEXT} />
          <Text className="mt-2" style={{ fontSize: body, color: colors.BODY_TEXT }}>
            Add another document
          </Text>
        </Pressable>

        <View
          className="rounded-xl p-4"
          style={{ backgroundColor: colors.INFO_BG }}
        >
          <View className="flex-row items-center">
            <Ionicons name="information-circle-outline" size={22} color={colors.NAVY} />
            <Text className="ml-2 font-bold" style={{ fontSize: body, color: colors.NAVY }}>
              Verification Status
            </Text>
          </View>
          <Text className="mt-2" style={{ fontSize: micro, color: colors.BODY_TEXT }}>
            Keeping your documents verified increases your business trust score and allows you to
            participate in premium diamond auctions.
          </Text>
        </View>
      </ScrollView>

      <Pressable
        onPress={showComingSoonAlert}
        className="absolute items-center justify-center rounded-full"
        style={{
          width: 52,
          height: 52,
          backgroundColor: colors.NAVY,
          right: 20,
          bottom: insets.bottom + 24,
        }}
      >
        <Ionicons name="help-circle-outline" size={28} color={colors.WHITE} />
      </Pressable>
    </View>
  );
}
