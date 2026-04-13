import { useState, useEffect } from "react";
import { useTranslation, LANGUAGES } from "../contexts/TranslationContext";

const TEXT_SIZES = [
  { label: "Normal", px: 16 },
  { label: "Large", px: 21 },
  { label: "Extra Large", px: 26 },
];

// magnifier states: "off" | "picking" | "zoomed"
// picking ↔ zoomed loop; only toolbar button exits to "off"

export default function AccessibilityToolbar() {
  const { lang, setLang } = useTranslation();
  const [open, setOpen] = useState(false);
  const [magState, setMagState] = useState("off");
  const [highContrast, setHighContrast] = useState(false);
  const [textLevel, setTextLevel] = useState(0);

  // Text scaling
  useEffect(() => {
    const px = TEXT_SIZES[textLevel].px;
    document.documentElement.style.fontSize = px === 16 ? "" : `${px}px`;
  }, [textLevel]);

  // High contrast
  useEffect(() => {
    document.body.classList.toggle("high-contrast", highContrast);
  }, [highContrast]);