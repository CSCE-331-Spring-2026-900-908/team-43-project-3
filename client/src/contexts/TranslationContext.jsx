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