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