// public/js/feed/feed.render.js

import { noMorePages } from "../core/state.js";
import { escapeHtml } from "../core/utils.js";

/* ---------- IMAGE ---------- */
function resolveImage(item) {
  return (
    item.urlToImage ||
    item.image ||
    item.imageUrl ||
    item.thumbnail ||
    null
  );
}

/* ---------- RENDER ---------- */
export function renderFeed(items) {
  const feed = document.getElementById("feed");
  if (!feed) return;

  feed.innerHTML = "";

  if (!items || !items.length) {
    feed.innerHTML = `
      <div class="feed-empty">
        <p>No stories available.</p>
      </div>
    `;
    return;
  }

  items.forEach((item, index) => {
    const img = resolveImage(item);

    const card = document.createElement("article");
    card.className = "news-card";

    card.innerHTML = `
      ${img ? `
        <div class="news-image-wrap">
          <img src="${img}" alt="${escapeHtml(item.title || "")}" />
        </div>
      ` : ""}
      <button
  class="save-btn"
  data-index="${index}"
  title="Save article"
>
<svg viewBox="0 0 24 24" class="save-icon">
    <path d="M6 2h12a1 1 0 0 1 1 1v19l-7-4-7 4V3a1 1 0 0 1 1-1z"/>
  </svg>
</button>
      

      <div class="news-content">
        <h2 class="news-title">
          <a href="${item.url}" target="_blank" rel="noopener">
            ${escapeHtml(item.title || "")}
          </a>
        </h2>

        <p class="news-body">
          ${escapeHtml(item.description || "")}
        </p>

        <div class="news-footer">
          <span class="news-source">
            ${escapeHtml(item.source?.name || "WorldStream")}
          </span>

          <div class="news-actions">
  


  <button class="action-btn summary-btn" data-index="${index}">
    Summary
  </button>

  <button class="action-btn askai-btn" data-index="${index}">
    Ask AI
  </button>
</div>

        </div>
      </div>
    `;

    feed.appendChild(card);
  });

  const end = document.createElement("div");
  end.className = "feed-footer";
  end.textContent = noMorePages ? "No more stories" : "Scroll for more";
  feed.appendChild(end);
}
