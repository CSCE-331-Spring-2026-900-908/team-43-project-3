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

  // --- Picking mode: cursor = zoom-in, click zooms into that spot ---
  useEffect(() => {
    if (magState !== "picking") return;
    document.body.style.cursor = "zoom-in";

    let handler;
    const timer = setTimeout(() => {
      handler = (e) => {
        if (e.target.closest(".accessibility-toolbar")) return;
        e.preventDefault();
        e.stopPropagation();

        const content = document.getElementById("app-content");
        if (!content) return;

        const rect = content.getBoundingClientRect();
        const xPct = ((e.clientX - rect.left) / rect.width) * 100;
        const yPct = ((e.clientY - rect.top) / rect.height) * 100;

        content.style.transformOrigin = `${xPct}% ${yPct}%`;
        content.style.transform = "scale(2)";
        document.body.style.cursor = "zoom-out";
        setMagState("zoomed");
      };
      document.addEventListener("click", handler, true);
    }, 100);

    return () => {
      clearTimeout(timer);
      document.body.style.cursor = "";
      if (handler) document.removeEventListener("click", handler, true);
    };
  }, [magState]);

  // --- Zoomed mode: click anywhere zooms out and returns to picking (not off) ---
  useEffect(() => {
    if (magState !== "zoomed") return;
    document.body.style.cursor = "zoom-out";

    let handler;
    const timer = setTimeout(() => {
      handler = (e) => {
        if (e.target.closest(".accessibility-toolbar")) return;
        e.preventDefault();
        e.stopPropagation();

        const content = document.getElementById("app-content");
        if (content) {
          content.style.transform = "";
          content.style.transformOrigin = "";
        }
        setMagState("picking"); // stay in magnifier mode
      };
      document.addEventListener("click", handler, true);
    }, 200);

    return () => {
      clearTimeout(timer);
      document.body.style.cursor = "";
      if (handler) document.removeEventListener("click", handler, true);
    };
  }, [magState]);