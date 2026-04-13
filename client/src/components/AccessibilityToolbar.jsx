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

  const toggleMagnifier = () => {
    if (magState === "off") {
      setMagState("picking");
    } else {
      const content = document.getElementById("app-content");
      if (content) {
        content.style.transform = "";
        content.style.transformOrigin = "";
      }
      document.body.style.cursor = "";
      setMagState("off");
    }
  };

  const magLabel = magState === "off" ? "Activate" : "Deactivate";
  const magActive = magState !== "off";

  return (
    <>
      {/* Banner in magnifier mode */}
      {magState === "picking" && (
        <div style={st.zoomBanner} className="accessibility-toolbar">
          🔍 Magnifier active — click any area to zoom in
        </div>
      )}
      {magState === "zoomed" && (
        <div style={st.zoomBanner} className="accessibility-toolbar">
          🔍 Zoomed in — click to zoom out and pick another area
        </div>
      )}

      {/* Collapsed FAB */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          style={st.fab}
          className="accessibility-toolbar"
          aria-label="Accessibility settings"
          title="Accessibility"
        >
          ♿
        </button>
      )}

      {/* Expanded panel */}
      {open && (
        <div className="accessibility-toolbar" style={st.panel}>
          <div style={st.panelHeader}>
            <span style={{ fontWeight: 700, fontSize: 15 }}>Accessibility</span>
            <button onClick={() => setOpen(false)} style={st.closeBtn}>✕</button>
          </div>

          {/* Language */}
          <div style={st.section}>
            <div style={st.label}>🌐 Language</div>
            <select value={lang} onChange={(e) => setLang(e.target.value)} style={st.select}>
              {LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>{l.label}</option>
              ))}
            </select>
          </div>

          {/* Magnifier */}
          <div style={st.section}>
            <div style={st.label}>🔍 Magnifier</div>
            <button
              onClick={toggleMagnifier}
              style={{ ...st.toggleBtn, background: magActive ? "#d4a574" : "#e8e0d6", color: magActive ? "#fff" : "#333" }}
            >
              {magLabel}
            </button>
          </div>

          {/* High Contrast */}
          <div style={st.section}>
            <div style={st.label}>◑ High Contrast</div>
            <button
              onClick={() => setHighContrast((h) => !h)}
              style={{ ...st.toggleBtn, background: highContrast ? "#d4a574" : "#e8e0d6", color: highContrast ? "#fff" : "#333" }}
            >
              {highContrast ? "ON" : "OFF"}
            </button>
          </div>

          {/* Text Size */}
          <div style={st.section}>
            <div style={st.label}>🔤 Text Size</div>
            <div style={{ display: "flex", gap: 6 }}>
              {TEXT_SIZES.map((s, i) => (
                <button
                  key={i}
                  onClick={() => setTextLevel(i)}
                  style={{
                    ...st.sizeBtn,
                    flex: 1,
                    background: textLevel === i ? "#d4a574" : "#f0ebe4",
                    color: textLevel === i ? "#fff" : "#333",
                    fontWeight: textLevel === i ? 700 : 500,
                  }}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}