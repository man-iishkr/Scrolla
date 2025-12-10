// public/app.js
function getAuthToken() {
  return localStorage.getItem("token");
}

function isLoggedIn() {
  return !!getAuthToken();
}
function getCurrentUser() {
  try {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}



// ---------- GLOBAL STATE ----------
let currentMode = "trending"; // "trending" | "foryou" | "saved"
let currentTopic = "All";
let allItems = [];
let userProfile = null; // AI interest profile from backend


const PAGE_SIZE = 12; // how many per page from backend

let currentPage = 1;
let isLoading = false;
let noMorePages = false;

// localStorage keys
const LOCAL_KEY_TOPIC_COUNTS = "ws_topic_counts";
const LOCAL_KEY_SAVED_ITEMS = "ws_saved_items";

// ---------- API URL BUILDER ----------
function buildFeedUrl(page) {
  const params = new URLSearchParams();

    // search text (user-typed)
  const input = document.getElementById("searchInput");
  const qVal = input ? input.value.trim() : "";

  if (currentMode === "trending") {
    if (currentTopic && currentTopic !== "All") {
      params.append("topic", currentTopic);
    }
  } else if (currentMode === "foryou") {
    if (isLoggedIn() && userProfile) {
      // Use AI-style profile from backend
      const cats = userProfile.topCategories || [];
      const kws = userProfile.topKeywords || [];

      const preferred = cats[0];
      if (preferred && preferred !== "All") {
        params.append("topic", preferred);
      }

      // If user hasn't manually searched, bias by top keywords
      if (!qVal && kws.length) {
        params.append("q", kws.slice(0, 5).join(" OR "));
      }
    } else {
      // Guest: fallback to local click history
      const preferred = getPreferredCategoryFromHistory();
      if (preferred && preferred !== "All") {
        params.append("topic", preferred);
      }
    }
  }

  // Apply manual search last so it always wins
  if (qVal) params.append("q", qVal);


  params.append("limit", PAGE_SIZE.toString());
  params.append("page", String(page || 1));

  return `/api/feed?${params.toString()}`;
}

// ---------- FETCH + RENDER ----------
async function loadFeed(append = false) {
  // Saved mode never calls backend
  if (currentMode === "saved") {
    renderSavedFromLocalStorage();
    return;
  }

  const feedContainer = document.getElementById("feed");
  if (!feedContainer) return;
  if (isLoading) return;
  if (append && noMorePages) return;

  isLoading = true;

  try {
    let pageToLoad = 1;
    if (append) {
      pageToLoad = currentPage + 1;
    } else {
      // reset when not appending
      currentPage = 1;
      noMorePages = false;
      allItems = [];
      feedContainer.innerHTML = `
        <article class="news-card news-card-placeholder">
          <div class="news-content">
            <h2 class="news-title">Loading feed...</h2>
            <p class="news-body">
              Fetching latest short updates for you.
            </p>
          </div>
        </article>
      `;
    }

    const url = buildFeedUrl(pageToLoad);
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error("Request failed with status " + response.status);
    }

    const data = await response.json();
    const items = data.items || [];

    if (append) {
      if (!items.length) {
        // no more pages
        noMorePages = true;
      } else {
        currentPage = pageToLoad;
        allItems = allItems.concat(items);
      }
    } else {
      allItems = items;
    }

    renderFeed(allItems);
  } catch (err) {
    console.error("loadFeed error:", err);
    const feedContainer = document.getElementById("feed");
    if (feedContainer) {
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
  } finally {
    isLoading = false;
  }
}

function renderFeed(items) {
  const container = document.getElementById("feed");
  if (!container) return;

  if (!items.length) {
    const modeMsg =
      currentMode === "foryou"
        ? "We couldn’t find any personalised headlines yet. Read a few stories in Trending first!"
        : currentMode === "saved"
        ? "You haven’t saved any stories yet. Use the Save button on an article to add it here."
        : "We couldn’t find any headlines for this combination. Try a different topic or clear the search.";

    container.innerHTML = `
      <article class="news-card news-card-placeholder">
        <div class="news-content">
          <h2 class="news-title">No stories found</h2>
          <p class="news-body">
            ${modeMsg}
          </p>
          <div class="news-footer">
            <span class="news-meta">Backend · Live news API</span>
          </div>
        </div>
      </article>
    `;
    return;
  }

  container.innerHTML = "";

  items.forEach(function (item, index) {
    const card = document.createElement("article");
    card.className = "news-card";

    const key = getItemKey(item, index);
    const link = item.url || "#";
    const category = item.category || "General";
    const topic = item.topic || category;

    card.dataset.category = category;
    card.dataset.topic = topic;
    card.dataset.itemKey = key;

    let imageSection = "";
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

    const ageText =
      item.ageMinutes != null ? item.ageMinutes + " min ago" : "";
    const metaParts = [];
    if (category) metaParts.push(category);
    if (ageText) metaParts.push(ageText);
    if (item.sourceLabel) metaParts.push(item.sourceLabel);

    const savedNow = isItemSavedLocal(key);

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
          <button class="save-btn" data-item-key="${key}">
            ${savedNow ? "Saved" : "Save"}
          </button>
        </div>
      </div>
    `;

    container.appendChild(card);
  });

  // Info card at bottom + optional "no more" message
  const info = document.createElement("article");
  info.className = "news-card news-card-placeholder";
  info.innerHTML = `
    <div class="news-content">
      <h2 class="news-title">
        ${
          currentMode === "foryou"
            ? "For You feed"
            : currentMode === "saved"
            ? "Saved stories"
            : "Trending feed"
        }
      </h2>
      <p class="news-body">
        ${
          currentMode === "foryou"
            ? "These stories are biased towards the categories you read most often on WorldStream."
            : currentMode === "saved"
            ? "These are the stories you chose to save. Great for catching up later."
            : "These are live trending headlines across your selected topic."
        }
      </p>
      <div class="news-footer">
        <span class="news-meta">
          WorldStream · Smart feed${
            noMorePages && currentMode !== "saved"
              ? " · No more stories, pull to refresh for a fresh batch."
              : ""
          }
        </span>
      </div>
    </div>
  `;
  container.appendChild(info);
}

// ---------- SAVED ITEMS HELPERS ----------
function getItemKey(item, index) {
  if (item.url) return item.url;
  if (item.id) return item.id;
  return String(index);
}

function getSavedItemsRaw() {
  try {
    const raw = localStorage.getItem(LOCAL_KEY_SAVED_ITEMS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
    return [];
  } catch {
    return [];
  }
}

function setSavedItemsRaw(list) {
  localStorage.setItem(LOCAL_KEY_SAVED_ITEMS, JSON.stringify(list));
}

function isItemSaved(key) {
  const saved = getSavedItemsRaw();
  return saved.some((it) => it.key === key);
}

function toggleSavedItem(key, item) {
  const saved = getSavedItemsRaw();
  const idx = saved.findIndex((it) => it.key === key);
  if (idx >= 0) {
    saved.splice(idx, 1);
    setSavedItemsRaw(saved);
    return false; // now unsaved
  }
  const toStore = { ...item, key };
  saved.push(toStore);
  setSavedItemsRaw(saved);
  return true; // now saved
}

/* ✅ NEW: wrappers so code using isItemSavedLocal/toggleSavedItemLocal works */
function isItemSavedLocal(key) {
  return isItemSaved(key);
}

function toggleSavedItemLocal(key, item) {
  return toggleSavedItem(key, item);
}

function renderSavedFromLocalStorage() {
  const saved = getSavedItemsRaw();
  allItems = saved.map(({ key, ...rest }) => rest);
  noMorePages = true; // no infinite scroll for saved
  renderFeed(allItems);
}

async function loadSavedUnified() {
  if (isLoggedIn()) {
    const saved = await fetchSavedFromBackend();
    allItems = saved.map((a) => a); // already article objects
    noMorePages = true;
    renderFeed(allItems);
  } else {
    renderSavedFromLocalStorage();
  }
}

// ---------- BACKEND SAVED HELPERS ----------
async function fetchSavedFromBackend() {
  const token = getAuthToken();
  if (!token) return [];

  const res = await fetch("/api/user/saved", {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!res.ok) {
    console.error("Failed to fetch saved from backend", await res.text());
    return [];
  }

  const data = await res.json();
  return data.savedArticles || [];
}

async function toggleSavedOnBackend(article) {
  const token = getAuthToken();
  if (!token) return null;

  const res = await fetch("/api/user/saved", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(article)
  });

  if (!res.ok) {
    console.error("Failed to toggle saved on backend", await res.text());
    return null;
  }

  const data = await res.json();
  return data; // { saved: boolean, savedArticles: [...] }
}
async function sendReadingEventToBackend(item, category, topic) {
  const token = getAuthToken();
  if (!token) return;

  try {
    await fetch("/api/user/reading", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        url: item.url,
        title: item.title,
        category: category || item.category,
        topic: topic || item.topic,
        sourceLabel: item.sourceLabel
      })
    });
  } catch (err) {
    console.error("Failed to send reading event", err);
  }
}
async function loadUserProfile() {
  if (!isLoggedIn()) {
    userProfile = null;
    return;
  }

  try {
    const res = await fetch("/api/user/profile", {
      headers: {
        Authorization: `Bearer ${getAuthToken()}`
      }
    });

    if (!res.ok) {
      console.error("Failed to load user profile", await res.text());
      userProfile = null;
      return;
    }

    userProfile = await res.json();
    // console.log("User profile:", userProfile);
  } catch (err) {
    console.error("Error loading user profile", err);
    userProfile = null;
  }
}




// ---------- SEARCH ----------
function setupSearch() {
  const input = document.getElementById("searchInput");
  if (!input) return;

  input.addEventListener("keydown", function (e) {
    if (e.key === "Enter") {
      currentPage = 1;
      noMorePages = false;
      loadFeed(false);
    }
  });

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

// ---------- TOPIC PILLS ----------
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
      currentMode = "trending";
      setNavModeButtonActive("trending");

      currentPage = 1;
      noMorePages = false;
      loadFeed(false);
    });
  });
}

// ---------- NAV (Trending / For You / Saved) ----------
async function setupNavModeSwitch() {
  const buttons = document.querySelectorAll(".nav-links .nav-btn");
  if (!buttons.length) return;

    buttons.forEach(function (btn) {
    btn.addEventListener("click", async function () {
      const view = btn.getAttribute("data-view");
      if (!view) return;

      currentMode = view; // "trending" | "foryou" | "saved"
      setNavModeButtonActive(view);

      currentPage = 1;
      noMorePages = false;

      if (currentMode === "saved") {
        loadSavedUnified();
        return;
      }

      if (currentMode === "foryou" && isLoggedIn()) {
        await loadUserProfile();
      }

      loadFeed(false);
    });
  });

  
}

function setNavModeButtonActive(view) {
  const buttons = document.querySelectorAll(".nav-links .nav-btn");
  buttons.forEach(function (btn) {
    btn.classList.remove("nav-btn-primary");
    const v = btn.getAttribute("data-view");
    if (v === view) {
      btn.classList.add("nav-btn-primary");
    }
  });
}

// ---------- CLICK TRACKING (For You) + SAVE BUTTONS ----------
function recordArticleClick(category, topic) {
  const cat = category || "General";
  const top = topic || cat;

  let data = {};
  try {
    const raw = localStorage.getItem(LOCAL_KEY_TOPIC_COUNTS);
    if (raw) data = JSON.parse(raw);
  } catch {
    data = {};
  }

  if (!data[cat]) data[cat] = 0;
  data[cat] += 1;

  localStorage.setItem(LOCAL_KEY_TOPIC_COUNTS, JSON.stringify(data));
}

function getPreferredCategoryFromHistory() {
  let data = {};
  try {
    const raw = localStorage.getItem(LOCAL_KEY_TOPIC_COUNTS);
    if (raw) data = JSON.parse(raw);
  } catch {
    data = {};
  }

  const entries = Object.entries(data);
  if (!entries.length) return "All";

  let best = entries[0][0];
  let bestCount = entries[0][1];

  for (let i = 1; i < entries.length; i++) {
    const [cat, count] = entries[i];
    if (count > bestCount) {
      best = cat;
      bestCount = count;
    }
  }

  return best || "All";
}

function setupClickTracking() {
  const feedContainer = document.getElementById("feed");
  if (!feedContainer) return;

  feedContainer.addEventListener("click", function (e) {
    // Handle Save button
    const saveBtn = e.target.closest(".save-btn");
    if (saveBtn) {
      e.preventDefault();
      e.stopPropagation();

      const key = saveBtn.getAttribute("data-item-key");
      if (!key) return;

      const item = findItemByKey(key);
      if (!item) return;

      if (isLoggedIn()) {
        // backend toggle
        toggleSavedOnBackend(item)
          .then((data) => {
            if (!data) return;
            const nowSaved = data.saved;
            saveBtn.textContent = nowSaved ? "Saved" : "Save";

            if (currentMode === "saved") {
              loadSavedUnified();
            }
          })
          .catch((err) => {
            console.error("Error toggling saved on backend", err);
          });
      } else {
        // local fallback
        const nowSaved = toggleSavedItemLocal(key, item);
        saveBtn.textContent = nowSaved ? "Saved" : "Save";

        if (currentMode === "saved") {
          renderSavedFromLocalStorage();
        }
      }

      return;
    }

    // Handle article clicks (for For You)
    const anchor = e.target.closest("a");
    if (!anchor) return;

    const card = anchor.closest(".news-card");
    if (!card) return;

    const category = card.dataset.category;
    const topic = card.dataset.topic;
    recordArticleClick(category, topic);
    if (isLoggedIn()) {
      const key = card.dataset.itemKey;
      const item = findItemByKey(key);
      if (item) {
        sendReadingEventToBackend(item, category, topic);
      }
    }
  });
}

function findItemByKey(key) {
  const found = allItems.find((item, index) => getItemKey(item, index) === key);
  return found || null;
}

// ---------- INFINITE SCROLL ----------
function setupInfiniteScroll() {
  window.addEventListener("scroll", function () {
    if (currentMode === "saved") return;
    if (isLoading || noMorePages) return;

    const nearBottom =
      window.innerHeight + window.scrollY >=
      document.body.offsetHeight - 300;

    if (nearBottom) {
      loadFeed(true); // append mode
    }
  });
}
function setupAuthUserBadge() {
  const btn = document.getElementById("authUserBtn");
  if (!btn) return;

  const user = getCurrentUser();
  const token = getAuthToken();

  if (user && token) {
    // Logged in state
    const firstName = user.name ? user.name.split(" ")[0] : "User";
    btn.textContent = `Hi, ${firstName} · Logout`;
  } else {
    // Guest state
    btn.textContent = "Sign in";
  }

  btn.addEventListener("click", () => {
    const userNow = getCurrentUser();
    const tokenNow = getAuthToken();

    if (userNow && tokenNow) {
      // Logout flow
      const confirmLogout = confirm("Logout from WorldStream?");
      if (!confirmLogout) return;

      localStorage.removeItem("token");
      localStorage.removeItem("user");
      // (optional) also clear local saved data if you want
      // localStorage.removeItem("ws_saved_items");
      // localStorage.removeItem("ws_topic_counts");

      window.location.reload();
    } else {
      // Not logged in -> show popup again or go to login
      const modal = document.getElementById("auth-modal");
      if (modal) {
        modal.classList.remove("hidden");
      } else {
        // fallback, in case modal isn't present
        window.location.href = "login.html";
      }
    }
  });
}

// ---------- AUTH MODAL ----------
function setupAuthModal() {
  const modal = document.getElementById("auth-modal");
  if (!modal) return;

  const loginBtn = document.getElementById("authLoginBtn");
  const registerBtn = document.getElementById("authRegisterBtn");
  const skipBtn = document.getElementById("authSkipBtn");

  const token = localStorage.getItem("token");
  if (token) {
    modal.classList.add("hidden");
  } else {
    modal.classList.remove("hidden");
  }

  if (loginBtn) {
    loginBtn.addEventListener("click", function () {
      window.location.href = "login.html";
    });
  }

  if (registerBtn) {
    registerBtn.addEventListener("click", function () {
      window.location.href = "register.html";
    });
  }

  if (skipBtn) {
    skipBtn.addEventListener("click", function () {
      modal.classList.add("hidden");
    });
  }
}
function setupAuthUserBadge() {
  const btn = document.getElementById("authUserBtn");
  if (!btn) return;

  const user = getCurrentUser();
  const token = getAuthToken();

  if (user && token) {
    // Logged-in state
    const firstName = user.name ? user.name.split(" ")[0] : "User";
    btn.textContent = `Hi, ${firstName} · Logout`;
  } else {
    // Guest state
    btn.textContent = "Sign in";
  }

  btn.addEventListener("click", () => {
    const userNow = getCurrentUser();
    const tokenNow = getAuthToken();

    if (userNow && tokenNow) {
      // Logout flow
      const confirmLogout = confirm("Logout from WorldStream?");
      if (!confirmLogout) return;

      localStorage.removeItem("token");
      localStorage.removeItem("user");
      // (optional) also clear local saved / history if you want
      // localStorage.removeItem("ws_saved_items");
      // localStorage.removeItem("ws_topic_counts");

      window.location.reload();
    } else {
      // Not logged in → show the auth popup again
      const modal = document.getElementById("auth-modal");
      if (modal) {
        modal.classList.remove("hidden");
      } else {
        // fallback if modal missing
        window.location.href = "login.html";
      }
    }
  });
}


// ---------- UTIL ----------
function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// ---------- INIT ----------
document.addEventListener("DOMContentLoaded", function () {
  const yearSpan = document.getElementById("year");
  if (yearSpan) yearSpan.textContent = new Date().getFullYear();

  setupNavModeSwitch();
  setupTopicFilters();
  setupSearch();
  setupClickTracking();
  setupInfiniteScroll();
  setupAuthModal();
  setupAuthUserBadge();
  setupAuthUserBadge();
  loadFeed(false);
});
