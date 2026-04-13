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
import pool from "../db.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../.env") });
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const router = Router();

/**
 * GET /weather - Fetch current weather for configured location.
 * @param {express.Request} _req - HTTP request (unused).
 * @param {express.Response} res - HTTP response with weather data.
 */
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

/**
 * Build a Google Translate API URL for translating text.
 * @param {string} text - Text to translate.
 * @param {string} src - Source language code (e.g., 'en').
 * @param {string} tgt - Target language code (e.g., 'es').
 * @returns {string} Google Translate API URL.
 */
function googleTranslateUrl(text, src, tgt) {
  return `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${encodeURIComponent(src)}&tl=${encodeURIComponent(tgt)}&dt=t&q=${encodeURIComponent(text)}`;
}

/**
 * Extract translated text from Google Translate API response.
 * @param {any} data - Parsed JSON response from Google Translate API.
 * @returns {string|null} Translated text or null if extraction fails.
 */
function extractTranslation(data) {
  if (!Array.isArray(data) || !Array.isArray(data[0])) return null;
  return data[0].filter((s) => s && s[0]).map((s) => s[0]).join("");
}

/**
 * POST /translate - Translate a single text string to target language.
 * @param {express.Request} req - HTTP request with { text, source?, target }.
 * @param {express.Response} res - HTTP response with { translatedText }.
 */
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

/**
 * POST /translate-batch - Translate multiple texts to target language.
 * @param {express.Request} req - HTTP request with { texts[], source?, target }.
 * @param {express.Response} res - HTTP response with { translations[] }.
 */
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

// ---------- AI Chatbot ----------

/**
 * POST /chat - AI-powered chatbot endpoint for menu inquiries.
 * Tries OpenAI, then Gemini, then falls back to rule-based demo mode.
 * @param {express.Request} req - HTTP request with { message }.
 * @param {express.Response} res - HTTP response with { reply }.
 */
router.post("/chat", async (req, res) => {
  const { message } = req.body;
  try {
    const menuRes = await pool.query("SELECT name, category, base_price FROM menu_items ORDER BY category, name");
    const menuText = menuRes.rows.map((r) => `${r.name} (${r.category}) - $${parseFloat(r.base_price).toFixed(2)}`).join("; ");
    const systemPrompt = `You are a friendly boba tea shop assistant for ShareTea. Current menu: ${menuText}. Help customers choose drinks, answer questions about ingredients, and suggest popular items. Keep responses concise (2-3 sentences).`;

    // 1) OpenAI
    const openaiKey = process.env.OPENAI_API_KEY;
    if (openaiKey && openaiKey !== "PLACEHOLDER") {
      const resp = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${openaiKey}` },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [{ role: "system", content: systemPrompt }, { role: "user", content: message }],
          max_tokens: 200,
        }),
      });
      const data = await resp.json();
      const reply = data.choices?.[0]?.message?.content;
      if (reply) return res.json({ reply });
    }

    // 2) Google Gemini (free tier – get key at https://aistudio.google.com/apikey)
    const geminiKey = process.env.GEMINI_API_KEY;
    if (geminiKey && geminiKey !== "PLACEHOLDER") {
      try {
        const resp = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${geminiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: `${systemPrompt}\n\nCustomer: ${message}` }] }],
              generationConfig: { maxOutputTokens: 200, temperature: 0.7 },
            }),
          }
        );
        if (resp.ok) {
          const data = await resp.json();
          const reply = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (reply) return res.json({ reply });
        } else {
          console.warn(`[chat] Gemini returned ${resp.status}, falling back to demo mode`);
        }
      } catch (geminiErr) {
        console.warn("[chat] Gemini error:", geminiErr.message);
      }
    }

    // 3) Smart demo mode – menu-aware rule-based responses
    const msg = message.toLowerCase();
    const items = menuRes.rows;
    let reply;

    if (msg.includes("recommend") || msg.includes("popular") || msg.includes("best") || msg.includes("suggest") || msg.includes("favorite") || msg.includes("try")) {
      const picks = items.sort(() => 0.5 - Math.random()).slice(0, 3);
      reply = `Great choices! I'd recommend ${picks.map((p) => p.name).join(", ")}. They're all customer favorites! Would you like to know more about any of them?`;
    } else if (msg.includes("cheap") || msg.includes("affordable") || msg.includes("budget") || msg.includes("least expensive")) {
      const sorted = [...items].sort((a, b) => parseFloat(a.base_price) - parseFloat(b.base_price));
      reply = `Our most affordable options are ${sorted.slice(0, 3).map((p) => `${p.name} ($${parseFloat(p.base_price).toFixed(2)})`).join(", ")}. All delicious!`;
    } else if (msg.includes("expensive") || msg.includes("premium") || msg.includes("special")) {
      const sorted = [...items].sort((a, b) => parseFloat(b.base_price) - parseFloat(a.base_price));
      reply = `Our premium drinks include ${sorted.slice(0, 3).map((p) => `${p.name} ($${parseFloat(p.base_price).toFixed(2)})`).join(", ")}. Worth every penny!`;
    } else if (msg.includes("categor") || msg.includes("types") || msg.includes("what do you") || msg.includes("what kind") || msg.includes("menu")) {
      const cats = [...new Set(items.map((i) => i.category))];
      reply = `We have ${cats.length} categories: ${cats.join(", ")}! Each has unique flavors. Which one interests you?`;
    } else if (msg.includes("milk tea")) {
      const milkTeas = items.filter((i) => i.category === "Milk Tea");
      reply = milkTeas.length ? `Our Milk Tea selection includes ${milkTeas.slice(0, 4).map((p) => p.name).join(", ")}. Classic Milk Tea is our bestseller!` : "We have a variety of milk teas available!";
    } else if (msg.includes("fruit") || msg.includes("fruity") || msg.includes("refreshing")) {
      const fruitTeas = items.filter((i) => i.category === "Fruit Tea");
      reply = fruitTeas.length ? `For something fruity and refreshing, try ${fruitTeas.slice(0, 3).map((p) => p.name).join(", ")}!` : "We have refreshing fruit teas available!";
    } else if (msg.includes("coffee") || msg.includes("caffeine")) {
      const coffees = items.filter((i) => i.category === "Coffee");
      reply = coffees.length ? `Our coffee drinks include ${coffees.map((p) => p.name).join(", ")}. Perfect for a caffeine boost!` : "We have coffee-based options as well!";
    } else if (msg.includes("ice") || msg.includes("cold") || msg.includes("frozen") || msg.includes("slush")) {
      const slushes = items.filter((i) => i.category === "Slush");
      reply = slushes.length ? `For something icy, try our slushes: ${slushes.map((p) => p.name).join(", ")}!` : "All our drinks can be made extra cold!";
    } else if (msg.includes("sugar") || msg.includes("sweet") || msg.includes("customize") || msg.includes("topping") || msg.includes("boba")) {
      reply = "You can customize any drink! We offer different sugar levels (0%, 25%, 50%, 75%, 100%), ice levels, and various toppings like boba pearls, jelly, and pudding.";
    } else if (msg.includes("how many") || msg.includes("count")) {
      reply = `We currently have ${items.length} drinks on our menu across ${[...new Set(items.map((i) => i.category))].length} categories. Something for everyone!`;
    } else if (msg.includes("price") || msg.includes("cost") || msg.includes("how much")) {
      const match = items.find((i) => msg.includes(i.name.toLowerCase()));
      if (match) {
        reply = `${match.name} is $${parseFloat(match.base_price).toFixed(2)}. Prices may vary with customizations like size upgrades or extra toppings.`;
      } else {
        const prices = items.map((i) => parseFloat(i.base_price));
        reply = `Our drinks range from $${Math.min(...prices).toFixed(2)} to $${Math.max(...prices).toFixed(2)}. What drink are you curious about?`;
      }
    } else if (msg.includes("hello") || msg.includes("hi") || msg.includes("hey") || msg.includes("help")) {
      reply = `Hi there! Welcome to ShareTea! 🧋 We have ${items.length} delicious drinks. I can help you find the perfect one — just ask me to recommend something, or tell me what flavors you like!`;
    } else {
      const match = items.find((i) => msg.includes(i.name.toLowerCase()));
      if (match) {
        reply = `${match.name} is one of our ${match.category} drinks, priced at $${parseFloat(match.base_price).toFixed(2)}. You can customize the sugar level, ice, and add toppings like boba pearls!`;
      } else {
        reply = `I'd love to help! We have ${items.length} drinks across categories like ${[...new Set(items.map((i) => i.category))].slice(0, 3).join(", ")}. Try asking me to recommend a drink, or tell me what flavors you're in the mood for!`;
      }
    }

    res.json({ reply });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
