/**
 * Floating chat assistant widget.
 *
 * The widget collects a short conversation with the user and forwards the
 * latest message to the external chat endpoint.
 *
 * @returns {JSX.Element}
 */
import { useState } from "react";
import { api } from "../api";

export default function ChatBot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { from: "bot", text: "Hi! I can help you pick a drink or answer questions about our menu. What are you looking for?" },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  /**
   * Send user message to chat API and append response.
   * Prevents sending while loading or with empty input.
   * @async
   * @returns {Promise<void>}
   */
  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput("");
    setMessages((m) => [...m, { from: "user", text: userMsg }]);
    setLoading(true);
    try {
      const data = await api.chat(userMsg);
      setMessages((m) => [...m, { from: "bot", text: data.reply }]);
    } catch {
      setMessages((m) => [...m, { from: "bot", text: "Sorry, something went wrong." }]);
    } finally {
      setLoading(false);
    }
  };

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} style={styles.fab} aria-label="Open chat assistant">
        💬
      </button>
    );
  }

  return (
    <div style={styles.panel}>
      <div style={styles.header}>
        <span style={{ fontWeight: 600 }}>Tea Assistant</span>
        <button onClick={() => setOpen(false)} style={styles.close}>✕</button>
      </div>
      <div style={styles.messages}>
        {messages.map((m, i) => (
          <div key={i} style={{ ...styles.msg, alignSelf: m.from === "user" ? "flex-end" : "flex-start", background: m.from === "user" ? "var(--primary)" : "#f0ebe4", color: m.from === "user" ? "#fff" : "var(--text)" }}>
            {m.text}
          </div>
        ))}
        {loading && <div style={{ ...styles.msg, alignSelf: "flex-start", background: "#f0ebe4" }}>Thinking...</div>}
      </div>
      <div style={styles.inputRow}>
        <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} placeholder="Ask about our menu..." style={styles.input} />
        <button onClick={send} className="btn-primary" style={{ padding: "0.5rem 1rem" }}>Send</button>
      </div>
    </div>
  );
}

const styles = {
  fab: { position: "fixed", bottom: 24, right: 24, width: 56, height: 56, borderRadius: "50%", background: "var(--accent)", color: "#fff", fontSize: "1.5rem", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 16px rgba(0,0,0,0.2)", border: "none", zIndex: 1000 },
  panel: { position: "fixed", bottom: 24, right: 24, width: 360, maxHeight: 500, borderRadius: "var(--radius)", background: "var(--card)", boxShadow: "0 8px 32px rgba(0,0,0,0.15)", display: "flex", flexDirection: "column", zIndex: 1000, overflow: "hidden" },
  header: { padding: "0.75rem 1rem", background: "var(--accent)", color: "#fff", display: "flex", justifyContent: "space-between", alignItems: "center" },
  close: { background: "none", border: "none", color: "#fff", fontSize: "1.1rem", cursor: "pointer" },
  messages: { flex: 1, padding: "0.75rem", display: "flex", flexDirection: "column", gap: "0.5rem", overflowY: "auto", maxHeight: 340 },
  msg: { padding: "0.5rem 0.75rem", borderRadius: 12, maxWidth: "85%", fontSize: "0.9rem", lineHeight: 1.4 },
  inputRow: { padding: "0.5rem", borderTop: "1px solid var(--border)", display: "flex", gap: "0.5rem" },
  input: { flex: 1, border: "1px solid var(--border)", borderRadius: 8, padding: "0.5rem 0.75rem", fontSize: "0.9rem" },
};