/**
 * Customer self-service ordering kiosk.
 *
 * This view groups menu items by category, allows item customization, and
 * presents a cart-style checkout flow for guests.
 *
 * @returns {JSX.Element}
 */
import { useState, useEffect, useRef } from "react";
import { api } from "../api";
import { useTranslation } from "../contexts/TranslationContext";
import ChatBot from "../components/ChatBot";

/* ---- Colorful Filled Category Icons ---- */
function CategoryIcon({ category, size = 30 }) {
  const s = size;
  switch (category) {
    case "Milk Tea":
      return (
        <svg width={s} height={s} viewBox="0 0 32 32" fill="none">
          <line x1="20" y1="2" x2="18" y2="10" stroke="#7c4a2d" strokeWidth="2" strokeLinecap="round"/>
          <rect x="8" y="8" width="16" height="3" rx="1.5" fill="#c49464"/>
          <path d="M9 11h14l-2 17H11L9 11z" fill="#d4a574"/>
          <circle cx="14" cy="22" r="2" fill="#3d2b1f"/>
          <circle cx="18" cy="23" r="2" fill="#3d2b1f"/>
          <circle cx="16" cy="20" r="2" fill="#3d2b1f"/>
        </svg>
      );
    case "Fruit Tea":
      return (
        <svg width={s} height={s} viewBox="0 0 32 32" fill="none">
          <path d="M9 8h14l-2 20H11L9 8z" fill="#ffcdd2"/>
          <rect x="8" y="7" width="16" height="2.5" rx="1" fill="#ef9a9a"/>
          <circle cx="23" cy="10" r="5" fill="#ff9800"/>
          <line x1="21" y1="10" x2="25" y2="10" stroke="#fff3e0" strokeWidth="1"/>
          <line x1="23" y1="8" x2="23" y2="12" stroke="#fff3e0" strokeWidth="1"/>
          <circle cx="14" cy="17" r="1.5" fill="#e53935"/>
          <circle cx="17" cy="20" r="1.5" fill="#ff9800"/>
        </svg>
      );
    case "Classic Tea":
    case "Brewed Tea":
      return (
        <svg width={s} height={s} viewBox="0 0 32 32" fill="none">
          <path d="M12 6c0-2 2-3 2-5" stroke="#a5d6a7" strokeWidth="1.5" strokeLinecap="round"/>
          <path d="M17 7c0-2 2-3 2-5" stroke="#a5d6a7" strokeWidth="1.5" strokeLinecap="round"/>
          <path d="M6 12h18v10a6 6 0 0 1-6 6h-6a6 6 0 0 1-6-6V12z" fill="#a5d6a7"/>
          <path d="M24 15c3 0 4 2 4 4s-1 4-4 4" stroke="#81c784" strokeWidth="2.5" strokeLinecap="round"/>
          <ellipse cx="15" cy="28" rx="10" ry="2" fill="#81c784"/>
        </svg>
      );
    case "Slush":
      return (
        <svg width={s} height={s} viewBox="0 0 32 32" fill="none">
          <line x1="16" y1="1" x2="16" y2="11" stroke="#f44336" strokeWidth="2" strokeLinecap="round"/>
          <path d="M8 12c0 0 2-5 8-5s8 5 8 5" fill="#e3f2fd" stroke="#90caf9" strokeWidth="1"/>
          <path d="M9 12h14l-2 18H11L9 12z" fill="#90caf9"/>
          <rect x="12" y="15" width="4" height="3" rx="1" fill="#e3f2fd" opacity="0.8"/>
          <rect x="17" y="18" width="3" height="3" rx="1" fill="#e3f2fd" opacity="0.8"/>
          <rect x="11" y="21" width="3" height="2" rx="1" fill="#e3f2fd" opacity="0.8"/>
        </svg>
      );
    case "Seasonal":
      return (
        <svg width={s} height={s} viewBox="0 0 32 32" fill="none">
          <circle cx="16" cy="16" r="6" fill="#ffb74d"/>
          <path d="M16 4v4M16 24v4M4 16h4M24 16h4M7.5 7.5l2.8 2.8M21.7 21.7l2.8 2.8M24.5 7.5l-2.8 2.8M10.3 21.7l-2.8 2.8" stroke="#ffb74d" strokeWidth="2.5" strokeLinecap="round"/>
        </svg>
      );
    case "Coffee":
      return (
        <svg width={s} height={s} viewBox="0 0 32 32" fill="none">
          <path d="M11 7c0-2.5 2.5-3 2.5-5.5" stroke="#bcaaa4" strokeWidth="1.5" strokeLinecap="round"/>
          <path d="M16 8c0-2.5 2.5-3 2.5-5.5" stroke="#bcaaa4" strokeWidth="1.5" strokeLinecap="round"/>
          <path d="M5 12h18v10a6 6 0 0 1-6 6h-6a6 6 0 0 1-6-6V12z" fill="#8d6e63"/>
          <ellipse cx="14" cy="13.5" rx="7.5" ry="1.8" fill="#6d4c41"/>
          <path d="M23 15c3 0 4 2 4 4s-1 4-4 4" stroke="#8d6e63" strokeWidth="2.5" strokeLinecap="round"/>
        </svg>
      );
    default:
      return (
        <svg width={s} height={s} viewBox="0 0 32 32" fill="none">
          <line x1="16" y1="1" x2="16" y2="7" stroke="#7c4a2d" strokeWidth="2" strokeLinecap="round"/>
          <rect x="9" y="6" width="14" height="2.5" rx="1" fill="#c49464"/>
          <path d="M10 8.5h12l-1.5 19h-9L10 8.5z" fill="#d4a574"/>
          <circle cx="14" cy="21" r="2" fill="#3d2b1f"/>
          <circle cx="18" cy="22" r="2" fill="#3d2b1f"/>
        </svg>
      );
  }
}

const SEASONS = [
  { id: "spring", label: "Spring", categories: ["Fruit Tea", "Seasonal"], max: 4 },
  { id: "summer", label: "Summer", categories: ["Slush", "Classic Tea"], max: 4 },
  { id: "fall", label: "Fall", categories: ["Coffee", "Brewed Tea"], max: 4 },
  { id: "winter", label: "Winter", categories: ["Milk Tea"], max: 4 },
];

/* ---- Slot Machine Prize Component ---- */
const SLOT_SYMBOLS = ["🍵", "☕", "🧋", "⭐", "💎", "💰"];

function PrizeWheel({ onResult }) {
  const [isJackpot] = useState(() => Math.random() < 0.05);
  const finalsRef = useRef(null);

  if (!finalsRef.current) {
    if (isJackpot) {
      finalsRef.current = ["💰", "💰", "💰"];
    } else {
      let r;
      do {
        r = Array.from({ length: 3 }, () => SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)]);
      } while (r[0] === "💰" && r[1] === "💰" && r[2] === "💰");
      finalsRef.current = r;
    }
  }

  const finals = finalsRef.current;
  const [display, setDisplay] = useState(["🍵", "☕", "🧋"]);
  const [stopped, setStopped] = useState([false, false, false]);
  const [done, setDone] = useState(false);
  const stoppedRef = useRef([false, false, false]);

  useEffect(() => {
    const interval = setInterval(() => {
      setDisplay(
        [0, 1, 2].map((i) =>
          stoppedRef.current[i] ? finals[i] : SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)]
        )
      );
    }, 80);

    const t1 = setTimeout(() => {
      stoppedRef.current = [true, false, false];
      setStopped([true, false, false]);
    }, 1000);

    const t2 = setTimeout(() => {
      stoppedRef.current = [true, true, false];
      setStopped([true, true, false]);
    }, 1800);

    const t3 = setTimeout(() => {
      stoppedRef.current = [true, true, true];
      setStopped([true, true, true]);
      clearInterval(interval);
      setDisplay(finals);
    }, 2500);

    const t4 = setTimeout(() => setDone(true), 2900);

    return () => {
      clearInterval(interval);
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [finals]);

  return (
    <div style={whl.overlay}>
      <div style={whl.container}>
        <h2 style={whl.title}>SPIN TO WIN!</h2>
        <p style={whl.subtitle}>Match all three 💰 for JACKPOT!</p>

        <div style={whl.reelsRow}>
          {display.map((sym, i) => (
            <div
              key={i}
              style={{
                ...whl.reel,
                ...(stopped[i] ? whl.reelStopped : {}),
                ...(done && isJackpot ? whl.reelJackpot : {}),
              }}
            >
              <span
                style={{
                  fontSize: "2.8rem",
                  display: "block",
                  filter: stopped[i] ? "none" : "blur(1.5px)",
                  transition: "filter 0.2s",
                }}
              >
                {sym}
              </span>
            </div>
          ))}
        </div>

        {!done && (
          <p style={{ color: "var(--text-light)", marginTop: "1.2rem", fontSize: "0.95rem" }}>
            {stopped[2] ? "Revealing..." : stopped[1] ? "One more..." : stopped[0] ? "Keep going..." : "Spinning..."}
          </p>
        )}

        {done && (
          <div style={{ marginTop: "1.5rem" }}>
            {isJackpot ? (
              <>
                <h1 style={{ color: "#ffd700", fontSize: "2.5rem", margin: "0.5rem 0", textShadow: "0 0 20px rgba(255,215,0,0.6)" }}>JACKPOT!</h1>
                <p style={{ fontSize: "1.2rem", color: "var(--text)" }}>100% OFF your entire order!</p>
                <button className="btn-primary" onClick={() => onResult(true)} style={{ marginTop: "1rem", padding: "0.8rem 2.5rem", fontSize: "1.1rem" }}>
                  Claim Your Free Order!
                </button>
              </>
            ) : (
              <>
                <h2 style={{ color: "var(--text)", margin: "0.5rem 0" }}>No prize this time!</h2>
                <p style={{ color: "var(--text-light)" }}>Better luck next time!</p>
                <button className="btn-primary" onClick={() => onResult(false)} style={{ marginTop: "1rem", padding: "0.8rem 2.5rem", fontSize: "1.1rem" }}>
                  Continue
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

const whl = {
  overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 },
  container: { background: "var(--card)", borderRadius: 24, padding: "2.5rem 2rem", textAlign: "center", minWidth: 360, maxWidth: 440 },
  title: { fontSize: "1.6rem", fontWeight: 700, color: "var(--primary-dark)", marginBottom: "0.25rem" },
  subtitle: { color: "var(--text-light)", fontSize: "0.9rem", marginBottom: "1.5rem" },
  reelsRow: { display: "flex", justifyContent: "center", gap: "0.75rem" },
  reel: {
    width: 90,
    height: 90,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(145deg, #f5f0eb, #e8e0d6)",
    borderRadius: 16,
    border: "3px solid var(--border)",
    transition: "all 0.3s ease",
  },
  reelStopped: { border: "3px solid var(--primary)", background: "linear-gradient(145deg, #fff8f0, #fff)", transform: "scale(1.05)" },
  reelJackpot: { border: "3px solid #ffd700", boxShadow: "0 0 24px rgba(255,215,0,0.5)", transform: "scale(1.1)" },
};

export default function CustomerKiosk() {
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
  const [showWheel, setShowWheel] = useState(false);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [showSeasonal, setShowSeasonal] = useState(false);
  const [selectedSeason, setSelectedSeason] = useState("spring");

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
      "Tap an item to get started", "New Order", "Order Placed!",
      "Add to Order", "Cancel", "Qty:", "Continue Shopping", "Confirm & Place Order",
      "Review Your Order", "Remove", "Order Summary",
      "Drink of the Season", "Spring", "Summer", "Fall", "Winter",
      "Seasonal Picks", "Placing your order...",
      ...menu.map((m) => m.name),
      ...categories,
    ];
    translateBatch(strs);
  }, [lang, menu, categories, translateBatch]);

  /**
   * Open modifier selection dialog for item.
   * @async
   * @param {Object} item - Menu item to customize.
   */
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

  /**
   * Add customized item with selected modifiers to cart.
   */
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

  /**
   * Remove cart line item at index.
   * @param {number} idx - Cart line index.
   */
  const removeFromCart = (idx) => setCart((c) => c.filter((_, i) => i !== idx));
  /**
   * Adjust cart line quantity by delta. Remove if quantity becomes 0.
   * @param {number} idx - Cart line index.
   * @param {number} delta - Quantity change (+1 or -1).
   */
  const updateCartQty = (idx, delta) => {
    setCart((prev) => prev.map((item, i) => {
      if (i !== idx) return item;
      const newQty = item.quantity + delta;
      return newQty <= 0 ? null : { ...item, quantity: newQty };
    }).filter(Boolean));
  };

  const cartTotal = cart.reduce((s, i) => s + i.unitPrice * i.quantity, 0);

  /**
   * Submit cart as order and show confirmation screen.
   * @async
   */
  const placeOrder = async (jackpot = false) => {
    setPlacingOrder(true);
    setShowWheel(false);
    try {
      const result = await api.submitOrder({
        items: cart.map((c) => ({
          menu_item_id: c.menu_item_id,
          quantity: c.quantity,
          choice_ids: c.choice_ids,
        })),
        jackpot,
      });
      setOrderPlaced({ ...result, jackpot });
      setCart([]);
      setReviewing(false);
    } catch (err) {
      alert("Order failed: " + err.message);
    } finally {
      setPlacingOrder(false);
    }
  };

  /* ======================== PLACING ORDER LOADING ======================== */
  if (placingOrder) {
    return (
      <div style={st.page}>
        <div style={{ ...st.centered, gap: "1rem" }}>
          <div style={{ width: 60, height: 60, border: "5px solid var(--border)", borderTop: "5px solid var(--primary)", borderRadius: "50%", animation: "spin-prize 0.6s linear infinite" }} />
          <h2>{t("Placing your order...")}</h2>
        </div>
      </div>
    );
  }

  if (orderPlaced) {
    return (
      <div style={st.page}>
        <div style={{ ...st.centered, gap: "1.5rem" }}>
          {orderPlaced.jackpot ? (
            <>
              <span style={{ fontSize: "5rem" }}>🎉</span>
              <h1 style={{ color: "#ffd700", fontSize: "2.5rem" }}>JACKPOT!</h1>
              <p style={{ fontSize: "1.3rem" }}>Your order is FREE!</p>
              <p style={{ fontSize: "1.1rem", color: "var(--text-light)" }}>
                Order #{orderPlaced.order_id} — {t("Total")}: $0.00
              </p>
            </>
          ) : (
            <>
              <span style={{ fontSize: "4rem" }}>✅</span>
              <h1>{t("Order Placed!")}</h1>
              <p style={{ fontSize: "1.3rem", color: "var(--text-light)" }}>
                Order #{orderPlaced.order_id} — {t("Total")}: ${orderPlaced.total.toFixed(2)}
              </p>
            </>
          )}
          <button className="btn-primary" style={{ fontSize: "1.2rem", padding: "1rem 3rem" }} onClick={() => setOrderPlaced(null)}>
            {t("New Order")}
          </button>
        </div>
      </div>
    );
  }

  /* ======================== PRIZE WHEEL ======================== */
  if (showWheel) {
    return <PrizeWheel onResult={(jackpot) => placeOrder(jackpot)} />;
  }

  /* ======================== CART REVIEW SCREEN ======================== */
  if (reviewing) {
    return (
      <div style={st.page}>
        <header style={st.header}>
          <div style={st.headerTitle}>
            <h1 style={st.logo}>Iroh's Tea</h1>
            <span style={st.headerSub}>{t("Review Your Order")}</span>
          </div>
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
            <button className="btn-primary" onClick={() => setShowWheel(true)} style={{ flex: 1, padding: "0.9rem", fontSize: "1.05rem" }} disabled={cart.length === 0}>
              {t("Confirm & Place Order")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentSeason = SEASONS.find((s) => s.id === selectedSeason);
  const seasonalDrinks = currentSeason
    ? menu.filter((item) => currentSeason.categories.includes(item.category)).slice(0, currentSeason.max)
    : [];
  const filtered = showSeasonal ? seasonalDrinks : menu.filter((i) => i.category === activeCat);

  return (
    <div style={st.page}>
      <header style={st.header}>
        <div style={st.headerTitle}>
          <h1 style={st.logo}>Iroh's Tea</h1>
          <span style={st.headerSub}>{t("Self-Service Kiosk")}</span>
        </div>
      </header>

      <div style={st.body}>
        {/* Category sidebar */}
        <nav style={st.sidebar}>
          <button
            onClick={() => { setShowSeasonal(true); setActiveCat(null); }}
            style={{ ...st.catBtn, ...(showSeasonal ? st.catBtnActive : {}), borderBottom: "2px solid var(--border)", paddingBottom: "0.75rem", marginBottom: "0.25rem" }}
          >
            <CategoryIcon category="Seasonal" size={24} />
            <span style={{ fontSize: "0.72rem", lineHeight: 1.2 }}>{t("Drink of the Season")}</span>
          </button>

          {categories.map((cat) => (
            <button key={cat} onClick={() => { setActiveCat(cat); setShowSeasonal(false); }}
              style={{ ...st.catBtn, ...(cat === activeCat && !showSeasonal ? st.catBtnActive : {}) }}>
              <CategoryIcon category={cat} size={24} />
              <span>{t(cat)}</span>
            </button>
          ))}
        </nav>

        {/* Menu grid */}
        <main style={st.menuArea}>
          {showSeasonal && (
            <div style={st.seasonBar}>
              <h2 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "0.75rem" }}>{t("Drink of the Season")}</h2>
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                {SEASONS.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setSelectedSeason(s.id)}
                    style={{
                      padding: "0.5rem 1.2rem",
                      borderRadius: 20,
                      fontWeight: 600,
                      fontSize: "0.9rem",
                      border: selectedSeason === s.id ? "2px solid var(--primary)" : "2px solid var(--border)",
                      background: selectedSeason === s.id ? "var(--primary)" : "var(--bg)",
                      color: selectedSeason === s.id ? "#fff" : "var(--text)",
                    }}
                  >
                    {t(s.label)}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div style={st.menuGrid}>
            {filtered.map((item) => (
              <button key={item.menu_item_id} style={st.menuCard} onClick={() => openCustomize(item)}>
                <div style={st.menuCardName}>{t(item.name)}</div>
                <div style={st.menuCardPrice}>${parseFloat(item.base_price).toFixed(2)}</div>
              </button>
            ))}
            {filtered.length === 0 && (
              <p style={{ color: "var(--text-light)", gridColumn: "1 / -1", textAlign: "center", padding: "2rem" }}>
                {t("Seasonal Picks")}
              </p>
            )}
          </div>
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
  headerTitle: { display: "flex", alignItems: "center", gap: "1rem", minWidth: 0 },
  logo: { fontSize: "1.5rem", fontWeight: 700 },
  headerSub: { fontSize: "0.9rem", opacity: 0.85 },
  body: { flex: 1, display: "flex", overflow: "hidden" },
  sidebar: { width: 140, background: "var(--card)", borderRight: "1px solid var(--border)", display: "flex", flexDirection: "column", padding: "0.5rem", gap: "0.25rem", overflowY: "auto" },
  catBtn: { display: "flex", flexDirection: "column", alignItems: "center", gap: "0.3rem", padding: "0.75rem 0.5rem", borderRadius: 10, background: "transparent", border: "none", fontSize: "0.8rem", fontWeight: 500, color: "var(--text)" },
  catBtnActive: { background: "var(--primary)", color: "#fff" },
  menuArea: { flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" },
  seasonBar: { padding: "1rem", background: "var(--card)", borderBottom: "1px solid var(--border)" },
  menuGrid: { flex: 1, display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "1rem", padding: "1rem", overflowY: "auto", alignContent: "start" },
  menuCard: { background: "var(--card)", borderRadius: "var(--radius)", boxShadow: "var(--shadow)", padding: "1.25rem 1rem", display: "flex", flexDirection: "column", alignItems: "center", gap: "0.4rem", border: "2px solid transparent", textAlign: "center" },
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