type ExtraFields = Record<string, string>;

/**
 * Creates a React Native-compatible FormData object for file uploads.
 * The file object uses the { uri, name, type } shape that RN's FormData accepts.
 */
export function createFileFormData(
  fieldName: string,
  fileUri: string,
  fileName: string,
  mimeType: string,
  extraFields?: ExtraFields,
): FormData {
  const formData = new FormData();

  formData.append(fieldName, {
    uri: fileUri,
    name: fileName,
    type: mimeType,
  } as unknown as Blob);

  if (extraFields) {
    for (const [key, value] of Object.entries(extraFields)) {
      formData.append(key, value);
    }
  }

  return formData;
}

/** Derives MIME type from a file name's extension. */
export function getMimeType(fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase();
  if (ext === 'pdf') return 'application/pdf';
  if (ext === 'png') return 'image/png';
  if (ext === 'webp') return 'image/webp';
  if (ext === 'heic' || ext === 'heif') return 'image/jpeg';
  return 'image/jpeg';
}

/** Safe file name for RN uploads (content:// URIs have no extension). */
export function imageFileNameFromUri(uri: string, index = 0): string {
  const segment = uri.split('/').pop() ?? '';
  if (/\.(jpe?g|png|webp|heic|heif)$/i.test(segment)) {
    return segment;
  }
  return `image-${index + 1}.jpg`;
}

/** Append one or more local image URIs for multipart upload (field name e.g. "images"). */
export function appendImagesToFormData(
  formData: FormData,
  fieldName: string,
  imageUris: string[],
  fileNames?: string[],
): void {
  imageUris.forEach((uri, index) => {
    const name = fileNames?.[index] ?? imageFileNameFromUri(uri, index);
    formData.append(fieldName, {
      uri,
      name,
      type: getMimeType(name),
    } as unknown as Blob);
  });
}
