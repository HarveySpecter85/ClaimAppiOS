import { useCallback, useMemo } from "react";
import translations from "./translations";
import { useLocaleStore } from "./store";

function getByPath(obj, path) {
  const parts = path.split(".");
  let cur = obj;
  for (const p of parts) {
    if (!cur || typeof cur !== "object") return undefined;
    cur = cur[p];
  }
  return cur;
}

function interpolate(str, vars) {
  if (!vars) return str;
  return str.replace(/\{(\w+)\}/g, (match, key) => {
    if (vars[key] === undefined || vars[key] === null) return match;
    return String(vars[key]);
  });
}

export default function useI18n() {
  const locale = useLocaleStore((s) => s.locale);
  const setLocale = useLocaleStore((s) => s.setLocale);

  const dict = useMemo(() => {
    return translations[locale] || translations.en;
  }, [locale]);

  const t = useCallback(
    (key, vars) => {
      const raw = getByPath(dict, key);
      if (typeof raw === "string") {
        return interpolate(raw, vars);
      }
      const fallback = getByPath(translations.en, key);
      if (typeof fallback === "string") {
        return interpolate(fallback, vars);
      }
      return key;
    },
    [dict],
  );

  return { locale, setLocale, t };
}
