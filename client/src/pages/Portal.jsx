/**
 * Shared landing page for the four app experiences.
 *
 * The portal gives staff and customers a single starting point for choosing
 * the interface that matches their task.
 *
 * @returns {JSX.Element}
 */
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { api } from "../api";
import WeatherWidget from "../components/WeatherWidget";

export default function Portal() {
  const views = [
    { to: "/customer", label: "Customer Kiosk", desc: "Self-service ordering", icon: "🧋" },
    { to: "/cashier",  label: "Cashier POS",    desc: "Point of sale terminal", icon: "💳" },
    { to: "/manager",  label: "Manager",        desc: "Dashboard & reports", icon: "📊" },
    { to: "/menuboard", label: "Menu Board",    desc: "Display menu", icon: "📺" },
  ];

  return (
    <div style={styles.page}>
      <div style={styles.hero}>
        <h1 style={styles.title}>Iroh's Tea POS</h1>
        <p style={styles.subtitle}>Team 43 — Select an interface</p>
        <WeatherWidget />
      </div>
      <div style={styles.grid}>
        {views.map((v) => (
          <Link key={v.to} to={v.to} style={styles.card}>
            <span style={styles.icon}>{v.icon}</span>
            <h2 style={styles.cardTitle}>{v.label}</h2>
            <p style={styles.cardDesc}>{v.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}

const styles = {
  page: { minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "2rem", gap: "2rem" },
  hero: { textAlign: "center" },
  title: { fontSize: "2.8rem", fontWeight: 700, color: "var(--accent)" },
  subtitle: { color: "var(--text-light)", fontSize: "1.1rem", marginTop: "0.4rem" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1.5rem", width: "100%", maxWidth: "960px" },
  card: {
    background: "var(--card)", borderRadius: "var(--radius)", boxShadow: "var(--shadow)",
    padding: "2rem 1.5rem", textAlign: "center", textDecoration: "none", color: "var(--text)",
    transition: "transform 0.15s, box-shadow 0.15s",
  },
  icon: { fontSize: "3rem", display: "block", marginBottom: "0.8rem" },
  cardTitle: { fontSize: "1.25rem", fontWeight: 600 },
  cardDesc: { color: "var(--text-light)", fontSize: "0.9rem", marginTop: "0.3rem" },
};