import { create } from 'zustand';

import type { ThemeMode } from '@types';

type AppState = {
  appName: string;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
};

export const useAppStore = create<AppState>((set) => ({
  appName: 'Jewellars Partner',
  themeMode: 'light',
  setThemeMode: (themeMode) => set({ themeMode }),
}));
