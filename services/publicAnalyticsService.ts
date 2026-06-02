import axios from 'axios';

import { config } from '@constants/config';
import { getVisitorId } from '@lib/visitorId';

export type AnalyticsSource = 'marketplace' | 'partner_preview' | 'customer_app';

const publicApi = axios.create({
  baseURL: config.publicAnalyticsUrl,
  timeout: 15_000,
  headers: { 'Content-Type': 'application/json' },
});

/** Record a store open (deduped server-side: one per visitor + store per day). */
export function recordStoreVisit(
  boutiqueId: string,
  options?: { userId?: string | null; source?: AnalyticsSource },
): void {
  void (async () => {
    const visitorId = await getVisitorId();
    await publicApi.post('/store-visit', {
      boutiqueId,
      visitorId,
      userId: options?.userId ?? null,
      source: options?.source ?? 'marketplace',
    });
  })().catch(() => undefined);
}

/** Product detail view via public analytics API (customer app). */
export function recordProductView(
  productId: string,
  options?: { userId?: string | null; source?: AnalyticsSource },
): void {
  void (async () => {
    const visitorId = await getVisitorId();
    await publicApi.post('/product-view', {
      productId,
      visitorId,
      userId: options?.userId ?? null,
      source: options?.source ?? 'marketplace',
    });
  })().catch(() => undefined);
}

/** After customer login — merge guest activity with account (customer app only). */
export function linkVisitorToUser(userId: string): void {
  void (async () => {
    const visitorId = await getVisitorId();
    await publicApi.post('/link-visitor', { visitorId, userId });
  })().catch(() => undefined);
}
