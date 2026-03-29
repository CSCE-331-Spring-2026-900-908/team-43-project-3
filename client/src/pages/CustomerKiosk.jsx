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
}