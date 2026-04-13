/**
 * Public menu board display.
 *
 * This page refreshes menu data periodically so the displayed pricing and
 * item list stay current for guests.
 *
 * @returns {JSX.Element}
 */
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import { useTranslation } from "../contexts/TranslationContext";
import WeatherWidget from "../components/WeatherWidget";

const CAT_COLORS = {
  "Milk Tea": "#e8c9a0", "Fruit Tea": "#f5a6a6", "Classic Tea": "#b8d4a8",
  "Slush": "#a8c8e8", "Seasonal": "#d4a6d4", "Coffee": "#c4a882",
};

export default function MenuBoard() {
  const navigate = useNavigate();
  const { t, translateBatch, lang } = useTranslation();
  const [items, setItems] = useState([]);
  const [grouped, setGrouped] = useState({});

  useEffect(() => {
    /**
     * Fetch and group menu items by category. Auto-refresh every 60 seconds.
     */    
    const load = () => {
      api.getMenu().then((data) => {
        setItems(data);
        const g = {};
        for (const item of data) {
          if (!g[item.category]) g[item.category] = [];
          g[item.category].push(item);
        }
        setGrouped(g);
      });
    };
    load();
    const interval = setInterval(load, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const strs = ["Menu", "← Back", ...items.map((i) => i.name), ...Object.keys(grouped)];
    translateBatch(strs);
  }, [lang, items, grouped, translateBatch]);

  return (
    <div style={s.page}>
      <header style={s.header}>
        <button onClick={() => navigate("/")} style={{ background: "rgba(255,255,255,0.1)", border: "none", color: "#f5ebe0", padding: "0.4rem 0.8rem", borderRadius: 8, fontWeight: 600, fontSize: "0.85rem" }}>{t("← Back")}</button>
        <h1 style={s.logo}>ShareTea</h1>
        <span style={{ fontSize: "1.1rem", opacity: 0.9 }}>{t("Menu")}</span>
        <div style={{ marginLeft: "auto" }}><WeatherWidget /></div>
      </header>
      <div style={s.grid}>
        {Object.entries(grouped).map(([cat, catItems]) => (
          <div key={cat} style={s.catCard}>
            <h2 style={{ ...s.catTitle, borderBottomColor: CAT_COLORS[cat] || "var(--primary)" }}>{t(cat)}</h2>
            {catItems.map((item) => (
              <div key={item.menu_item_id} style={s.menuRow}>
                <span style={s.itemName}>{t(item.name)}</span>
                <span style={s.dots} />
                <span style={s.price}>${parseFloat(item.base_price).toFixed(2)}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

const s = {
  page: { minHeight: "100vh", background: "#1a0e0a", color: "#f5ebe0", padding: "1.5rem" },
  header: { display: "flex", alignItems: "center", gap: "1.5rem", marginBottom: "2rem", padding: "0 1rem" },
  logo: { fontSize: "2.2rem", fontWeight: 700, color: "#d4a574" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.5rem" },
  catCard: { background: "rgba(255,255,255,0.05)", borderRadius: 16, padding: "1.25rem 1.5rem" },
  catTitle: { fontSize: "1.2rem", fontWeight: 700, paddingBottom: "0.5rem", marginBottom: "0.75rem", borderBottom: "3px solid var(--primary)" },
  menuRow: { display: "flex", alignItems: "baseline", padding: "0.4rem 0", gap: "0.5rem" },
  itemName: { fontWeight: 500, fontSize: "1.05rem", whiteSpace: "nowrap" },
  dots: { flex: 1, borderBottom: "1px dotted rgba(255,255,255,0.2)", marginBottom: 4 },
  price: { fontWeight: 700, fontSize: "1.1rem", color: "#d4a574", whiteSpace: "nowrap" },
};
