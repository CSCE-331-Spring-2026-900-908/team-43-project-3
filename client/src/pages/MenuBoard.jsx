import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import WeatherWidget from "../components/WeatherWidget";

const CAT_COLORS = {
  "Milk Tea": "#e8c9a0", "Fruit Tea": "#f5a6a6", "Classic Tea": "#b8d4a8",
  "Slush": "#a8c8e8", "Seasonal": "#d4a6d4", "Coffee": "#c4a882",
};

export default function MenuBoard() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [grouped, setGrouped] = useState({});

  useEffect(() => {
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

  return (
    <div style={s.page}>
      <header style={s.header}>
        <button onClick={() => navigate("/")} style={{ background: "rgba(255,255,255,0.1)", border: "none", color: "#f5ebe0", padding: "0.4rem 0.8rem", borderRadius: 8, fontWeight: 600, fontSize: "0.85rem" }}>← Back</button>
        <h1 style={s.logo}>ShareTea</h1>
        <span style={{ fontSize: "1.1rem", opacity: 0.9 }}>Menu</span>
        <div style={{ marginLeft: "auto" }}><WeatherWidget /></div>
      </header>
      <div style={s.grid}>
        {Object.entries(grouped).map(([cat, catItems]) => (
          <div key={cat} style={s.catCard}>
            <h2 style={{ ...s.catTitle, borderBottomColor: CAT_COLORS[cat] || "var(--primary)" }}>{cat}</h2>
            {catItems.map((item) => (
              <div key={item.menu_item_id} style={s.menuRow}>
                <span style={s.itemName}>{item.name}</span>
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