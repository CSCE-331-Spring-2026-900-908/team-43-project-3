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

}