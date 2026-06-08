import { Share } from 'react-native';

export const DOMAIN = 'https://gehnahub.com';
export const PLAY_STORE = 'https://play.google.com/store/apps/details?id=com.jewellars.frontend';
export const APP_STORE = 'https://apps.apple.com/app/gehnahub';

export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

function appDownloadBlock(): string {
  return (
    "📱 Don't have the app? Download GehnaHub:\n" +
    `Android: ${PLAY_STORE}\n` +
    `iOS: ${APP_STORE}`
  );
}

export async function shareStore(storeName: string, _boutiqueId: string): Promise<void> {
  const slug = generateSlug(storeName);
  const storeUrl = `${DOMAIN}/store/${slug}`;
  const message =
    `✨ Check out ${storeName} on GehnaHub!\n\n` +
    `View their jewellery collection:\n${storeUrl}\n\n` +
    appDownloadBlock();

  try {
    await Share.share({
      message,
      title: storeName,
      url: storeUrl,
    });
  } catch {
    // User cancelled or share unavailable — ignore
  }
}

export async function shareProduct(
  productName: string,
  price: number,
  storeName: string,
  _boutiqueId: string,
): Promise<void> {
  const slug = generateSlug(storeName);
  const storeUrl = `${DOMAIN}/store/${slug}`;
  const formattedPrice = `₹${price.toLocaleString('en-IN')}`;
  const message =
    `💎 ${productName}\n` +
    `${formattedPrice} at ${storeName}\n\n` +
    `View on GehnaHub:\n${storeUrl}\n\n` +
    `📱 Download GehnaHub app:\n` +
    `Android: ${PLAY_STORE}\n` +
    `iOS: ${APP_STORE}`;

  try {
    await Share.share({
      message,
      title: productName,
      url: storeUrl,
    });
  } catch {
    // User cancelled or share unavailable — ignore
  }
}
