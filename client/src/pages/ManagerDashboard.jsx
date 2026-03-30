import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";

const TABS = ["Menu", "Inventory", "Employees", "Reports"];

export default function ManagerDashboard() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("Menu");
  return (
    <div style={s.page}>
      <header style={s.header}>
        <button onClick={() => navigate("/")} style={{ background: "none", border: "1px solid var(--border)", borderRadius: 8, padding: "0.3rem 0.7rem", fontWeight: 600, fontSize: "0.85rem", color: "var(--text-light)" }}>← Back</button>
        <h1 style={{ fontSize: "1.2rem", fontWeight: 700 }}>Manager Dashboard</h1>
        <nav style={{ display: "flex", gap: "0.25rem", marginLeft: "auto" }}>
          {TABS.map((t) => (
            <button key={t} onClick={() => setTab(t)} style={{ ...s.tabBtn, ...(t === tab ? s.tabActive : {}) }}>{t}</button>
          ))}
        </nav>
      </header>
      <main style={s.main}>
        {tab === "Menu" && <MenuTab />}
        {tab === "Inventory" && <InventoryTab />}
        {tab === "Employees" && <EmployeeTab />}
        {tab === "Reports" && <ReportsTab />}
      </main>
    </div>
  );
}

function MenuTab() {
  const [items, setItems] = useState([]);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: "", category: "", base_price: "" });

  const load = () => api.getMenu().then(setItems);
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (editing === "new") {
      await api.createMenuItem(form);
    } else {
      await api.updateMenuItem(editing, form);
    }
    setEditing(null);
    load();
  };

  const startEdit = (item) => {
    setForm({ name: item.name, category: item.category, base_price: item.base_price });
    setEditing(item.menu_item_id);
  };

  const del = async (id) => {
    if (!confirm("Delete this item?")) return;
    await api.deleteMenuItem(id);
    load();
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
        <h2 style={{ fontSize: "1.1rem" }}>Menu Items ({items.length})</h2>
        <button className="btn-primary" onClick={() => { setForm({ name: "", category: "", base_price: "" }); setEditing("new"); }}>+ Add Item</button>
      </div>

      {editing !== null && (
        <div className="card" style={{ marginBottom: "1rem", display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "end" }}>
          <label style={s.field}>Name <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
          <label style={s.field}>Category <input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} /></label>
          <label style={s.field}>Price <input type="number" step="0.01" value={form.base_price} onChange={(e) => setForm({ ...form, base_price: e.target.value })} /></label>
          <button className="btn-primary" onClick={save}>Save</button>
          <button className="btn-outline" onClick={() => setEditing(null)}>Cancel</button>
        </div>
      )}

      <div className="card" style={{ overflowX: "auto" }}>
        <table>
          <thead><tr><th>ID</th><th>Name</th><th>Category</th><th>Price</th><th>Ingredients</th><th>Actions</th></tr></thead>
          <tbody>
            {items.map((i) => (
              <tr key={i.menu_item_id}>
                <td>{i.menu_item_id}</td>
                <td>{i.name}</td>
                <td>{i.category}</td>
                <td>${parseFloat(i.base_price).toFixed(2)}</td>
                <td>{i.ingredient_count}</td>
                <td style={{ display: "flex", gap: "0.5rem" }}>
                  <button className="btn-outline" style={{ padding: "0.25rem 0.6rem", fontSize: "0.8rem" }} onClick={() => startEdit(i)}>Edit</button>
                  <button className="btn-danger" style={{ padding: "0.25rem 0.6rem", fontSize: "0.8rem" }} onClick={() => del(i.menu_item_id)}>Del</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function InventoryTab() {
  const [items, setItems] = useState([]);
  const load = () => api.getInventory().then(setItems);
  useEffect(() => { load(); }, []);

  const updateQty = async (item) => {
    const qty = prompt(`New quantity for ${item.name}:`, item.stock_quantity);
    if (qty === null) return;
    await api.updateInventory(item.inventory_item_id, { stock_quantity: parseFloat(qty) });
    load();
  };

  return (
    <div>
      <h2 style={{ fontSize: "1.1rem", marginBottom: "1rem" }}>Inventory ({items.length} items)</h2>
      <div className="card" style={{ overflowX: "auto" }}>
        <table>
          <thead><tr><th>ID</th><th>Name</th><th>Unit</th><th>Stock Qty</th><th>Actions</th></tr></thead>
          <tbody>
            {items.map((i) => (
              <tr key={i.inventory_item_id}>
                <td>{i.inventory_item_id}</td>
                <td>{i.name}</td>
                <td>{i.unit}</td>
                <td>{parseFloat(i.stock_quantity).toFixed(1)}</td>
                <td><button className="btn-outline" style={{ padding: "0.25rem 0.6rem", fontSize: "0.8rem" }} onClick={() => updateQty(i)}>Update Qty</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
