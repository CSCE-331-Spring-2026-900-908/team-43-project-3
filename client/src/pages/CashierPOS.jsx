import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";

export default function CashierPOS() {
  const navigate = useNavigate();
  const [menu, setMenu] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCat, setActiveCat] = useState("All");
  const [order, setOrder] = useState([]);
  const [modifiers, setModifiers] = useState([]);
  const [customizing, setCustomizing] = useState(null);
  const [choices, setChoices] = useState({});
  const [qty, setQty] = useState(1);
  const [search, setSearch] = useState("");

  useEffect(() => {
    api.getMenu().then((items) => {
      setMenu(items);
      setCategories(["All", ...new Set(items.map((i) => i.category))]);
    });
  }, []);

  const filtered = menu.filter((i) => {
    if (activeCat !== "All" && i.category !== activeCat) return false;
    if (search && !i.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const quickAdd = async (item) => {
    try {
      const mods = await api.getModifiers(item.menu_item_id);
      if (mods.length > 0) {
        setModifiers(mods);
        setChoices({});
        setQty(1);
        setCustomizing(item);
        return;
      }
    } catch { /* no modifiers */ }
    setOrder((prev) => {
      const existing = prev.find((o) => o.menu_item_id === item.menu_item_id && o.choice_ids.length === 0);
      if (existing) return prev.map((o) => o === existing ? { ...o, quantity: o.quantity + 1 } : o);
      return [...prev, { menu_item_id: item.menu_item_id, name: item.name, quantity: 1, unitPrice: parseFloat(item.base_price), choice_ids: [] }];
    });
  };

  const addCustomized = () => {
    const selectedChoiceIds = Object.values(choices).flat().filter(Boolean).map(Number);
    let adj = 0;
    for (const mod of modifiers) {
      for (const c of mod.choices) {
        if (selectedChoiceIds.includes(c.choice_id)) adj += c.price_delta;
      }
    }
    setOrder((prev) => [
      ...prev,
      { menu_item_id: customizing.menu_item_id, name: customizing.name, quantity: qty, unitPrice: parseFloat(customizing.base_price) + adj, choice_ids: selectedChoiceIds },
    ]);
    setCustomizing(null);
  };

  const removeItem = (idx) => setOrder((o) => o.filter((_, i) => i !== idx));
  const adjustQty = (idx, delta) => {
    setOrder((prev) => prev.map((o, i) => {
      if (i !== idx) return o;
      const newQty = o.quantity + delta;
      return newQty <= 0 ? null : { ...o, quantity: newQty };
    }).filter(Boolean));
  };

  const total = order.reduce((s, i) => s + i.unitPrice * i.quantity, 0);

  const submitOrder = async () => {
    if (order.length === 0) return;
    try {
      const result = await api.submitOrder({
        items: order.map((o) => ({ menu_item_id: o.menu_item_id, quantity: o.quantity, choice_ids: o.choice_ids })),
      });
      alert(`Order #${result.order_id} submitted — $${result.total.toFixed(2)}`);
      setOrder([]);
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  return (
    <div style={s.page}>
      {/* Left: menu items */}
      <div style={s.left}>
        <div style={s.topBar}>
          <button onClick={() => navigate("/")} style={s.backBtn}>← Back</button>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--primary)" }}>Cashier POS</h2>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search items..." style={s.searchInput} />
        </div>
        <div style={s.catRow}>
          {categories.map((c) => (
            <button key={c} onClick={() => setActiveCat(c)} style={{ ...s.catPill, ...(c === activeCat ? s.catPillActive : {}) }}>{c}</button>
          ))}
        </div>
        <div style={s.itemGrid}>
          {filtered.map((item) => (
            <button key={item.menu_item_id} style={s.itemBtn} onClick={() => quickAdd(item)}>
              <span style={{ fontWeight: 600, fontSize: "0.85rem" }}>{item.name}</span>
              <span style={{ color: "var(--primary)", fontWeight: 700, fontSize: "0.8rem" }}>${parseFloat(item.base_price).toFixed(2)}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Right: current order */}
      <div style={s.right}>
        <h3 style={{ marginBottom: "0.5rem" }}>Current Order</h3>
        <div style={{ flex: 1, overflowY: "auto" }}>
          {order.length === 0 && <p style={{ color: "#999", fontSize: "0.85rem" }}>Tap items to add</p>}
          {order.map((o, i) => (
            <div key={i} style={s.orderRow}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>{o.name}</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                <button onClick={() => adjustQty(i, -1)} style={s.qtySmBtn}>−</button>
                <span style={{ minWidth: 22, textAlign: "center", fontWeight: 600 }}>{o.quantity}</span>
                <button onClick={() => adjustQty(i, 1)} style={s.qtySmBtn}>+</button>
              </div>
              <span style={{ minWidth: 60, textAlign: "right", fontWeight: 600 }}>${(o.unitPrice * o.quantity).toFixed(2)}</span>
              <button onClick={() => removeItem(i)} style={{ background: "none", border: "none", color: "#e53935", fontWeight: 700 }}>✕</button>
            </div>
          ))}
        </div>
        <div style={{ borderTop: "2px solid #333", paddingTop: "0.75rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "1.3rem", fontWeight: 700 }}>
            <span>Total</span><span>${total.toFixed(2)}</span>
          </div>
          <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.75rem" }}>
            <button className="btn-danger" onClick={() => setOrder([])} style={{ flex: 1 }} disabled={order.length === 0}>Clear</button>
            <button className="btn-primary" onClick={submitOrder} style={{ flex: 2, fontSize: "1.05rem" }} disabled={order.length === 0}>Submit Order</button>
          </div>
        </div>
      </div>

      {/* Customization modal */}
      {customizing && (
        <div style={s.overlay} onClick={() => setCustomizing(null)}>
          <div style={s.modal} onClick={(e) => e.stopPropagation()}>
            <h3>{customizing.name}</h3>
            {modifiers.map((mod) => (
              <div key={mod.modifier_id} style={{ marginTop: "0.75rem" }}>
                <strong style={{ fontSize: "0.85rem" }}>{mod.name}</strong>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", marginTop: "0.3rem" }}>
                  {mod.choices.map((c) => {
                    const sel = choices[mod.modifier_id] === c.choice_id;
                    return (
                      <button key={c.choice_id} onClick={() => setChoices((p) => ({ ...p, [mod.modifier_id]: sel ? null : c.choice_id }))}
                        style={{ padding: "0.35rem 0.8rem", borderRadius: 16, border: sel ? "2px solid var(--primary)" : "1px solid var(--border)", background: sel ? "var(--primary)" : "var(--bg)", color: sel ? "#fff" : "var(--text)", fontSize: "0.8rem", fontWeight: 500 }}>
                        {c.label}{c.price_delta > 0 && ` +$${c.price_delta.toFixed(2)}`}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
            <div style={{ marginTop: "0.75rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <strong>Qty:</strong>
              <button onClick={() => setQty(Math.max(1, qty - 1))} style={s.qtySmBtn}>−</button>
              <span style={{ fontWeight: 700 }}>{qty}</span>
              <button onClick={() => setQty(qty + 1)} style={s.qtySmBtn}>+</button>
            </div>
            <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem" }}>
              <button className="btn-outline" onClick={() => setCustomizing(null)} style={{ flex: 1 }}>Cancel</button>
              <button className="btn-primary" onClick={addCustomized} style={{ flex: 1 }}>Add</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const s = {
  page: { height: "100vh", display: "flex", background: "#1a1a2e", color: "#e0e0e0", overflow: "hidden" },
  left: { flex: 1, display: "flex", flexDirection: "column", borderRight: "1px solid #333" },
  topBar: { display: "flex", alignItems: "center", gap: "1rem", padding: "0.75rem 1rem", background: "#16213e", borderBottom: "1px solid #333" },
  backBtn: { background: "rgba(255,255,255,0.1)", border: "none", color: "#ccc", padding: "0.4rem 0.8rem", borderRadius: 8, fontWeight: 600, fontSize: "0.85rem" },
  searchInput: { flex: 1, background: "#0f3460", border: "1px solid #444", color: "#fff", borderRadius: 8, padding: "0.4rem 0.75rem" },
  catRow: { display: "flex", gap: "0.4rem", padding: "0.5rem 1rem", overflowX: "auto", background: "#16213e" },
  catPill: { padding: "0.35rem 0.9rem", borderRadius: 20, border: "1px solid #444", background: "transparent", color: "#ccc", fontSize: "0.8rem", whiteSpace: "nowrap", fontWeight: 500 },
  catPillActive: { background: "var(--primary)", color: "#fff", borderColor: "var(--primary)" },
  itemGrid: { flex: 1, display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: "0.6rem", padding: "0.75rem", overflowY: "auto", alignContent: "start" },
  itemBtn: { background: "#16213e", border: "1px solid #333", borderRadius: 10, padding: "0.75rem 0.5rem", display: "flex", flexDirection: "column", alignItems: "center", gap: "0.3rem", color: "#e0e0e0", textAlign: "center" },
  right: { width: 320, display: "flex", flexDirection: "column", padding: "0.75rem 1rem", background: "#16213e" },
  orderRow: { display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.4rem 0", borderBottom: "1px solid #333" },
  qtySmBtn: { width: 28, height: 28, borderRadius: "50%", border: "1px solid #555", background: "#0f3460", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 },
  overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 500 },
  modal: { background: "var(--card)", color: "var(--text)", borderRadius: "var(--radius)", padding: "1.5rem", width: "90%", maxWidth: 400 },
};