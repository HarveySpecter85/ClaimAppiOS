import { create } from "zustand";
import * as SecureStore from "expo-secure-store";

const STORAGE_KEY = "incident_app.locale";

export const SUPPORTED_LOCALES = ["en", "es"];

export const useLocaleStore = create((set, get) => ({
  locale: "en",
  hydrated: false,
  hydrate: async () => {
    try {
      const saved = await SecureStore.getItemAsync(STORAGE_KEY);
      if (saved && SUPPORTED_LOCALES.includes(saved)) {
        set({ locale: saved });
      }
    } catch (e) {
      console.error(e);
    } finally {
      set({ hydrated: true });
    }
  },
  setLocale: async (next) => {
    const safeNext = SUPPORTED_LOCALES.includes(next) ? next : "en";
    set({ locale: safeNext });
    try {
      await SecureStore.setItemAsync(STORAGE_KEY, safeNext);
    } catch (e) {
      console.error(e);
    }
  },
}));
