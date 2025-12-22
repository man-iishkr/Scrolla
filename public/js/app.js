// public/js/app.js

import { setArticles } from "./core/state.js";
import { renderFeed } from "./feed/feed.render.js";
import { initFeedEvents } from "./feed/feed.events.js";
import { loadFeed } from "./feed/feed.service.js";
import { initAuthUI } from "./auth/auth.ui.js";

document.addEventListener("DOMContentLoaded", async () => {
  initFeedEvents();
  initAuthUI();

  const res = await fetch("/api/feed");
  const data = await res.json();

  let items = [];

/* Handle all backend response shapes safely */
if (Array.isArray(data.articles)) {
  items = data.articles;
} else if (Array.isArray(data.items)) {
  items = data.items;
} else if (Array.isArray(data?.articles?.articles)) {
  items = data.articles.articles;
}

setArticles(items);
renderFeed(items);
await loadFeed();

});


document.getElementById("searchInput")?.addEventListener("keydown", (e) => {
  if (e.key === "Enter") loadFeed();
});
