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

// ---------- Translation (Google Translate free endpoint) ----------

function googleTranslateUrl(text, src, tgt) {
  return `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${encodeURIComponent(src)}&tl=${encodeURIComponent(tgt)}&dt=t&q=${encodeURIComponent(text)}`;
}

function extractTranslation(data) {
  if (!Array.isArray(data) || !Array.isArray(data[0])) return null;
  return data[0].filter((s) => s && s[0]).map((s) => s[0]).join("");
}

router.post("/translate", async (req, res) => {
  const { text, source, target } = req.body;
  if (!text || !target) return res.status(400).json({ error: "text and target required" });
  try {
    const resp = await fetch(googleTranslateUrl(text, source || "en", target));
    const data = await resp.json();
    const translated = extractTranslation(data);
    res.json({ translatedText: translated || text });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/translate-batch", async (req, res) => {
  const { texts, source, target } = req.body;
  if (!texts?.length || !target) return res.status(400).json({ error: "texts[] and target required" });
  try {
    const src = source || "en";
    const separator = "\n###\n";
    const combined = texts.join(separator);
    const resp = await fetch(googleTranslateUrl(combined, src, target));
    const data = await resp.json();
    const translatedCombined = extractTranslation(data) || combined;
    const parts = translatedCombined.split(/\n?###\n?/);

    const translations = texts.map((orig, i) => (parts[i] || "").trim() || orig);
    res.json({ translations });
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
