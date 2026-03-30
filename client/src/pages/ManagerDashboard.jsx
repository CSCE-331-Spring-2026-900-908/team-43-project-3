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

function EmployeeTab() {
  const [employees, setEmployees] = useState([]);
  const [form, setForm] = useState({ name: "", role: "Cashier" });
  const [adding, setAdding] = useState(false);
  const load = () => api.getEmployees().then(setEmployees);
  useEffect(() => { load(); }, []);

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
        <h2 style={{ fontSize: "1.1rem" }}>Employees</h2>
        <button className="btn-primary" onClick={() => setAdding(true)}>+ Add Employee</button>
      </div>
      {adding && (
        <div className="card" style={{ marginBottom: "1rem", display: "flex", gap: "0.75rem", alignItems: "end" }}>
          <label style={s.field}>Name <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
          <label style={s.field}>Role
            <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
              <option>Cashier</option><option>Manager</option>
            </select>
          </label>
          <button className="btn-primary" onClick={addEmployee}>Save</button>
          <button className="btn-outline" onClick={() => setAdding(false)}>Cancel</button>
        </div>
      )}
      <div className="card" style={{ overflowX: "auto" }}>
        <table>
          <thead><tr><th>ID</th><th>Name</th><th>Role</th><th>Active</th><th>Actions</th></tr></thead>
          <tbody>
            {employees.map((e) => (
              <tr key={e.employee_id} style={{ opacity: e.is_active ? 1 : 0.5 }}>
                <td>{e.employee_id}</td>
                <td>{e.name}</td>
                <td>{e.role}</td>
                <td>{e.is_active ? "Yes" : "No"}</td>
                <td><button className="btn-outline" style={{ padding: "0.25rem 0.6rem", fontSize: "0.8rem" }} onClick={() => toggleActive(e)}>{e.is_active ? "Deactivate" : "Activate"}</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ReportsTab() {
  const [start, setStart] = useState(() => { const d = new Date(); d.setDate(d.getDate() - 30); return d.toISOString().slice(0, 10); });
  const [end, setEnd] = useState(() => new Date().toISOString().slice(0, 10));
  const [report, setReport] = useState(null);
  const [reportType, setReportType] = useState("x-report");

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
        <label style={s.field}>Report
          <select value={reportType} onChange={(e) => setReportType(e.target.value)}>
            <option value="x-report">X-Report</option>
            <option value="z-report">Z-Report</option>
            <option value="sales-summary">Sales Summary</option>
            <option value="sales-by-item">Sales by Item</option>
            <option value="product-usage">Product Usage</option>
          </select>
        </label>
        <label style={s.field}>From <input type="date" value={start} onChange={(e) => setStart(e.target.value)} /></label>
        <label style={s.field}>To <input type="date" value={end} onChange={(e) => setEnd(e.target.value)} /></label>
        <button className="btn-primary" onClick={run}>Generate</button>
        <button style={{ background: "none", border: "none", color: "var(--text-light)", fontSize: "0.8rem", textDecoration: "underline" }} onClick={resetZ}>Reset Z-Report</button>
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
  const { type, data } = report;

  if (type === "x-report" || type === "z-report") {
    if (data.closed) return <p style={{ padding: "1rem", color: "var(--text-light)" }}>Day closed — all totals are zero.</p>;
    return (
      <>
        <table>
          <thead><tr><th>Hour</th><th>Orders</th><th>Items</th><th>Sales</th></tr></thead>
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
          Total: {data.totals.orders} orders, {data.totals.items} items, ${data.totals.sales.toFixed(2)}
        </div>
      </>
    );
  }

  if (type === "sales-summary") {
    return (
      <table>
        <tbody>
          <tr><td style={{ fontWeight: 600 }}>Total Orders</td><td>{data.order_count}</td></tr>
          <tr><td style={{ fontWeight: 600 }}>Total Revenue</td><td>${parseFloat(data.revenue).toFixed(2)}</td></tr>
          <tr><td style={{ fontWeight: 600 }}>Avg Order</td><td>${parseFloat(data.avg_order).toFixed(2)}</td></tr>
        </tbody>
      </table>
    );
  }

  if (type === "sales-by-item") {
    return (
      <table>
        <thead><tr><th>Item</th><th>Category</th><th>Qty Sold</th><th>Revenue</th></tr></thead>
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
        <thead><tr><th>Ingredient</th><th>Unit</th><th>Usage</th></tr></thead>
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