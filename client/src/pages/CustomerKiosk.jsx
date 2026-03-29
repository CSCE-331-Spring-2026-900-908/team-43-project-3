import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import ChatBot from "../components/ChatBot";

const CATEGORY_ICONS = {
  "Milk Tea": "🥛", "Fruit Tea": "🍓", "Classic Tea": "🍵", "Brewed Tea": "🍵",
  "Slush": "🧊", "Seasonal": "🌸", "Coffee": "☕",
};

export default function CustomerKiosk() {
  const navigate = useNavigate();
  const [menu, setMenu] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCat, setActiveCat] = useState(null);
  const [cart, setCart] = useState([]);
  const [modifiers, setModifiers] = useState([]);
  const [customizing, setCustomizing] = useState(null);
  const [choices, setChoices] = useState({});
  const [qty, setQty] = useState(1);
  const [orderPlaced, setOrderPlaced] = useState(null);

  useEffect(() => {
    api.getMenu().then((items) => {
      setMenu(items);
      const cats = [...new Set(items.map((i) => i.category))];
      setCategories(cats);
      if (cats.length) setActiveCat(cats[0]);
    });
  }, []);

  const openCustomize = async (item) => {
    try {
      const mods = await api.getModifiers(item.menu_item_id);
      setModifiers(mods);
    } catch {
      setModifiers([]);
    }
    setChoices({});
    setQty(1);
    setCustomizing(item);
  };

  const addToCart = () => {
    const selectedChoiceIds = Object.values(choices).flat().filter(Boolean).map(Number);
    let adj = 0;
    const choiceLabels = [];
    for (const mod of modifiers) {
      for (const c of mod.choices) {
        if (selectedChoiceIds.includes(c.choice_id)) {
          adj += c.price_delta;
          choiceLabels.push(c.label);
        }
      }
    }
    const unitPrice = parseFloat(customizing.base_price) + adj;
    setCart((prev) => [
      ...prev,
      {
        menu_item_id: customizing.menu_item_id,
        name: customizing.name,
        quantity: qty,
        unitPrice,
        choice_ids: selectedChoiceIds,
        choiceLabels,
      },
    ]);
    setCustomizing(null);
  };

  const removeFromCart = (idx) => setCart((c) => c.filter((_, i) => i !== idx));
  const cartTotal = cart.reduce((s, i) => s + i.unitPrice * i.quantity, 0);

  const placeOrder = async () => {
    try {
      const result = await api.submitOrder({
        items: cart.map((c) => ({
          menu_item_id: c.menu_item_id,
          quantity: c.quantity,
          choice_ids: c.choice_ids,
        })),
      });
      setOrderPlaced(result);
      setCart([]);
    } catch (err) {
      alert("Order failed: " + err.message);
    }
  };

  if (orderPlaced) {
    return (
      <div style={s.page}>
        <div style={{ ...s.centered, gap: "1.5rem" }}>
          <span style={{ fontSize: "4rem" }}>✅</span>
          <h1>Order Placed!</h1>
          <p style={{ fontSize: "1.3rem", color: "var(--text-light)" }}>
            Order #{orderPlaced.order_id} — Total: ${orderPlaced.total.toFixed(2)}
          </p>
          <button className="btn-primary" style={{ fontSize: "1.2rem", padding: "1rem 3rem" }} onClick={() => setOrderPlaced(null)}>
            New Order
          </button>
        </div>
      </div>
    );
  }

  const filtered = menu.filter((i) => i.category === activeCat);

  return (
    <div style={s.page}>
      <header style={s.header}>
        <button onClick={() => navigate("/")} style={s.backBtn} aria-label="Back to portal">← Back</button>
        <h1 style={s.logo}>ShareTea</h1>
        <span style={s.headerSub}>Self-Service Kiosk</span>
      </header>

      <div style={s.body}>
        {/* Category sidebar */}
        <nav style={s.sidebar}>
          {categories.map((cat) => (
            <button key={cat} onClick={() => setActiveCat(cat)}
              style={{ ...s.catBtn, ...(cat === activeCat ? s.catBtnActive : {}) }}>
              <span style={{ fontSize: "1.5rem" }}>{CATEGORY_ICONS[cat] || "🧋"}</span>
              <span>{cat}</span>
            </button>
          ))}
        </nav>

        {/* Menu grid */}
        <main style={s.menuGrid}>
          {filtered.map((item) => (
            <button key={item.menu_item_id} style={s.menuCard} onClick={() => openCustomize(item)}>
              <div style={s.menuCardIcon}>{CATEGORY_ICONS[item.category] || "🧋"}</div>
              <div style={s.menuCardName}>{item.name}</div>
              <div style={s.menuCardPrice}>${parseFloat(item.base_price).toFixed(2)}</div>
            </button>
          ))}
        </main>

        {/* Cart panel */}
        <aside style={s.cartPanel}>
          <h2 style={{ fontSize: "1.1rem", marginBottom: "0.75rem" }}>Your Order</h2>
          {cart.length === 0 && <p style={{ color: "var(--text-light)", fontSize: "0.9rem" }}>Tap an item to get started</p>}
          <div style={{ flex: 1, overflowY: "auto" }}>
            {cart.map((c, i) => (
              <div key={i} style={s.cartItem}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: "0.95rem" }}>{c.name} x{c.quantity}</div>
                  {c.choiceLabels.length > 0 && (
                    <div style={{ fontSize: "0.8rem", color: "var(--text-light)" }}>{c.choiceLabels.join(", ")}</div>
                  )}
                </div>
                <div style={{ fontWeight: 600 }}>${(c.unitPrice * c.quantity).toFixed(2)}</div>
                <button onClick={() => removeFromCart(i)} style={s.removeBtn}>✕</button>
              </div>
            ))}
          </div>
          <div style={s.cartFooter}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "1.2rem", fontWeight: 700 }}>
              <span>Total</span>
              <span>${cartTotal.toFixed(2)}</span>
            </div>
            <button className="btn-primary" disabled={cart.length === 0} onClick={placeOrder}
              style={{ width: "100%", padding: "0.9rem", fontSize: "1.1rem", marginTop: "0.75rem", opacity: cart.length === 0 ? 0.5 : 1 }}>
              Place Order
            </button>
          </div>
        </aside>
      </div>

      {/* Customization modal */}
      {customizing && (
        <div style={s.overlay} onClick={() => setCustomizing(null)}>
          <div style={s.modal} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ marginBottom: "0.5rem" }}>{customizing.name}</h2>
            <p style={{ color: "var(--text-light)" }}>Base: ${parseFloat(customizing.base_price).toFixed(2)}</p>

            {modifiers.map((mod) => (
              <div key={mod.modifier_id} style={{ marginTop: "1rem" }}>
                <h3 style={{ fontSize: "0.95rem", marginBottom: "0.5rem" }}>{mod.name}</h3>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                  {mod.choices.map((c) => {
                    const sel = choices[mod.modifier_id] === c.choice_id;
                    return (
                      <button key={c.choice_id}
                        onClick={() => setChoices((prev) => ({ ...prev, [mod.modifier_id]: sel ? null : c.choice_id }))}
                        style={{ ...s.choiceBtn, ...(sel ? s.choiceBtnSel : {}) }}>
                        {c.label}
                        {c.price_delta > 0 && ` (+$${c.price_delta.toFixed(2)})`}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            <div style={{ marginTop: "1rem", display: "flex", alignItems: "center", gap: "1rem" }}>
              <span style={{ fontWeight: 600 }}>Qty:</span>
              <button onClick={() => setQty(Math.max(1, qty - 1))} style={s.qtyBtn}>−</button>
              <span style={{ fontSize: "1.2rem", fontWeight: 700, minWidth: 30, textAlign: "center" }}>{qty}</span>
              <button onClick={() => setQty(qty + 1)} style={s.qtyBtn}>+</button>
            </div>

            <div style={{ marginTop: "1.5rem", display: "flex", gap: "0.75rem" }}>
              <button className="btn-outline" onClick={() => setCustomizing(null)} style={{ flex: 1 }}>Cancel</button>
              <button className="btn-primary" onClick={addToCart} style={{ flex: 1 }}>Add to Order</button>
            </div>
          </div>
        </div>
      )}

      <ChatBot />
    </div>
  );
}