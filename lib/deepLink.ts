import * as Linking from 'expo-linking';

export function extractStoreSlugFromUrl(url: string): string | null {
  const parsed = Linking.parse(url);
  const path = parsed.path ?? '';
  const normalized = path.startsWith('/') ? path : `/${path}`;
  const match = normalized.match(/^\/store\/([^/?#]+)/i);
  if (!match?.[1]) return null;
  return decodeURIComponent(match[1]).toLowerCase();
}
