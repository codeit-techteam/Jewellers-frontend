import { CheckCircleIcon, CloudUploadIcon, DocumentIcon, TrashIcon } from '@components/ui/OnboardingIcons';
import { colors } from '@constants/colors';
import { useFontScale } from '@hooks/useFontScale';
import type { Step2Data } from '@/types/onboarding';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { Image, Pressable, Text, View } from 'react-native';
import { dialog } from '@utils/dialog';

import { formatFileSize } from '@utils/formatFileSize';

type DocumentUploaderProps = {
  file: Step2Data | null;
  onFileChange: (file: Step2Data | null) => void;
  uploadTitle?: string;
  uploadSubtitle?: string;
  showActionButtons?: boolean;
  showQuickTip?: boolean;
  showSelectedSection?: boolean;
  error?: string;
};

async function requestCameraPermission(): Promise<boolean> {
  const { status } = await ImagePicker.requestCameraPermissionsAsync();
  return status === 'granted';
}

async function requestMediaPermission(): Promise<boolean> {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  return status === 'granted';
}

export function DocumentUploader({
  file,
  onFileChange,
  uploadTitle = 'Select File',
  uploadSubtitle = 'PDF, JPG or PNG (max. 10MB)',
  showActionButtons = false,
  showQuickTip = false,
  showSelectedSection = true,
  error,
}: DocumentUploaderProps) {
  const { width, h2, body, label, micro } = useFontScale();

  const pickDocument = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['application/pdf', 'image/*'],
      copyToCacheDirectory: true,
    });

    if (result.canceled || !result.assets?.[0]) {
      return;
    }

    const asset = result.assets[0];
    onFileChange({
      fileUri: asset.uri,
      fileName: asset.name,
      fileSize: asset.size ? formatFileSize(asset.size) : '—',
    });
  };

  const takePhoto = async () => {
    const granted = await requestCameraPermission();
    if (!granted) {
      void dialog.alert('Permission required', 'Camera access is needed to take a photo.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });

    if (result.canceled || !result.assets?.[0]) {
      return;
    }

    const asset = result.assets[0];
    onFileChange({
      fileUri: asset.uri,
      fileName: `photo_${Date.now()}.jpg`,
      fileSize: asset.fileSize ? formatFileSize(asset.fileSize) : '—',
    });
  };

  const handleZonePress = () => {
    void pickDocument();
  };

  return (
    <View>
      <Pressable
        onPress={handleZonePress}
        className="items-center justify-center rounded-xl border border-dashed px-4 py-8"
        style={{
          borderColor: colors.UPLOAD_BORDER_DASHED,
          backgroundColor: colors.UPLOAD_BG,
        }}
      >
        <View
          className="mb-3 items-center justify-center rounded-full"
          style={{
            width: width * 0.16,
            height: width * 0.16,
            backgroundColor: colors.INFO_BG,
          }}
        >
          <CloudUploadIcon size={width * 0.07} />
        </View>
        <Text className="font-bold" style={{ fontSize: body, color: colors.NAVY }}>
          {uploadTitle}
        </Text>
        <Text className="mt-1" style={{ fontSize: micro, color: colors.BODY_TEXT }}>
          {uploadSubtitle}
        </Text>
      </Pressable>

      {showActionButtons ? (
        <View className="mt-3 flex-row" style={{ gap: width * 0.03 }}>
          <Pressable
            onPress={() => void takePhoto()}
            className="flex-1 flex-row items-center justify-center rounded-xl border py-3"
            style={{ borderColor: colors.BORDER, backgroundColor: colors.WHITE }}
          >
            <Text style={{ fontSize: body, color: colors.NAVY }}>📷 Take Photo</Text>
          </Pressable>
          <Pressable
            onPress={() => void pickDocument()}
            className="flex-1 flex-row items-center justify-center rounded-xl border py-3"
            style={{ borderColor: colors.BORDER, backgroundColor: colors.WHITE }}
          >
            <Text style={{ fontSize: body, color: colors.NAVY }}>📄 Upload PDF</Text>
          </Pressable>
        </View>
      ) : null}

      {showSelectedSection && file ? (
        <View className="mt-5">
          <Text
            className="mb-2 font-semibold uppercase tracking-wide"
            style={{ fontSize: micro, color: colors.BODY_TEXT }}
          >
            SELECTED DOCUMENT
          </Text>
          <View
            className="flex-row items-center rounded-xl border px-3 py-3"
            style={{ borderColor: colors.BORDER, backgroundColor: colors.WHITE }}
          >
            <View
              className="mr-3 items-center justify-center rounded-lg"
              style={{
                width: width * 0.12,
                height: width * 0.12,
                backgroundColor: colors.SURFACE_MUTED,
              }}
            >
              {file.fileUri && /\.(jpg|jpeg|png)$/i.test(file.fileName) ? (
                <Image
                  source={{ uri: file.fileUri }}
                  style={{ width: width * 0.12, height: width * 0.12, borderRadius: 8 }}
                />
              ) : (
                <DocumentIcon />
              )}
            </View>
            <View className="flex-1">
              <Text className="font-semibold" style={{ fontSize: body, color: colors.NAVY }}>
                {file.fileName}
              </Text>
              <Text style={{ fontSize: micro, color: colors.BODY_TEXT }}>
                {file.fileSize} • Uploaded
              </Text>
            </View>
            <Pressable onPress={() => onFileChange(null)} hitSlop={8}>
              <TrashIcon />
            </Pressable>
          </View>
        </View>
      ) : null}

      {showQuickTip ? (
        <View
          className="mt-4 flex-row rounded-xl border p-3"
          style={{
            backgroundColor: colors.TIP_BG,
            borderColor: colors.TIP_BORDER,
          }}
        >
          <Text style={{ fontSize: body, color: colors.GOLD, marginRight: 8 }}>ⓘ</Text>
          <View className="flex-1">
            <Text className="font-bold" style={{ fontSize: body, color: colors.GOLD }}>
              Quick Tip
            </Text>
            <Text className="mt-1" style={{ fontSize: label, color: colors.BODY_TEXT }}>
              Make sure all four corners of the document are visible and the text is sharp and
              readable for faster verification.
            </Text>
          </View>
        </View>
      ) : null}

      {error ? (
        <Text className="mt-2" style={{ fontSize: label, color: colors.ERROR }}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}

export async function pickImageFromLibrary(): Promise<Step2Data | null> {
  const granted = await requestMediaPermission();
  if (!granted) {
    void dialog.alert('Permission required', 'Photo library access is needed to upload images.');
    return null;
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    quality: 0.8,
  });

  if (result.canceled || !result.assets?.[0]) {
    return null;
  }

  const asset = result.assets[0];
  return {
    fileUri: asset.uri,
    fileName: asset.fileName ?? `image_${Date.now()}.jpg`,
    fileSize: asset.fileSize ? formatFileSize(asset.fileSize) : '—',
  };
}
