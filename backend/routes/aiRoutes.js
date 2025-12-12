// backend/routes/aiRoutes.js
const express = require("express");
const router = express.Router();
const { GoogleGenerativeAI } = require("@google/generative-ai");
const mongoose = require("mongoose");

const API_KEY = process.env.GEMINI_API_KEY;
const MODEL_NAME = process.env.GEMINI_MODEL || "models/gemini-2.5-flash";

if (!API_KEY) console.error("❌ GEMINI_API_KEY missing in .env");

// init client using API key (API-key mode)
const genAI = new GoogleGenerativeAI(API_KEY);

// helper to call v1 model.generateContent in the same shape as gemtest.js
async function callModelGenerate(prompt, maxTokens = 400) {
  try {
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });
    // Use the same "contents" shape that worked for you
    const result = await model.generateContent({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { maxOutputTokens: maxTokens, temperature: 0.2 }
    });
    // SDK exposes .response.text()
    return { text: result.response.text(), raw: result };
  } catch (err) {
    console.error("[AI] callModelGenerate error:", err);
    // surface the raw error object for debugging
    return { error: err };
  }
}

// minimal Article model fallback (no change)
let Article;
try {
  Article = require("../models/Article");
} catch (e) {
  const articleSchema = new mongoose.Schema(
    {
      url: { type: String, index: true, unique: true, sparse: true },
      title: String,
      summaryCache: {
        model: String,
        summary: String,
        createdAt: Date
      }
    },
    { timestamps: true }
  );
  Article = mongoose.models.Article || mongoose.model("Article", articleSchema);
}

// --- SUMMARY endpoint (simple, returns detailed errors) ---
router.post("/summary", async (req, res) => {
  try {
    const { title = "", url = "", content = "", maxSentences = 4 } = req.body;
    if (!title && !url && !content) return res.status(400).json({ error: "Provide title, url or content." });

    const snippet = String(content || "").slice(0, 12000);
    const prompt = `You are a concise assistant writing short factual news summaries for Indian readers.
Write EXACTLY ${maxSentences} short sentences (clear, neutral, do NOT invent facts).

Article title: ${title}
Article url: ${url}

Content snippet:
${snippet}`;

    const out = await callModelGenerate(prompt, 300);
    if (out.error) {
      // return error details for debugging
      const errObj = out.error;
      const message = errObj?.message || JSON.stringify(errObj);
      console.error("[AI] generate error (summary)", message);
      return res.status(502).json({ error: `Gemini error: ${message}`, details: errObj });
    }

    // save to DB if url present (best-effort)
    if (url) {
      const cache = { model: MODEL_NAME, summary: out.text.trim(), createdAt: new Date() };
      try {
        await Article.updateOne({ url }, { $set: { title, summaryCache: cache } }, { upsert: true });
      } catch (e) {
        console.warn("Article cache write failed:", e && e.message);
      }
    }

    return res.json({ summary: out.text.trim() });
  } catch (err) {
    console.error("Unexpected /summary error:", err);
    return res.status(500).json({ error: err && (err.message || JSON.stringify(err)) });
  }
});

// --- CHAT endpoint ---
router.post("/chat", async (req, res) => {
  try {
    const { title = "", url = "", content = "", question, history = [] } = req.body;
    if (!question) return res.status(400).json({ error: "Question required." });

    const snippet = String(content || "").slice(0, 12000);
    let prompt = `You are an expert news explainer for Indian readers. Base answers on the article; if info is missing say "the article does not mention this".

Article:
Title: ${title}
URL: ${url}
Content snippet:
${snippet}

Conversation history:
${(history || []).map(h => `${h.role.toUpperCase()}: ${h.text}`).join("\n")}

User question: ${question}

Answer concisely and factually:`;

    const out = await callModelGenerate(prompt, 600);
    if (out.error) {
      const errObj = out.error;
      const message = errObj?.message || JSON.stringify(errObj);
      console.error("[AI] generate error (chat)", message);
      return res.status(502).json({ error: `Gemini error: ${message}`, details: errObj });
    }

    return res.json({ answer: out.text.trim() });
  } catch (err) {
    console.error("Unexpected /chat error:", err);
    return res.status(500).json({ error: err && (err.message || JSON.stringify(err)) });
  }
});

module.exports = router;
