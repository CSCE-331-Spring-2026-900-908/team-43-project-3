/**
 * External service proxy routes.
 *
 * These endpoints isolate third-party integrations such as weather, text
 * translation, and the optional chat assistant behind the app's API layer.
 *
 * @type {import("express").Router}
 */
import { Router } from "express";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const router = Router();

// Weather (Open-Meteo – free, no key)
router.get("/weather", async (_req, res) => {
  try {
    const lat = process.env.WEATHER_LAT || "30.6280";
    const lon = process.env.WEATHER_LON || "-96.3344";
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weathercode,windspeed_10m&temperature_unit=fahrenheit`;
    const resp = await fetch(url);
    const data = await resp.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Translation (LibreTranslate free instance)
router.post("/translate", async (req, res) => {
  const { text, target } = req.body;
  try {
    const resp = await fetch(`${process.env.TRANSLATE_API_URL || "https://libretranslate.com"}/translate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ q: text, source: "en", target: target || "es", format: "text" }),
    });
    const data = await resp.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// AI Chatbot placeholder
router.post("/chat", async (req, res) => {
  const { message, menuContext } = req.body;
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey || apiKey === "PLACEHOLDER") {
      return res.json({
        reply: `Thanks for asking! I'm a demo assistant. You asked: "${message}". In production, I'll be connected to an AI service to help with menu recommendations and ordering.`,
      });
    }

    const resp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: `You are a helpful boba tea shop assistant. Here is the current menu: ${menuContext || "Various boba teas available."}. Help customers choose drinks, answer questions about ingredients, and suggest popular items. Keep responses concise (2-3 sentences).`,
          },
          { role: "user", content: message },
        ],
        max_tokens: 150,
      }),
    });
    const data = await resp.json();
    res.json({ reply: data.choices?.[0]?.message?.content || "Sorry, I couldn't process that." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
