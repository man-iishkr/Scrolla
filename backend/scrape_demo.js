// backend/scrape_demo.js
require("dotenv").config();
const mongoose = require("mongoose");
const Article = require("./models/article");

const MONGODB_URI = process.env.MONGODB_URI;

// Hacker News front page API (JSON, no API key required)
const HN_URL =
  "https://hn.algolia.com/api/v1/search?tags=front_page&hitsPerPage=20";

async function connectDb() {
  await mongoose.connect(MONGODB_URI);
  console.log("✅ Connected to MongoDB for scraping");
}

async function fetchHackerNews() {
  console.log("🌐 Fetching Hacker News front page...");
  const res = await fetch(HN_URL);

  if (!res.ok) {
    throw new Error(`HN request failed with status ${res.status}`);
  }

  const data = await res.json();
  return data.hits || [];
}

function buildArticleFromHit(hit) {
  const title = hit.title || hit.story_title || "Untitled";
  const url = hit.url || hit.story_url || `https://news.ycombinator.com/item?id=${hit.objectID}`;
  const summary =
    (hit.story_text && hit.story_text.slice(0, 280) + "...") ||
    "Trending Hacker News story.";

  return {
    title,
    summary,
    category: "Technology",
    topic: "Hacker News",
    sourcesCount: 1,
    sourceLabel: "Hacker News",
    imageUrl: null, // HN doesn't provide images; you can add your own logic later
    url,
    publishedAt: hit.created_at ? new Date(hit.created_at) : new Date()
  };
}

async function upsertArticlesFromHits(hits) {
  console.log(`📰 Processing ${hits.length} HN stories...`);

  let upserted = 0;
  for (const hit of hits) {
    const articleData = buildArticleFromHit(hit);

    // Use URL as a simple unique key (if url missing, fallback to HN item link)
    await Article.findOneAndUpdate(
      { url: articleData.url },
      articleData,
      { upsert: true, new: true }
    );

    upserted += 1;
  }

  console.log(`✅ Upserted ${upserted} Hacker News articles into MongoDB`);
}

async function run() {
  try {
    await connectDb();
    const hnHits = await fetchHackerNews();
    await upsertArticlesFromHits(hnHits);
  } catch (err) {
    console.error("❌ Scraper error:", err);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Disconnected from MongoDB");
    process.exit(0);
  }
}

run();
