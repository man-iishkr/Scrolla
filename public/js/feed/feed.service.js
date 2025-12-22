// public/js/feed/feed.service.js

import {
  getArticles,
  setArticles,
  setNoMorePages,
  currentTopic
} from "../core/state.js";

import { renderFeed } from "./feed.render.js";

export async function loadFeed() {
  try {
    
    const params = new URLSearchParams();
    const q = document.getElementById("searchInput")?.value?.trim();

    if (q) params.append("q", q);
    if (currentTopic && currentTopic !== "All") {
      params.append("category", currentTopic.toLowerCase());
    }

    

    if (currentTopic && currentTopic !== "All") {
      params.append("category", currentTopic.toLowerCase());
    }

    const res = await fetch(`/api/feed?${params.toString()}`);
    if (!res.ok) throw new Error("Feed request failed");

    const data = await res.json();
    const items = data.items || data.articles || [];

    setArticles(items);
    setNoMorePages(items.length === 0);
    renderFeed(items);

  } catch (err) {
    console.error("Feed failed:", err);
  }
}
