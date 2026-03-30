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