// backend/seed.js
require("dotenv").config();
const path = require("path");
const fs = require("fs");
const mongoose = require("mongoose");
const Article = require("../models/article");

const MONGODB_URI = process.env.MONGODB_URI;

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    const filePath = path.join(__dirname, "data", "feed.json");
    const raw = fs.readFileSync(filePath, "utf-8");
    const data = JSON.parse(raw);
    const items = data.items || [];

    if (!items.length) {
      console.log("No items found in feed.json");
      process.exit(0);
    }

    // Clear old data (optional)
    await Article.deleteMany({});
    console.log("🧹 Cleared existing articles");

    const docs = items.map((item) => ({
      title: item.title,
      summary: item.summary,
      category: item.category || "General",
      topic: item.topic || data.topic || "General",
      sourcesCount: item.sourcesCount ?? 0,
      sourceLabel: item.sourceLabel || null,
      imageUrl: item.imageUrl || null,
      publishedAt: item.createdAt ? new Date(item.createdAt) : new Date()
    }));

    await Article.insertMany(docs);
    console.log(`✅ Inserted ${docs.length} articles`);

    process.exit(0);
  } catch (err) {
    console.error("❌ Seed error:", err);
    process.exit(1);
  }
}

seed();
