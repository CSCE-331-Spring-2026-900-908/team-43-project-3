/**
 * Manager dashboard shell.
 *
 * The dashboard switches between menu, inventory, employee, and report
 * tools that are all backed by the shared API layer.
 *
 * @returns {JSX.Element}
 */
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import { useTranslation } from "../contexts/TranslationContext";

const TABS = ["Menu", "Inventory", "Employees", "Reports"];

export default function ManagerDashboard() {
  const navigate = useNavigate();
  const { t, translateBatch, lang } = useTranslation();
  const [tab, setTab] = useState("Menu");

  useEffect(() => {
    translateBatch(["Manager Dashboard", "Menu", "Inventory", "Employees", "Reports", "← Back"]);
  }, [lang, translateBatch]);

  return (
    <div style={s.page}>
      <header style={s.header}>
        <button onClick={() => navigate("/")} style={{ background: "none", border: "1px solid var(--border)", borderRadius: 8, padding: "0.3rem 0.7rem", fontWeight: 600, fontSize: "0.85rem", color: "var(--text-light)" }}>{t("← Back")}</button>
        <h1 style={{ fontSize: "1.2rem", fontWeight: 700 }}>{t("Manager Dashboard")}</h1>
        <nav style={{ display: "flex", gap: "0.25rem", marginLeft: "auto" }}>
          {TABS.map((tb) => (
            <button key={tb} onClick={() => setTab(tb)} style={{ ...s.tabBtn, ...(tb === tab ? s.tabActive : {}) }}>{t(tb)}</button>
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

/* ======================== MENU TAB ======================== */
function MenuTab() {
  const { t, translateBatch, lang } = useTranslation();
  const [items, setItems] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: "", category: "", base_price: "" });
  const [ingredients, setIngredients] = useState([]);

  const load = () => api.getMenu().then(setItems);
  useEffect(() => { load(); api.getInventory().then(setInventory); }, []);

  useEffect(() => {
    const strs = ["Menu Items", "Add Item", "Save", "Cancel", "Name", "Category", "Price", "Ingredients", "Actions", "Edit", "Del", "Add Ingredient", "Ingredient", "Qty Used", "Remove"];
    strs.push(...items.map((i) => i.name));
    translateBatch(strs);
  }, [lang, items, translateBatch]);

  const startEdit = async (item) => {
    setForm({ name: item.name, category: item.category, base_price: item.base_price });
    setEditing(item.menu_item_id);
    try {
      const detail = await api.getMenuItem(item.menu_item_id);
      setIngredients(detail.ingredients?.map((ig) => ({
        inventory_item_id: ig.inventory_item_id,
        ingredient_name: ig.ingredient_name,
        quantity_used: ig.quantity_used,
      })) || []);
    } catch {
      setIngredients([]);
    }
  };

  const startNew = () => {
    setForm({ name: "", category: "", base_price: "" });
    setEditing("new");
    setIngredients([]);
  };

  const save = async () => {
    const payload = { ...form, ingredients: ingredients.map((ig) => ({ inventory_item_id: ig.inventory_item_id, quantity_used: ig.quantity_used })) };
    if (editing === "new") {
      await api.createMenuItem(payload);
    } else {
      await api.updateMenuItem(editing, payload);
    }
    setEditing(null);
    setIngredients([]);
    load();
  };

  const del = async (id) => {
    if (!confirm("Delete this item?")) return;
    await api.deleteMenuItem(id);
    load();
  };

  const addIngredientRow = () => {
    if (inventory.length === 0) return;
    setIngredients((prev) => [...prev, { inventory_item_id: inventory[0].inventory_item_id, ingredient_name: inventory[0].name, quantity_used: 1 }]);
  };

  const updateIngredient = (idx, field, value) => {
    setIngredients((prev) => prev.map((ig, i) => {
      if (i !== idx) return ig;
      if (field === "inventory_item_id") {
        const inv = inventory.find((iv) => iv.inventory_item_id === parseInt(value));
        return { ...ig, inventory_item_id: parseInt(value), ingredient_name: inv?.name || "" };
      }
      return { ...ig, [field]: field === "quantity_used" ? parseFloat(value) || 0 : value };
    }));
  };

  const removeIngredient = (idx) => setIngredients((prev) => prev.filter((_, i) => i !== idx));

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
        <h2 style={{ fontSize: "1.1rem" }}>{t("Menu Items")} ({items.length})</h2>
        <button className="btn-primary" onClick={startNew}>+ {t("Add Item")}</button>
      </div>

      {editing !== null && (
        <div className="card" style={{ marginBottom: "1rem" }}>
          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "end", marginBottom: "1rem" }}>
            <label style={s.field}>{t("Name")} <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
            <label style={s.field}>{t("Category")} <input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} /></label>
            <label style={s.field}>{t("Price")} <input type="number" step="0.01" value={form.base_price} onChange={(e) => setForm({ ...form, base_price: e.target.value })} /></label>
          </div>

          <div style={{ borderTop: "1px solid var(--border)", paddingTop: "0.75rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
              <h3 style={{ fontSize: "0.95rem", fontWeight: 600 }}>{t("Ingredients")}</h3>
              <button className="btn-outline" style={{ padding: "0.2rem 0.6rem", fontSize: "0.8rem" }} onClick={addIngredientRow}>+ {t("Add Ingredient")}</button>
            </div>

            {ingredients.length === 0 && <p style={{ color: "var(--text-light)", fontSize: "0.85rem" }}>No ingredients added yet.</p>}

            {ingredients.length > 0 && (
              <table style={{ marginBottom: "0.5rem" }}>
                <thead>
                  <tr><th>{t("Ingredient")}</th><th>{t("Qty Used")}</th><th></th></tr>
                </thead>
                <tbody>
                  {ingredients.map((ig, idx) => (
                    <tr key={idx}>
                      <td>
                        <select value={ig.inventory_item_id} onChange={(e) => updateIngredient(idx, "inventory_item_id", e.target.value)} style={{ width: "100%", padding: "0.3rem" }}>
                          {inventory.map((iv) => (
                            <option key={iv.inventory_item_id} value={iv.inventory_item_id}>{iv.name} ({iv.unit})</option>
                          ))}
                        </select>
                      </td>
                      <td><input type="number" step="0.1" min="0" value={ig.quantity_used} onChange={(e) => updateIngredient(idx, "quantity_used", e.target.value)} style={{ width: 80, padding: "0.3rem" }} /></td>
                      <td><button className="btn-danger" style={{ padding: "0.2rem 0.5rem", fontSize: "0.75rem" }} onClick={() => removeIngredient(idx)}>{t("Remove")}</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.75rem" }}>
            <button className="btn-primary" onClick={save}>{t("Save")}</button>
            <button className="btn-outline" onClick={() => { setEditing(null); setIngredients([]); }}>{t("Cancel")}</button>
          </div>
        </div>
      )}

      <div className="card" style={{ overflowX: "auto" }}>
        <table>
          <thead><tr><th>ID</th><th>{t("Name")}</th><th>{t("Category")}</th><th>{t("Price")}</th><th>{t("Ingredients")}</th><th>{t("Actions")}</th></tr></thead>
          <tbody>
            {items.map((i) => (
              <tr key={i.menu_item_id}>
                <td>{i.menu_item_id}</td>
                <td>{t(i.name)}</td>
                <td>{t(i.category)}</td>
                <td>${parseFloat(i.base_price).toFixed(2)}</td>
                <td>{i.ingredient_count}</td>
                <td style={{ display: "flex", gap: "0.5rem" }}>
                  <button className="btn-outline" style={{ padding: "0.25rem 0.6rem", fontSize: "0.8rem" }} onClick={() => startEdit(i)}>{t("Edit")}</button>
                  <button className="btn-danger" style={{ padding: "0.25rem 0.6rem", fontSize: "0.8rem" }} onClick={() => del(i.menu_item_id)}>{t("Del")}</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ======================== INVENTORY TAB ======================== */
function InventoryTab() {
  const { t, translateBatch, lang } = useTranslation();
  const [items, setItems] = useState([]);
  const load = () => api.getInventory().then(setItems);
  useEffect(() => { load(); }, []);

  useEffect(() => {
    translateBatch(["Inventory", "Unit", "Stock Qty", "Actions", "Update Qty"]);
  }, [lang, translateBatch]);

  const updateQty = async (item) => {
    const qty = prompt(`New quantity for ${item.name}:`, item.stock_quantity);
    if (qty === null) return;
    await api.updateInventory(item.inventory_item_id, { stock_quantity: parseFloat(qty) });
    load();
  };

  return (
    <div>
      <h2 style={{ fontSize: "1.1rem", marginBottom: "1rem" }}>{t("Inventory")} ({items.length} items)</h2>
      <div className="card" style={{ overflowX: "auto" }}>
        <table>
          <thead><tr><th>ID</th><th>{t("Name")}</th><th>{t("Unit")}</th><th>{t("Stock Qty")}</th><th>{t("Actions")}</th></tr></thead>
          <tbody>
            {items.map((i) => (
              <tr key={i.inventory_item_id}>
                <td>{i.inventory_item_id}</td>
                <td>{i.name}</td>
                <td>{i.unit}</td>
                <td>{parseFloat(i.stock_quantity).toFixed(1)}</td>
                <td><button className="btn-outline" style={{ padding: "0.25rem 0.6rem", fontSize: "0.8rem" }} onClick={() => updateQty(i)}>{t("Update Qty")}</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ======================== EMPLOYEE TAB ======================== */
function EmployeeTab() {
  const { t, translateBatch, lang } = useTranslation();
  const [employees, setEmployees] = useState([]);
  const [form, setForm] = useState({ name: "", role: "Cashier" });
  const [adding, setAdding] = useState(false);
  const load = () => api.getEmployees().then(setEmployees);
  useEffect(() => { load(); }, []);

  useEffect(() => {
    translateBatch(["Employees", "Add Employee", "Name", "Role", "Active", "Actions", "Save", "Cancel", "Deactivate", "Activate"]);
  }, [lang, translateBatch]);

  const addEmployee = async () => {
    await api.createEmployee(form);
    setAdding(false);
    setForm({ name: "", role: "Cashier" });
    load();
  };

  const toggleActive = async (emp) => {
    await api.updateEmployee(emp.employee_id, { is_active: !emp.is_active });
    load();
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
        <h2 style={{ fontSize: "1.1rem" }}>{t("Employees")}</h2>
        <button className="btn-primary" onClick={() => setAdding(true)}>+ {t("Add Employee")}</button>
      </div>
      {adding && (
        <div className="card" style={{ marginBottom: "1rem", display: "flex", gap: "0.75rem", alignItems: "end" }}>
          <label style={s.field}>{t("Name")} <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
          <label style={s.field}>{t("Role")}
            <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
              <option>Cashier</option><option>Manager</option>
            </select>
          </label>
          <button className="btn-primary" onClick={addEmployee}>{t("Save")}</button>
          <button className="btn-outline" onClick={() => setAdding(false)}>{t("Cancel")}</button>
        </div>
      )}
      <div className="card" style={{ overflowX: "auto" }}>
        <table>
          <thead><tr><th>ID</th><th>{t("Name")}</th><th>{t("Role")}</th><th>{t("Active")}</th><th>{t("Actions")}</th></tr></thead>
          <tbody>
            {employees.map((e) => (
              <tr key={e.employee_id} style={{ opacity: e.is_active ? 1 : 0.5 }}>
                <td>{e.employee_id}</td>
                <td>{e.name}</td>
                <td>{e.role}</td>
                <td>{e.is_active ? "Yes" : "No"}</td>
                <td><button className="btn-outline" style={{ padding: "0.25rem 0.6rem", fontSize: "0.8rem" }} onClick={() => toggleActive(e)}>{e.is_active ? t("Deactivate") : t("Activate")}</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ======================== REPORTS TAB ======================== */
function ReportsTab() {
  const { t, translateBatch, lang } = useTranslation();
  const [start, setStart] = useState(() => { const d = new Date(); d.setDate(d.getDate() - 30); return d.toISOString().slice(0, 10); });
  const [end, setEnd] = useState(() => new Date().toISOString().slice(0, 10));
  const [report, setReport] = useState(null);
  const [reportType, setReportType] = useState("x-report");

  useEffect(() => {
    translateBatch(["Report", "From", "To", "Generate", "Reset Z-Report", "Hour", "Orders", "Items", "Sales", "Total", "Item", "Category", "Qty Sold", "Revenue", "Ingredient", "Unit", "Usage"]);
  }, [lang, translateBatch]);

  const run = async () => {
    try {
      let data;
      switch (reportType) {
        case "x-report": data = await api.getXReport(); break;
        case "z-report": data = await api.generateZReport(); break;
        case "sales-summary": data = await api.getSalesSummary(start, end); break;
        case "sales-by-item": data = await api.getSalesByItem(start, end); break;
        case "product-usage": data = await api.getProductUsage(start, end); break;
        default: return;
      }
      setReport({ type: reportType, data });
    } catch (err) {
      alert(err.message);
    }
  };

  const resetZ = async () => {
    if (!confirm("Reset Z-Report for today? (testing only)")) return;
    await api.resetZReport();
    alert("Z-Report reset");
  };

  return (
    <div>
      <div style={{ display: "flex", gap: "0.75rem", alignItems: "end", flexWrap: "wrap", marginBottom: "1rem" }}>
        <label style={s.field}>{t("Report")}
          <select value={reportType} onChange={(e) => setReportType(e.target.value)}>
            <option value="x-report">X-Report</option>
            <option value="z-report">Z-Report</option>
            <option value="sales-summary">Sales Summary</option>
            <option value="sales-by-item">Sales by Item</option>
            <option value="product-usage">Product Usage</option>
          </select>
        </label>
        <label style={s.field}>{t("From")} <input type="date" value={start} onChange={(e) => setStart(e.target.value)} /></label>
        <label style={s.field}>{t("To")} <input type="date" value={end} onChange={(e) => setEnd(e.target.value)} /></label>
        <button className="btn-primary" onClick={run}>{t("Generate")}</button>
        <button style={{ background: "none", border: "none", color: "var(--text-light)", fontSize: "0.8rem", textDecoration: "underline" }} onClick={resetZ}>{t("Reset Z-Report")}</button>
      </div>

      {report && (
        <div className="card" style={{ overflowX: "auto" }}>
          <ReportView report={report} />
        </div>
      )}
    </div>
  );
}

function ReportView({ report }) {
  const { t } = useTranslation();
  const { type, data } = report;

  if (type === "x-report" || type === "z-report") {
    if (data.closed) return <p style={{ padding: "1rem", color: "var(--text-light)" }}>{t("Day closed — all totals are zero.")}</p>;
    return (
      <>
        <table>
          <thead><tr><th>{t("Hour")}</th><th>{t("Orders")}</th><th>{t("Items")}</th><th>{t("Sales")}</th></tr></thead>
          <tbody>
            {data.hours.map((h) => (
              <tr key={h.hour}>
                <td>{String(h.hour).padStart(2, "0")}:00</td>
                <td>{h.order_count}</td>
                <td>{h.item_count}</td>
                <td>${parseFloat(h.total_sales).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ padding: "0.75rem", fontWeight: 700, borderTop: "2px solid var(--border)" }}>
          {t("Total")}: {data.totals.orders} {t("Orders").toLowerCase()}, {data.totals.items} {t("Items").toLowerCase()}, ${data.totals.sales.toFixed(2)}
        </div>
      </>
    );
  }

  if (type === "sales-summary") {
    return (
      <table>
        <tbody>
          <tr><td style={{ fontWeight: 600 }}>{t("Total")} {t("Orders")}</td><td>{data.order_count}</td></tr>
          <tr><td style={{ fontWeight: 600 }}>{t("Total")} {t("Revenue")}</td><td>${parseFloat(data.revenue).toFixed(2)}</td></tr>
          <tr><td style={{ fontWeight: 600 }}>Avg Order</td><td>${parseFloat(data.avg_order).toFixed(2)}</td></tr>
        </tbody>
      </table>
    );
  }

  if (type === "sales-by-item") {
    return (
      <table>
        <thead><tr><th>{t("Item")}</th><th>{t("Category")}</th><th>{t("Qty Sold")}</th><th>{t("Revenue")}</th></tr></thead>
        <tbody>
          {data.map((r) => (
            <tr key={r.menu_item_id}><td>{r.name}</td><td>{r.category}</td><td>{r.total_qty}</td><td>${parseFloat(r.total_revenue).toFixed(2)}</td></tr>
          ))}
        </tbody>
      </table>
    );
  }

  if (type === "product-usage") {
    return (
      <table>
        <thead><tr><th>{t("Ingredient")}</th><th>{t("Unit")}</th><th>{t("Usage")}</th></tr></thead>
        <tbody>
          {data.map((r, i) => (
            <tr key={i}><td>{r.ingredient}</td><td>{r.unit}</td><td>{parseFloat(r.estimated_usage).toFixed(1)}</td></tr>
          ))}
        </tbody>
      </table>
    );
  }

  return <pre>{JSON.stringify(data, null, 2)}</pre>;
}

const s = {
  page: { minHeight: "100vh", display: "flex", flexDirection: "column" },
  header: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.6rem 1.5rem", background: "var(--card)", borderBottom: "1px solid var(--border)" },
  tabBtn: { padding: "0.4rem 1rem", borderRadius: 8, background: "transparent", border: "none", fontWeight: 500, color: "var(--text-light)" },
  tabActive: { background: "var(--primary)", color: "#fff" },
  main: { flex: 1, padding: "1.5rem", maxWidth: 1200, width: "100%", margin: "0 auto" },
  field: { display: "flex", flexDirection: "column", gap: "0.25rem", fontSize: "0.85rem", fontWeight: 600, color: "var(--text-light)" },
};
