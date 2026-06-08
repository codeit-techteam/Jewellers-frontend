import { create } from 'zustand';

import type { ThemeMode } from '@types';

type AppState = {
  appName: string;
  themeMode: ThemeMode;
  pendingStoreSlug: string | null;
  setThemeMode: (mode: ThemeMode) => void;
  setPendingStoreSlug: (slug: string | null) => void;
};

export const useAppStore = create<AppState>((set) => ({
  appName: 'Jewellars Partner',
  themeMode: 'light',
  pendingStoreSlug: null,
  setThemeMode: (themeMode) => set({ themeMode }),
  setPendingStoreSlug: (pendingStoreSlug) => set({ pendingStoreSlug }),
}));
