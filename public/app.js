// public/app.js

// Global state
let currentTopic = "All";
let allItems = [];

/**
 * Build API URL based on current topic.
 * The backend is running on the same origin (e.g. http://localhost:5050),
 * so we can use a relative URL.
 */
function buildFeedUrl() {
  const params = new URLSearchParams();
  if (currentTopic && currentTopic !== "All") {
    params.append("topic", currentTopic);
  }
  const qVal = document.getElementById("searchInput")?.value?.trim();
  if (qVal) params.append("q", qVal);
  const qs = params.toString();
  return qs ? `/api/feed?${qs}` : "/api/feed";
}


/**
 * Load feed from backend and render
 */
async function loadFeed() {
  const feedContainer = document.getElementById("feed");
  if (!feedContainer) return;

  try {
    // Show loading state
    feedContainer.innerHTML = `
      <article class="news-card news-card-placeholder">
        <div class="news-content">
          <h2 class="news-title">Loading feed...</h2>
          <p class="news-body">Fetching latest short updates for you.</p>
        </div>
      </article>
    `;

    const response = await fetch(buildFeedUrl());
    if (!response.ok) {
      throw new Error("Request failed with status " + response.status);
    }

    const data = await response.json();
    const items = data.items || [];
    allItems = items;

    renderFeed(allItems);
  } catch (err) {
    console.error("loadFeed error:", err);

    feedContainer.innerHTML = `
      <article class="news-card news-card-placeholder">
        <div class="news-content">
          <h2 class="news-title">Error loading feed</h2>
          <p class="news-body">
            Could not load stories from the server.
            Check that the backend is running and /api/feed is reachable.
          </p>
          <div class="news-footer">
            <span class="news-meta">Dev tip: open DevTools → Console & Network.</span>
          </div>
        </div>
      </article>
    `;
  }
}

/**
 * Render items into the feed container.
 */
function renderFeed(items) {
  const container = document.getElementById("feed");
  if (!container) return;

  if (!items.length) {
  container.innerHTML = `
    <article class="news-card news-card-placeholder">
      <div class="news-content">
        <h2 class="news-title">No stories found</h2>
        <p class="news-body">
          We couldn’t find any headlines for this topic right now.
          Try switching to another tab or clearing your search.
        </p>
        <div class="news-footer">
          <span class="news-meta">Backend · Live NewsAPI feed</span>
        </div>
      </div>
    </article>
  `;
  return;
}


  container.innerHTML = "";

  items.forEach(function (item) {
    const card = document.createElement("article");
    card.className = "news-card";

    const link = item.url || "#";

    var imageSection = "";
    if (item.imageUrl) {
      imageSection = `
        <a href="${link}" target="_blank" rel="noopener" class="news-image-link">
          <div class="news-image-wrap">
            <img
              src="${item.imageUrl}"
              alt="${escapeHtml(item.title)}"
              class="news-image"
            />
          </div>
        </a>
      `;
    }

    const category = item.category || "General";
    const ageText =
      item.ageMinutes != null ? item.ageMinutes + " min ago" : "";
    const sourcesText =
      item.sourcesCount != null ? item.sourcesCount + " sources" : "";

    const metaParts = [category];
    if (ageText) metaParts.push(ageText);
    if (sourcesText) metaParts.push(sourcesText);

    card.innerHTML = `
      ${imageSection}
      <div class="news-content">
        <h2 class="news-title">
          <a href="${link}" target="_blank" rel="noopener" class="news-title-link">
            ${escapeHtml(item.title)}
          </a>
        </h2>
        <p class="news-body">${escapeHtml(item.summary)}</p>
        <div class="news-footer">
          <span class="news-meta">
            ${escapeHtml(metaParts.join(" · "))}
          </span>
          <span class="news-readmore">
            <a href="${link}" target="_blank" rel="noopener" class="news-readmore-link">
              read more at <strong>${escapeHtml(item.sourceLabel || "Source")}</strong>
            </a>
          </span>
        </div>
      </div>
    `;

    container.appendChild(card);
  });

  // optional info card
  const info = document.createElement("article");
  info.className = "news-card news-card-placeholder";
  info.innerHTML = `
    <div class="news-content">
      <h2 class="news-title">Hooked up to your API 🚀</h2>
      <p class="news-body">
        These cards come from your Express + MongoDB backend. 
        Add more scrapers to fill other categories like Sports/Markets.
      </p>
      <div class="news-footer">
        <span class="news-meta">WorldStream · Developer info</span>
      </div>
    </div>
  `;
  container.appendChild(info);
}

/**
 * Client-side search over the loaded items.
 */
function setupSearch() {
  const input = document.getElementById("searchInput");
  if (!input) return;

  input.addEventListener("input", function (e) {
    const q = e.target.value.toLowerCase().trim();

    if (!q) {
      renderFeed(allItems);
      return;
    }

    const filtered = allItems.filter(function (item) {
      const text =
        (item.title || "") +
        " " +
        (item.summary || "") +
        " " +
        (item.category || "") +
        " " +
        (item.topic || "");
      return text.toLowerCase().includes(q);
    });

    renderFeed(filtered);
  });
}

/**
 * Topic pill click handlers.
 */
function setupTopicFilters() {
  const pills = document.querySelectorAll(".topic-pill");
  if (!pills.length) return;

  pills.forEach(function (btn) {
    btn.addEventListener("click", function () {
      pills.forEach(function (b) {
        b.classList.remove("topic-pill-active");
      });

      btn.classList.add("topic-pill-active");
      currentTopic = btn.textContent.trim();
      loadFeed();
    });
  });
}

/**
 * Minimal HTML escape helper.
 */
function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// Init when DOM is ready
document.addEventListener("DOMContentLoaded", function () {
  const yearSpan = document.getElementById("year");
  if (yearSpan) yearSpan.textContent = new Date().getFullYear();

  setupTopicFilters();
  setupSearch();
  loadFeed();
});
