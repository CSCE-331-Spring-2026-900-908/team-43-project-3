/**
 * Accessibility toolbar for language, contrast, text size, and magnifier mode.
 *
 * This component manages accessibility settings globally for the client UI.
 */
import { useState, useEffect } from "react";
import { useTranslation, LANGUAGES } from "../contexts/TranslationContext";

const TEXT_SIZES = [
  { label: "Normal", px: 16 },
  { label: "Large", px: 21 },
  { label: "Extra Large", px: 26 },
];

// magnifier states: "off" | "picking" | "zoomed"
// picking ↔ zoomed loop; only toolbar button exits to "off"

/**
 * Accessibility toolbar component for language, contrast, text size, and magnifier.
 * @returns {JSX.Element} Accessibility toolbar with FAB and expandable panel.
 */
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

const st = {
  fab: {
    position: "fixed", bottom: 24, left: 24, width: 52, height: 52, borderRadius: "50%",
    background: "#8b5e3c", color: "#fff", fontSize: 22,
    display: "flex", alignItems: "center", justifyContent: "center",
    boxShadow: "0 4px 16px rgba(0,0,0,0.25)", border: "none", zIndex: 99999, cursor: "pointer",
  },
  panel: {
    position: "fixed", bottom: 24, left: 24, width: 280, borderRadius: 16,
    background: "#fff", boxShadow: "0 8px 32px rgba(0,0,0,0.2)", color: "#333",
    zIndex: 99999, overflow: "hidden", fontFamily: "Inter, system-ui, sans-serif",
  },
  panelHeader: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "12px 16px", background: "#8b5e3c", color: "#fff",
  },
  closeBtn: { background: "none", border: "none", color: "#fff", fontSize: 18, cursor: "pointer" },
  section: { padding: "10px 16px", borderBottom: "1px solid #eee" },
  label: { fontSize: 13, fontWeight: 600, marginBottom: 6, color: "#555" },
  select: { width: "100%", padding: "6px 8px", borderRadius: 6, border: "1px solid #ddd", fontSize: 14, color: "#333", background: "#fff" },
  toggleBtn: {
    width: "100%", padding: 8, borderRadius: 8, border: "none",
    fontWeight: 600, fontSize: 14, cursor: "pointer",
  },
  sizeBtn: {
    padding: "6px 4px", borderRadius: 6, border: "none",
    fontSize: 12, cursor: "pointer", textAlign: "center",
  },
  zoomBanner: {
    position: "fixed", top: 0, left: 0, right: 0, zIndex: 99999,
    background: "#8b5e3c", color: "#fff", textAlign: "center",
    padding: "10px 16px", fontSize: 15, fontWeight: 600,
    fontFamily: "Inter, system-ui, sans-serif",
  },
};