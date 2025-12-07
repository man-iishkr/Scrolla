// backend/server.js
const mongoose = require("mongoose");
const authRoutes = require("./routes/Authroutes");
const userRoutes = require("./routes/userRoutes");



require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();

const PORT = process.env.PORT || 5050;
const NEWSAPI_KEY = process.env.NEWSAPI_KEY;
const NEWSAPI_LANGUAGE = process.env.NEWSAPI_LANGUAGE || "en";

if (!NEWSAPI_KEY) {
  console.warn("⚠️ NEWSAPI_KEY is not set in .env – /api/feed will fail.");
}

app.use(cors());
app.use(express.json());
// ✅ CONNECT TO MONGODB
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ Mongo Error:", err));


// Serve frontend from ../public
const publicPath = path.join(__dirname, "..", "public");
app.use(express.static(publicPath));
// ✅ AUTH ROUTES
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);



/**
 * Map UI topic to:
 * - query string
 * - Indian news domains
 */
function mapTopicToEverythingParams(topic) {
  const baseDomains = [
    "ndtv.com",
    "indiatoday.in",
    "indianexpress.com",
    "hindustantimes.com",
    "thehindu.com",
    "livemint.com",
    "moneycontrol.com",
    "economictimes.indiatimes.com",
    "businesstoday.in",
    "cricbuzz.com",
    "espncricinfo.com"
  ];

  const t = (topic || "All").toLowerCase();

  // Defaults: generic India headlines across major Indian domains
  let q = "India";
  let domains = baseDomains;

  switch (t) {
    case "technology":
      q = "technology OR gadgets OR AI OR app OR software";
      break;
    case "startups":
      q = "startup OR funding OR unicorn OR venture capital";
      break;
    case "sports":
      q = "cricket OR IPL OR football OR badminton OR hockey";
      break;
    case "markets":
      q = "stock market OR sensex OR nifty OR sebi OR rbi OR shares";
      break;
    case "science":
      q = "science OR research OR space OR ISRO";
      break;
    case "entertainment":
      q = "bollywood OR film OR movie OR web series OR actor OR actress";
      break;
    case "all":
    default:
      q = "India OR government OR economy OR business OR cricket";
      break;
  }

  return {
    q,
    domains: domains.join(",")
  };
}

/**
 * Call NewsAPI /v2/everything with our tuned params.
 */
async function callNewsApiEverything({ q, domains, pageSize,page }) {
  if (!NEWSAPI_KEY) throw new Error("Missing NEWSAPI_KEY");

  const url = new URL("https://newsapi.org/v2/everything");
  url.searchParams.set("language", NEWSAPI_LANGUAGE);
  url.searchParams.set("sortBy", "publishedAt");
  url.searchParams.set("pageSize", String(pageSize || 20));
  url.searchParams.set("page", String(page || 1)); 
  if (q && q.trim()) url.searchParams.set("q", q.trim());
  if (domains && domains.trim()) url.searchParams.set("domains", domains.trim());

  const res = await fetch(url.toString(), {
    headers: { "X-Api-Key": NEWSAPI_KEY }
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `NewsAPI /everything error ${res.status} ${res.statusText}: ${text.slice(
        0,
        200
      )}`
    );
  }

  const data = await res.json();
  return data.articles || [];
}

/**
 * GET /api/feed
 *  - topic (All, Technology, Sports, etc.)
 *  - q (user search)
 *  - limit
 */
app.get("/api/feed", async (req, res) => {
  try {
    const topic = req.query.topic || "All";
    const userSearch = (req.query.q || "").trim();
    const limit = Number(req.query.limit) || 20;
    const page = Number(req.query.page) || 1;

    const { q: baseQ, domains } = mapTopicToEverythingParams(topic);

    // combine base topic query + user search
    const mergedQ = [baseQ, userSearch].filter(Boolean).join(" AND ");

    let articles = await callNewsApiEverything({
      q: mergedQ,
      domains,
      pageSize: limit,
      page
    });

    // Fallback: if still empty, try without domains
    if (!articles.length) {
      console.warn("⚠️ No results with domains filter, retrying without domains...");
      articles = await callNewsApiEverything({
        q: mergedQ,
        domains: "",
        pageSize: limit,
        page
      });
    }

    const now = Date.now();

    const items = articles.map((a, idx) => {
      const published =
        (a.publishedAt && new Date(a.publishedAt)) || new Date(now);
      const ageMinutes = Math.round((now - published.getTime()) / 60000);

      return {
        id: `${published.getTime()}-${idx}`,
        title: a.title || "Untitled",
        summary: a.description || a.content || "Top headline.",
        category: topic === "All"
          ? (a.source && a.source.name) || "General"
          : topic,
        topic: topic === "All" ? null : topic,
        ageMinutes,
        sourcesCount: null,
        sourceLabel: (a.source && a.source.name) || "News source",
        imageUrl: a.urlToImage || null,
        url: a.url || null,
        createdAt: published
      };
    });

    res.json({
      topic,
      count: items.length,
      items
    });
  } catch (err) {
    console.error("Error in /api/feed:", err);
    res.status(500).json({
      error: "Failed to fetch news from NewsAPI /everything",
      details: err.message
    });
  }
});

/**
 * Health check
 */
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", uptime: process.uptime() });
});

// SPA fallback
app.get("*", (req, res) => {
  res.sendFile(path.join(publicPath, "index.html"));
});

app.listen(PORT, () => {
  console.log(`🚀 WorldStream backend running on http://localhost:${PORT}`);
});
