/**
 * Translation context provider for the client application.
 *
 * Provides language selection, text lookup, and batched translation caching.
 */
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

/**
 * Provider component for translation context.
 * @param {{ children: React.ReactNode }} props - Child components.
 * @returns {JSX.Element} Translation provider wrapper.
 */
export function TranslationProvider({ children }) {
  const [lang, setLangState] = useState("en");
  const cacheRef = useRef(JSON.parse(localStorage.getItem("t9n_cache") || "{}"));
  const [, bump] = useState(0);

  /**
   * Change the current language code.
   * @param {string} code - Language code (e.g., 'en', 'es', 'fr').
   */
  const setLang = useCallback((code) => {
    setLangState(code);
    if (code !== "en" && !cacheRef.current[code]) cacheRef.current[code] = {};
    bump((n) => n + 1);
  }, []);

  /**
   * Batch translate a list of texts to the current language.
   * Results are cached in localStorage for performance.
   * @param {string[]} texts - Texts to translate.
   * @returns {Promise<void>}
   */
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

  /**
   * Translate a single text string using the cache.
   * @param {string} text - Text to translate.
   * @returns {string} Translated text or original if not found.
   */
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

/**
 * Hook to access the translation context.
 * @returns {{ lang: string, setLang, t, translateBatch, languages }} Translation context value.
 */
export function useTranslation() { 
    return useContext(TranslationContext);
}