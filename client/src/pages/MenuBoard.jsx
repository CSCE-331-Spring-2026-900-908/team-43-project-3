/**
 * Public menu board display.
 *
 * This page refreshes menu data periodically so the displayed pricing and
 * item list stay current for guests.
 *
 * @returns {JSX.Element}
 */
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { api } from "../api";
import { useTranslation } from "../contexts/TranslationContext";
import WeatherWidget from "../components/WeatherWidget";

const CAT_COLORS = {
  "Milk Tea": "#e8c9a0", "Fruit Tea": "#f5a6a6", "Classic Tea": "#b8d4a8",
  "Slush": "#a8c8e8", "Seasonal": "#d4a6d4", "Coffee": "#c4a882",
};

export default function MenuBoard() {
  const { t, translateBatch, lang } = useTranslation();
  const [items, setItems] = useState([]);
  const [grouped, setGrouped] = useState({});
  const [scale, setScale] = useState(1);
  const viewportRef = useRef(null);
  const boardRef = useRef(null);

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
    const strs = ["Menu", ...items.map((i) => i.name), ...Object.keys(grouped)];
    translateBatch(strs);
  }, [lang, items, grouped, translateBatch]);

  useLayoutEffect(() => {
    const viewport = viewportRef.current;
    const board = boardRef.current;
    if (!viewport || !board) return undefined;

    const updateScale = () => {
      const availableWidth = viewport.clientWidth;
      const availableHeight = viewport.clientHeight;
      const contentWidth = board.scrollWidth;
      const contentHeight = board.scrollHeight;

      if (!availableWidth || !availableHeight || !contentWidth || !contentHeight) return;

      const nextScale = Math.min(
        1,
        availableWidth / contentWidth,
        availableHeight / contentHeight
      );

      setScale(nextScale);
    };

    updateScale();

    const resizeObserver = new ResizeObserver(updateScale);
    resizeObserver.observe(viewport);
    resizeObserver.observe(board);
    window.addEventListener("resize", updateScale);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", updateScale);
    };
  }, [grouped, items, lang]);

  return (
    <div style={s.page}>
      <div ref={viewportRef} style={s.viewport}>
        <div
          ref={boardRef}
          style={{
            ...s.board,
            transform: `scale(${scale})`,
          }}
        >
          <header style={s.header}>
            <h1 style={s.logo}>Iroh's Tea</h1>
            <span style={s.menuLabel}>{t("Menu")}</span>
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
      </div>
    </div>
  );
}

const s = {
  page: { height: "100vh", background: "#1a0e0a", color: "#f5ebe0", padding: "1rem", overflow: "hidden" },
  viewport: { width: "100%", height: "100%", overflow: "hidden", display: "flex", justifyContent: "center", alignItems: "flex-start" },
  board: { width: "min(1600px, calc(100vw - 2rem))", padding: "1rem", transformOrigin: "top center" },
  header: { display: "flex", alignItems: "center", gap: "1.5rem", marginBottom: "2rem", padding: "0 1rem", flexWrap: "wrap" },
  logo: { fontSize: "2.2rem", fontWeight: 700, color: "#d4a574" },
  menuLabel: { fontSize: "1.1rem", opacity: 0.9 },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.25rem" },
  catCard: { background: "rgba(255,255,255,0.05)", borderRadius: 16, padding: "1.25rem 1.5rem" },
  catTitle: { fontSize: "1.2rem", fontWeight: 700, paddingBottom: "0.5rem", marginBottom: "0.75rem", borderBottom: "3px solid var(--primary)" },
  menuRow: { display: "flex", alignItems: "baseline", padding: "0.4rem 0", gap: "0.5rem" },
  itemName: { fontWeight: 500, fontSize: "1.05rem", minWidth: 0, overflowWrap: "anywhere" },
  dots: { flex: 1, borderBottom: "1px dotted rgba(255,255,255,0.2)", marginBottom: 4 },
  price: { fontWeight: 700, fontSize: "1.1rem", color: "#d4a574", whiteSpace: "nowrap" },
};