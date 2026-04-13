import { createContext, useContext, useState, useCallback, useRef } from "react";
import { api } from "../api";

const TranslationContext = createContext();

export const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "es", label: "Spanish" },
  { code: "fr", label: "French" },
  { code: "zh-CN", label: "Chinese" },
  { code: "ko", label: "Korean" },
  { code: "vi", label: "Vietnamese" },
  { code: "ja", label: "Japanese" },
  { code: "de", label: "German" },
];

export function TranslationProvider({ children }) {
  const [lang, setLangState] = useState("en");
  const cacheRef = useRef(JSON.parse(localStorage.getItem("t9n_cache") || "{}"));
  const [, bump] = useState(0);

  const setLang = useCallback((code) => {
    setLangState(code);
    if (code !== "en" && !cacheRef.current[code]) cacheRef.current[code] = {};
    bump((n) => n + 1);
  }, []);

  const translateBatch = useCallback(async (texts) => {
    if (lang === "en" || !texts.length) return;
    const unique = [...new Set(texts.filter(Boolean))];
    const langCache = cacheRef.current[lang] || {};
    const missing = unique.filter((t) => !langCache[t]);
    if (!missing.length) return;

    try {
      const data = await api.translateBatch(missing, lang);
      if (!cacheRef.current[lang]) cacheRef.current[lang] = {};
      missing.forEach((t, i) => { cacheRef.current[lang][t] = data.translations[i]; });
      localStorage.setItem("t9n_cache", JSON.stringify(cacheRef.current));
      bump((n) => n + 1);
    } catch (e) {
      console.warn("Translation batch failed", e);
    }
  }, [lang]);

  const t = useCallback((text) => {
    if (!text || lang === "en") return text;
    return cacheRef.current[lang]?.[text] || text;
  }, [lang]);

  return (
    <TranslationContext.Provider value={{ lang, setLang, t, translateBatch, languages: LANGUAGES }}>
      {children}
    </TranslationContext.Provider>
  );
}

export function useTranslation() {
  return useContext(TranslationContext);
}