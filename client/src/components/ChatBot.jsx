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