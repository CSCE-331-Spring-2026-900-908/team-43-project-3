/**
 * Customer self-service ordering kiosk.
 *
 * This view groups menu items by category, allows item customization, and
 * presents a cart-style checkout flow for guests.
 *
 * @returns {JSX.Element}
 */
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import { useTranslation } from "../contexts/TranslationContext";
import ChatBot from "../components/ChatBot";

const CATEGORY_ICONS = {
  "Milk Tea": "🥛", "Fruit Tea": "🍓", "Classic Tea": "🍵", "Brewed Tea": "🍵",
  "Slush": "🧊", "Seasonal": "🌸", "Coffee": "☕",
};

export default function CustomerKiosk() {
  const navigate = useNavigate();
  const { t, translateBatch, lang } = useTranslation();
  const [menu, setMenu] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCat, setActiveCat] = useState(null);
  const [cart, setCart] = useState([]);
  const [modifiers, setModifiers] = useState([]);
  const [customizing, setCustomizing] = useState(null);
  const [choices, setChoices] = useState({});
  const [qty, setQty] = useState(1);
  const [orderPlaced, setOrderPlaced] = useState(null);
  const [reviewing, setReviewing] = useState(false);

  useEffect(() => {
    api.getMenu().then((items) => {
      setMenu(items);
      const cats = [...new Set(items.map((i) => i.category))];
      setCategories(cats);
      if (cats.length) setActiveCat(cats[0]);
    });
  }, []);

  useEffect(() => {
    const strs = [
      "Self-Service Kiosk", "Your Order", "Place Order", "Review Order", "Total",
      "Tap an item to get started", "New Order", "Order Placed!", "← Back",
      "Add to Order", "Cancel", "Qty:", "Continue Shopping", "Confirm & Place Order",
      "Review Your Order", "Remove", "Order Summary",
      ...menu.map((m) => m.name),
      ...categories,
    ];
    translateBatch(strs);
  }, [lang, menu, categories, translateBatch]);

  const openCustomize = async (item) => {
    try {
      const mods = await api.getModifiers(item.menu_item_id);
      setModifiers(mods);
      if (mods.length > 0) {
        translateBatch(mods.flatMap((m) => [m.name, ...m.choices.map((c) => c.label)]));
      }
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
  const updateCartQty = (idx, delta) => {
    setCart((prev) => prev.map((item, i) => {
      if (i !== idx) return item;
      const newQty = item.quantity + delta;
      return newQty <= 0 ? null : { ...item, quantity: newQty };
    }).filter(Boolean));
  };
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
      setReviewing(false);
    } catch (err) {
      alert("Order failed: " + err.message);
    }
  };

  if (orderPlaced) {
    return (
      <div style={st.page}>
        <div style={{ ...st.centered, gap: "1.5rem" }}>
          <span style={{ fontSize: "4rem" }}>✅</span>
          <h1>{t("Order Placed!")}</h1>
          <p style={{ fontSize: "1.3rem", color: "var(--text-light)" }}>
            Order #{orderPlaced.order_id} — {t("Total")}: ${orderPlaced.total.toFixed(2)}
          </p>
          <button className="btn-primary" style={{ fontSize: "1.2rem", padding: "1rem 3rem" }} onClick={() => setOrderPlaced(null)}>
            {t("New Order")}
          </button>
        </div>
      </div>
    );
  }

  /* ======================== CART REVIEW SCREEN ======================== */
  if (reviewing) {
    return (
      <div style={st.page}>
        <header style={st.header}>
          <h1 style={st.logo}>ShareTea</h1>
          <span style={st.headerSub}>{t("Review Your Order")}</span>
        </header>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "1.5rem", maxWidth: 700, width: "100%", margin: "0 auto", overflow: "auto" }}>
          <h2 style={{ fontSize: "1.3rem", marginBottom: "1rem" }}>{t("Order Summary")}</h2>

          {cart.map((c, i) => (
            <div key={i} style={st.reviewItem}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: "1.05rem" }}>{t(c.name)}</div>
                {c.choiceLabels.length > 0 && (
                  <div style={{ fontSize: "0.85rem", color: "var(--text-light)", marginTop: 2 }}>{c.choiceLabels.map((l) => t(l)).join(", ")}</div>
                )}
                <div style={{ fontSize: "0.9rem", color: "var(--primary-dark)", marginTop: 4 }}>${c.unitPrice.toFixed(2)} each</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <button onClick={() => updateCartQty(i, -1)} style={st.qtyBtn}>−</button>
                <span style={{ fontSize: "1.1rem", fontWeight: 700, minWidth: 30, textAlign: "center" }}>{c.quantity}</span>
                <button onClick={() => updateCartQty(i, 1)} style={st.qtyBtn}>+</button>
              </div>
              <div style={{ fontWeight: 700, fontSize: "1.1rem", minWidth: 70, textAlign: "right" }}>${(c.unitPrice * c.quantity).toFixed(2)}</div>
              <button onClick={() => removeFromCart(i)} style={{ background: "none", border: "none", color: "var(--danger)", fontWeight: 700, fontSize: "1.2rem", marginLeft: "0.5rem" }}>✕</button>
            </div>
          ))}

          <div style={{ borderTop: "3px solid var(--border)", marginTop: "1rem", paddingTop: "1rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "1.4rem", fontWeight: 700 }}>
              <span>{t("Total")}</span>
              <span>${cartTotal.toFixed(2)}</span>
            </div>
          </div>

          <div style={{ display: "flex", gap: "1rem", marginTop: "1.5rem" }}>
            <button className="btn-outline" onClick={() => setReviewing(false)} style={{ flex: 1, padding: "0.9rem", fontSize: "1.05rem" }}>
              {t("Continue Shopping")}
            </button>
            <button className="btn-primary" onClick={placeOrder} style={{ flex: 1, padding: "0.9rem", fontSize: "1.05rem" }} disabled={cart.length === 0}>
              {t("Confirm & Place Order")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const filtered = menu.filter((i) => i.category === activeCat);

  return (
    <div style={st.page}>
      <header style={st.header}>
        <button onClick={() => navigate("/")} style={st.backBtn} aria-label="Back to portal">{t("← Back")}</button>
        <h1 style={st.logo}>ShareTea</h1>
        <span style={st.headerSub}>{t("Self-Service Kiosk")}</span>
      </header>

      <div style={st.body}>
        {/* Category sidebar */}
        <nav style={st.sidebar}>
          {categories.map((cat) => (
            <button key={cat} onClick={() => setActiveCat(cat)}
              style={{ ...st.catBtn, ...(cat === activeCat ? st.catBtnActive : {}) }}>
              <span style={{ fontSize: "1.5rem" }}>{CATEGORY_ICONS[cat] || "🧋"}</span>
              <span>{t(cat)}</span>
            </button>
          ))}
        </nav>

        {/* Menu grid */}
        <main style={st.menuGrid}>
          {filtered.map((item) => (
            <button key={item.menu_item_id} style={st.menuCard} onClick={() => openCustomize(item)}>
              <div style={st.menuCardIcon}>{CATEGORY_ICONS[item.category] || "🧋"}</div>
              <div style={st.menuCardName}>{t(item.name)}</div>
              <div style={st.menuCardPrice}>${parseFloat(item.base_price).toFixed(2)}</div>
            </button>
          ))}
        </main>

        {/* Cart panel */}
        <aside style={st.cartPanel}>
          <h2 style={{ fontSize: "1.1rem", marginBottom: "0.75rem" }}>{t("Your Order")}</h2>
          {cart.length === 0 && <p style={{ color: "var(--text-light)", fontSize: "0.9rem" }}>{t("Tap an item to get started")}</p>}
          <div style={{ flex: 1, overflowY: "auto" }}>
            {cart.map((c, i) => (
              <div key={i} style={st.cartItem}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: "0.95rem" }}>{t(c.name)} x{c.quantity}</div>
                  {c.choiceLabels.length > 0 && (
                    <div style={{ fontSize: "0.8rem", color: "var(--text-light)" }}>{c.choiceLabels.map((l) => t(l)).join(", ")}</div>
                  )}
                </div>
                <div style={{ fontWeight: 600 }}>${(c.unitPrice * c.quantity).toFixed(2)}</div>
                <button onClick={() => removeFromCart(i)} style={st.removeBtn}>✕</button>
              </div>
            ))}
          </div>
          <div style={st.cartFooter}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "1.2rem", fontWeight: 700 }}>
              <span>{t("Total")}</span>
              <span>${cartTotal.toFixed(2)}</span>
            </div>
            <button className="btn-primary" disabled={cart.length === 0} onClick={() => setReviewing(true)}
              style={{ width: "100%", padding: "0.9rem", fontSize: "1.1rem", marginTop: "0.75rem", opacity: cart.length === 0 ? 0.5 : 1 }}>
              {t("Review Order")}
            </button>
          </div>
        </aside>
      </div>

      {/* Customization modal */}
      {customizing && (
        <div style={st.overlay} onClick={() => setCustomizing(null)}>
          <div style={st.modal} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ marginBottom: "0.5rem" }}>{t(customizing.name)}</h2>
            <p style={{ color: "var(--text-light)" }}>Base: ${parseFloat(customizing.base_price).toFixed(2)}</p>

            {modifiers.map((mod) => (
              <div key={mod.modifier_id} style={{ marginTop: "1rem" }}>
                <h3 style={{ fontSize: "0.95rem", marginBottom: "0.5rem" }}>{t(mod.name)}</h3>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                  {mod.choices.map((c) => {
                    const sel = choices[mod.modifier_id] === c.choice_id;
                    return (
                      <button key={c.choice_id}
                        onClick={() => setChoices((prev) => ({ ...prev, [mod.modifier_id]: sel ? null : c.choice_id }))}
                        style={{ ...st.choiceBtn, ...(sel ? st.choiceBtnSel : {}) }}>
                        {t(c.label)}
                        {c.price_delta > 0 && ` (+$${c.price_delta.toFixed(2)})`}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            <div style={{ marginTop: "1rem", display: "flex", alignItems: "center", gap: "1rem" }}>
              <span style={{ fontWeight: 600 }}>{t("Qty:")}</span>
              <button onClick={() => setQty(Math.max(1, qty - 1))} style={st.qtyBtn}>−</button>
              <span style={{ fontSize: "1.2rem", fontWeight: 700, minWidth: 30, textAlign: "center" }}>{qty}</span>
              <button onClick={() => setQty(qty + 1)} style={st.qtyBtn}>+</button>
            </div>

            <div style={{ marginTop: "1.5rem", display: "flex", gap: "0.75rem" }}>
              <button className="btn-outline" onClick={() => setCustomizing(null)} style={{ flex: 1 }}>{t("Cancel")}</button>
              <button className="btn-primary" onClick={addToCart} style={{ flex: 1 }}>{t("Add to Order")}</button>
            </div>
          </div>
        </div>
      )}

      <ChatBot />
    </div>
  );
}

const st = {
  page: { height: "100vh", display: "flex", flexDirection: "column", background: "var(--bg)", overflow: "hidden" },
  centered: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", textAlign: "center" },
  header: { display: "flex", alignItems: "center", gap: "1rem", padding: "0.75rem 1.5rem", background: "var(--accent)", color: "#fff" },
  backBtn: { background: "rgba(255,255,255,0.15)", border: "none", color: "#fff", padding: "0.4rem 0.8rem", borderRadius: 8, fontWeight: 600, fontSize: "0.9rem" },
  logo: { fontSize: "1.5rem", fontWeight: 700 },
  headerSub: { fontSize: "0.9rem", opacity: 0.85 },
  body: { flex: 1, display: "flex", overflow: "hidden" },
  sidebar: { width: 140, background: "var(--card)", borderRight: "1px solid var(--border)", display: "flex", flexDirection: "column", padding: "0.5rem", gap: "0.25rem", overflowY: "auto" },
  catBtn: { display: "flex", flexDirection: "column", alignItems: "center", gap: "0.2rem", padding: "0.75rem 0.5rem", borderRadius: 10, background: "transparent", border: "none", fontSize: "0.8rem", fontWeight: 500, color: "var(--text)" },
  catBtnActive: { background: "var(--primary)", color: "#fff" },
  menuGrid: { flex: 1, display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "1rem", padding: "1rem", overflowY: "auto", alignContent: "start" },
  menuCard: { background: "var(--card)", borderRadius: "var(--radius)", boxShadow: "var(--shadow)", padding: "1.25rem 1rem", display: "flex", flexDirection: "column", alignItems: "center", gap: "0.4rem", border: "2px solid transparent", textAlign: "center" },
  menuCardIcon: { fontSize: "2.5rem" },
  menuCardName: { fontWeight: 600, fontSize: "0.95rem" },
  menuCardPrice: { color: "var(--primary-dark)", fontWeight: 700 },
  cartPanel: { width: 300, background: "var(--card)", borderLeft: "1px solid var(--border)", display: "flex", flexDirection: "column", padding: "1rem" },
  cartItem: { display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.5rem 0", borderBottom: "1px solid var(--border)" },
  removeBtn: { background: "none", border: "none", color: "var(--danger)", fontWeight: 700, fontSize: "1rem" },
  cartFooter: { borderTop: "2px solid var(--border)", paddingTop: "0.75rem", marginTop: "auto" },
  overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 500 },
  modal: { background: "var(--card)", borderRadius: "var(--radius)", padding: "2rem", width: "90%", maxWidth: 460, maxHeight: "90vh", overflowY: "auto" },
  choiceBtn: { padding: "0.5rem 1rem", borderRadius: 20, border: "2px solid var(--border)", background: "var(--bg)", fontWeight: 500, fontSize: "0.9rem" },
  choiceBtnSel: { borderColor: "var(--primary)", background: "var(--primary)", color: "#fff" },
  qtyBtn: { width: 40, height: 40, borderRadius: "50%", border: "2px solid var(--border)", background: "var(--bg)", fontWeight: 700, fontSize: "1.2rem", display: "flex", alignItems: "center", justifyContent: "center" },
  reviewItem: { display: "flex", alignItems: "center", gap: "1rem", padding: "1rem 0", borderBottom: "1px solid var(--border)" },
};
