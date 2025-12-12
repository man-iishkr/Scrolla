// public/app.js
// Full restored app.js (Part 1/4)
// ------------------------------
// Auth helpers, global state, url builder, feed loader & render
// ------------------------------

/* ---------------------------
   AUTH + SMALL UTIL HELPERS
   --------------------------- */
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
function escapeHtml(str) {
  if (!str && str !== 0) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/* ---------------------------
   GLOBAL STATE
   --------------------------- */
let currentMode = "trending"; // "trending" | "foryou" | "saved"
let currentTopic = "All";
let allItems = [];
let userProfile = null; // fetched from backend when logged in

const PAGE_SIZE = 12;
let currentPage = 1;
let isLoading = false;
let noMorePages = false;

const LOCAL_KEY_TOPIC_COUNTS = "ws_topic_counts";
const LOCAL_KEY_SAVED_ITEMS = "ws_saved_items";

/* ---------------------------
   BUILD FEED URL (query params)
   --------------------------- */
function buildFeedUrl(page) {
  const params = new URLSearchParams();

  // user typed search
  const input = document.getElementById("searchInput");
  const qVal = input ? input.value.trim() : "";

  if (currentMode === "trending") {
    if (currentTopic && currentTopic !== "All") params.append("topic", currentTopic);
  } else if (currentMode === "foryou") {
    if (isLoggedIn() && userProfile) {
      const cats = userProfile.topCategories || [];
      const kws = userProfile.topKeywords || [];
      const preferred = cats[0];
      if (preferred && preferred !== "All") params.append("topic", preferred);

      // bias by top keywords if the user hasn't searched
      if (!qVal && kws && kws.length) {
        params.append("q", kws.slice(0, 5).join(" OR "));
      }
    } else {
      // fallback to local click history
      const preferred = getPreferredCategoryFromHistory();
      if (preferred && preferred !== "All") params.append("topic", preferred);
    }
  }

  // manual search always wins
  if (qVal) params.append("q", qVal);

  params.append("limit", PAGE_SIZE.toString());
  params.append("page", String(page || 1));

  return `/api/feed?${params.toString()}`;
}

/* ---------------------------
   LOAD FEED (append or replace)
   --------------------------- */
async function loadFeed(append = false) {
  // Saved handled separately
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
    let pageToLoad = append ? (currentPage + 1) : 1;

    if (!append) {
      // reset
      currentPage = 1;
      noMorePages = false;
      allItems = [];

      feedContainer.innerHTML = `
        <article class="news-card news-card-placeholder">
          <div class="news-content">
            <h2 class="news-title">Loading your personalised short news feed...</h2>
            <p class="news-body">We’re fetching trending stories based on your selected topic. This will be replaced with real cards once the data loads.</p>
            <div class="news-footer"><span class="news-meta">Frontend · Static placeholder</span></div>
          </div>
        </article>
      `;
    }

    const url = buildFeedUrl(pageToLoad);
    const resp = await fetch(url);
    if (!resp.ok) throw new Error("Server returned " + resp.status);
    const data = await resp.json();
    const items = Array.isArray(data.items) ? data.items : (data.articles || []);

    if (append) {
      if (!items.length) {
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
            <p class="news-body">Could not load stories from the server. Check backend is running and /api/feed is reachable.</p>
            <div class="news-footer"><span class="news-meta">Dev tip: open DevTools → Console & Network.</span></div>
          </div>
        </article>
      `;
    }
  } finally {
    isLoading = false;
  }
}

/* ---------------------------
   RENDER FEED (cards)
   --------------------------- */
function renderFeed(items) {
  const container = document.getElementById("feed");
  if (!container) return;

  if (!items || !items.length) {
    const modeMsg =
      currentMode === "foryou"
        ? "We couldn’t find any personalised headlines yet. Read a few stories in Trending first!"
        : currentMode === "saved"
        ? "You haven't saved any stories yet. Use the Save button on an article to add it here."
        : "We couldn’t find any headlines for this combination. Try a different topic or clear the search.";

    container.innerHTML = `
      <article class="news-card news-card-placeholder">
        <div class="news-content">
          <h2 class="news-title">No stories yet</h2>
          <p class="news-body">${modeMsg}</p>
          <div class="news-footer"><span class="news-meta">Backend · Empty collection</span></div>
        </div>
      </article>
    `;
    return;
  }

  container.innerHTML = "";

  items.forEach((item, idx) => {
    const key = getItemKey(item, idx);
    const imageHtml = item.imageUrl ? `
      <a href="${item.url || '#'}" target="_blank" rel="noopener" class="news-image-link">
        <div class="news-image-wrap"><img src="${item.imageUrl}" alt="${escapeHtml(item.title || '')}" class="news-image"></div>
      </a>` : "";

    // compute meta parts
    const ageText = (item.ageMinutes != null && !isNaN(item.ageMinutes)) ? `${item.ageMinutes} min ago` : "";
    const metaParts = [];
    if (item.category) metaParts.push(item.category);
    if (ageText) metaParts.push(ageText);
    if (item.sourceLabel) metaParts.push(item.sourceLabel);

    const savedNow = isItemSavedLocal(key);

    const card = document.createElement("article");
    card.className = "news-card";
    card.dataset.itemKey = key;
    card.dataset.category = item.category || "General";
    card.dataset.topic = item.topic || item.category || "General";

    card.innerHTML = `
      <!-- top-right save icon -->
      <button class="save-icon-button ${savedNow ? "saved" : ""}" data-item-key="${key}" aria-pressed="${savedNow ? "true" : "false"}" title="${savedNow ? "Unsave" : "Save"}">
        <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path d="M6 2h12v19l-6-3-6 3V2z" fill="${savedNow ? '#1d4ed8' : 'currentColor'}"/>
        </svg>
      </button>

      ${imageHtml}

      <div class="news-content">
        <h2 class="news-title"><a href="${item.url || '#'}" target="_blank" rel="noopener" class="news-title-link">${escapeHtml(item.title || '')}</a></h2>
        <p class="news-body">${escapeHtml(item.summary || item.excerpt || '')}</p>

        <div class="news-footer">
          <span class="news-meta">${escapeHtml(metaParts.join(" · "))}</span>

          <div style="margin-left:auto; display:flex; gap:8px; align-items:center;">
            <button class="action-btn small summary-btn" data-item-key="${key}">Summary</button>
            <button class="action-btn small askai-btn" data-item-key="${key}">Ask AI</button>
          </div>
        </div>
      </div>
    `;

    container.appendChild(card);
  });

  // bottom info card
  const info = document.createElement("article");
  info.className = "news-card news-card-placeholder";
  info.innerHTML = `
    <div class="news-content">
      <h2 class="news-title">${currentMode === "foryou" ? "For You feed" : currentMode === "saved" ? "Saved stories" : "Trending feed"}</h2>
      <p class="news-body">${currentMode==='foryou' ? "These stories are biased towards the categories you read most often on WorldStream." : currentMode==='saved' ? "These are the stories you chose to save. Great for catching up later." : "These are live trending headlines across your selected topic."}</p>
      <div class="news-footer"><span class="news-meta">WorldStream · Smart feed${noMorePages ? " · No more stories, refresh for a fresh batch." : ""}</span></div>
    </div>
  `;
  container.appendChild(info);
}
// public/app.js
// Full restored app.js (Part 2/4)
// ------------------------------
// Saved helpers, backend saved helpers, ai modals + summary fetching + chat send handler
// ------------------------------

/* ---------------------------
   SAVED ITEMS (local-first)
   --------------------------- */
function getSavedItemsRaw() {
  try {
    const raw = localStorage.getItem(LOCAL_KEY_SAVED_ITEMS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
function setSavedItemsRaw(list) {
  localStorage.setItem(LOCAL_KEY_SAVED_ITEMS, JSON.stringify(list));
}
function isItemSavedLocal(key) {
  const arr = getSavedItemsRaw();
  return arr.some(it => it.key === key);
}
function toggleSavedItemLocal(key, item) {
  const arr = getSavedItemsRaw();
  const idx = arr.findIndex(it => it.key === key);
  if (idx >= 0) {
    arr.splice(idx, 1);
    setSavedItemsRaw(arr);
    return false;
  }
  arr.push({...item, key});
  setSavedItemsRaw(arr);
  return true;
}
function renderSavedFromLocalStorage() {
  const saved = getSavedItemsRaw();
  allItems = saved.map(({ key, ...rest }) => rest);
  noMorePages = true;
  renderFeed(allItems);
}

/* ---------------------------
   BACKEND SAVED HELPERS
   --------------------------- */
async function fetchSavedFromBackend() {
  const token = getAuthToken();
  if (!token) return [];
  try {
    const res = await fetch("/api/user/saved", { headers: { Authorization: `Bearer ${token}` }});
    if (!res.ok) {
      console.error("fetchSavedFromBackend failed", await res.text());
      return [];
    }
    const data = await res.json();
    return data.savedArticles || [];
  } catch (err) {
    console.error("fetchSavedFromBackend error", err);
    return [];
  }
}

async function loadSavedUnified() {
  if (isLoggedIn()) {
    const list = await fetchSavedFromBackend();
    allItems = list.map(a => a);
    noMorePages = true;
    renderFeed(allItems);
  } else {
    renderSavedFromLocalStorage();
  }
}

/* ---------------------------
   AI - SUMMARY modal & fetch
   --------------------------- */
function openSummaryModal(text) {
  const modal = document.getElementById("ai-summary-modal");
  const content = document.getElementById("ai-summary-content");
  if (!modal || !content) return;
  content.textContent = text || "No summary available.";
  modal.classList.remove("hidden");
}
function closeSummaryModal() {
  const modal = document.getElementById("ai-summary-modal");
  if (!modal) return;
  modal.classList.add("hidden");
}

/* fetch summary from backend and return { summary } or { error } */
async function fetchSummaryForItem(item) {
  try {
    const res = await fetch("/api/ai/summary", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: item.title || "", url: item.url || "", content: item.content || "" })
    });

    let data;
    try { data = await res.json(); } catch { data = null; }

    if (!res.ok) {
      const msg = (data && (data.error || data.message)) || `Server ${res.status}`;
      return { error: msg };
    }

    // Expect backend to return { summary: "..." } ideally. Be robust.
    if (!data) return { error: "Empty summary response" };
    if (typeof data === "string") return { summary: data };
    if (data.summary && typeof data.summary === "string") return { summary: data.summary, cached: !!data.cached };
    if (data.answer && typeof data.answer === "string") return { summary: data.answer };
    // If API returned a structured object, try picking a readable field
    const possible = data.result || data.response || data.text;
    if (possible && typeof possible === "string") return { summary: possible };

    return { error: "Unexpected response shape from summary API." };
  } catch (err) {
    console.error("fetchSummaryForItem error:", err);
    return { error: err.message || "AI summarization failed." };
  }
}

/* ---------------------------
   AI Chat modal + chat send handler
   --------------------------- */
let currentAiItem = null;
let currentAiHistory = []; // array of { role, text }

function openChatModal(prefillHistory = []) {
  const modal = document.getElementById("ai-chat-modal");
  const hist = document.getElementById("ai-chat-history");
  const input = document.getElementById("ai-chat-input");
  if (!modal || !hist || !input) return;
  hist.innerHTML = "";
  (prefillHistory || []).forEach(m => {
    const el = document.createElement("div");
    el.style.marginBottom = "8px";
    el.innerHTML = `<strong>${m.role === "assistant" ? "AI" : "You"}:</strong> ${escapeHtml(m.text)}`;
    hist.appendChild(el);
  });
  input.value = "";
  modal.classList.remove("hidden");
  setTimeout(() => { hist.scrollTop = hist.scrollHeight; }, 50);
}
function closeChatModal() {
  const modal = document.getElementById("ai-chat-modal");
  if (!modal) return;
  modal.classList.add("hidden");
}
function appendChatMessageUI(role, text) {
  const historyBox = document.getElementById("ai-chat-history");
  if (!historyBox) return;
  const wrapper = document.createElement("div");
  wrapper.className = `ai-chat-row ai-${role}`;
  wrapper.style.marginBottom = "10px";
  const who = document.createElement("div");
  who.className = "ai-chat-who";
  who.textContent = role === "user" ? "You:" : "AI:";
  who.style.fontWeight = "600";
  who.style.marginBottom = "6px";
  const body = document.createElement("div");
  body.className = "ai-chat-text";
  body.textContent = text;
  wrapper.appendChild(who);
  wrapper.appendChild(body);
  historyBox.appendChild(wrapper);
  historyBox.scrollTop = historyBox.scrollHeight;
}

/* backend chat call
   expects POST /api/ai/chat { title, url, content, question, history }
   returns JSON { answer: "..." } on success
*/
async function askAiQuestion(item, question, history = []) {
  try {
    const res = await fetch("/api/ai/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: item.title || "", url: item.url || "", content: item.content || "", question, history })
    });
    const data = await res.json();
    if (!res.ok) {
      const err = data && (data.error || data.message) ? (data.error || data.message) : `Server ${res.status}`;
      return { error: err };
    }
    // Expect { answer: "..." }
    if (data.answer && typeof data.answer === "string") return { answer: data.answer };
    // fallback for different shapes
    if (data.result && typeof data.result === "string") return { answer: data.result };
    if (typeof data === "string") return { answer: data };
    return { error: "Unexpected response from AI chat API." };
  } catch (err) {
    console.error("askAiQuestion error:", err);
    return { error: err.message || "AI chat failed." };
  }
}

/* wires modal send button to askAiQuestion and update UI */
function setupAiChatSendHandler() {
  const sendBtn = document.getElementById("ai-chat-send");
  const input = document.getElementById("ai-chat-input");
  const historyBox = document.getElementById("ai-chat-history");
  if (!sendBtn || !input || !historyBox) return;

  sendBtn.addEventListener("click", async function () {
    const question = input.value && input.value.trim();
    if (!question) return;

    // show user's message in UI
    appendChatMessageUI("user", question);
    currentAiHistory.push({ role: "user", text: question });

    // show typing placeholder
    const typingRow = document.createElement("div");
    typingRow.className = "ai-chat-row ai-assistant typing";
    typingRow.style.opacity = "0.85";
    typingRow.style.fontStyle = "italic";
    typingRow.textContent = "AI is thinking...";
    historyBox.appendChild(typingRow);
    historyBox.scrollTop = historyBox.scrollHeight;

    // clear input and disable
    input.value = "";
    input.disabled = true;
    sendBtn.disabled = true;

    try {
      const result = await askAiQuestion(currentAiItem, question, currentAiHistory);
      typingRow.remove();

      if (!result) {
        appendChatMessageUI("assistant", "Error: no response from AI.");
      } else if (result.error) {
        appendChatMessageUI("assistant", `Error: ${result.error}`);
      } else {
        appendChatMessageUI("assistant", result.answer || "No answer returned.");
        currentAiHistory.push({ role: "assistant", text: result.answer || "" });
      }
    } catch (err) {
      console.error("Chat send handler error:", err);
      typingRow.remove();
      appendChatMessageUI("assistant", "Error: the AI request failed. Check console.");
    } finally {
      input.disabled = false;
      sendBtn.disabled = false;
      input.focus();
    }
  });

  // Enter sends (Shift+Enter for newline)
  input.addEventListener("keydown", function (e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendBtn.click();
    }
  });

}
// --- Wire AI modal close buttons and backdrop behavior ---
// Add this to public/app.js (after setupAiChatSendHandler or in DOMContentLoaded)
function wireAIModalClosers() {
  const summaryModal = document.getElementById("ai-summary-modal");
  const chatModal = document.getElementById("ai-chat-modal");
  const summaryClose = document.getElementById("ai-summary-close");
  const chatClose = document.getElementById("ai-chat-close");

  // Defensive: only attach if elements exist
  if (summaryClose) {
    summaryClose.addEventListener("click", function (e) {
      e.preventDefault();
      closeSummaryModal();
    });
  }

  if (chatClose) {
    chatClose.addEventListener("click", function (e) {
      e.preventDefault();
      closeChatModal();
    });
  }

  // Click on backdrop (outside the dialog) closes the modal
  [summaryModal, chatModal].forEach((modal) => {
    if (!modal) return;
    modal.addEventListener("click", (e) => {
      // Only close if the user clicked the backdrop itself (not the dialog)
      if (e.target === modal) {
        modal.classList.add("hidden");
      }
    });

    // Prevent clicks inside dialog from closing due to bubbling
    const inner = modal.querySelector(".auth-modal");
    if (inner) {
      inner.addEventListener("click", (ev) => {
        ev.stopPropagation();
      });
    }
  });

  // Escape key closes either modal if open
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" || e.key === "Esc") {
      if (summaryModal && !summaryModal.classList.contains("hidden")) closeSummaryModal();
      if (chatModal && !chatModal.classList.contains("hidden")) closeChatModal();
    }
  });
}

// Call it during init (if you already call setupAiChatSendHandler() in DOMContentLoaded,
// call this there too). Example:
document.addEventListener("DOMContentLoaded", function () {
  try {
    // existing init calls...
    setupAiChatSendHandler && setupAiChatSendHandler();
    wireAIModalClosers(); // <--- add this line (or ensure it's called)
  } catch (err) {
    console.error("Modal wiring init error:", err);
  }
});

// public/app.js
// Full restored app.js (Part 3/4)
// ------------------------------
// Click handlers (save, summary, ask ai), save backend/local toggle, click tracking, infinite scroll, topic pills, search
// ------------------------------

/* ---------------------------
   RECORD ARTICLE CLICK (For You)
   --------------------------- */
function recordArticleClick(category, topic) {
  const cat = category || "General";
  let data = {};
  try {
    const raw = localStorage.getItem(LOCAL_KEY_TOPIC_COUNTS);
    if (raw) data = JSON.parse(raw);
  } catch { data = {}; }

  if (!data[cat]) data[cat] = 0;
  data[cat] += 1;
  localStorage.setItem(LOCAL_KEY_TOPIC_COUNTS, JSON.stringify(data));
}

function getPreferredCategoryFromHistory() {
  let data = {};
  try {
    const raw = localStorage.getItem(LOCAL_KEY_TOPIC_COUNTS);
    if (raw) data = JSON.parse(raw);
  } catch { data = {}; }

  const entries = Object.entries(data);
  if (!entries.length) return "All";
  let best = entries[0][0], bestCount = entries[0][1];
  for (let i=1;i<entries.length;i++){
    const [cat, count] = entries[i];
    if (count > bestCount) { best = cat; bestCount = count; }
  }
  return best || "All";
}

/* ---------------------------
   HELP: find item by key
   --------------------------- */
function findItemByKey(key) {
  const found = allItems.find((item, i) => getItemKey(item, i) === key);
  return found || null;
}

/* ---------------------------
   CLICK TRACKING & ACTIONS
   This central handler manages:
   - save-icon-button (bookmark)
   - legacy .save-btn
   - .summary-btn
   - .askai-btn
   - anchor clicks -> record reading history
   --------------------------- */
function setupClickTracking() {
  const feedContainer = document.getElementById("feed");
  if (!feedContainer) return;

  feedContainer.addEventListener("click", async function (e) {
    // 1) Save icon (bookmark)
    const saveIcon = e.target.closest(".save-icon-button");
    if (saveIcon) {
      e.preventDefault(); e.stopPropagation();
      const key = saveIcon.getAttribute("data-item-key");
      if (!key) return;
      const item = findItemByKey(key);
      if (!item) return;

      // optimistic toggle UI
      const wasSaved = saveIcon.classList.contains("saved");
      if (wasSaved) {
        saveIcon.classList.remove("saved");
        saveIcon.setAttribute("aria-pressed","false");
        saveIcon.title = "Save";
      } else {
        saveIcon.classList.add("saved");
        saveIcon.setAttribute("aria-pressed","true");
        saveIcon.title = "Unsave";
      }

      try {
        if (isLoggedIn()) {
          const data = await toggleSavedOnBackend(item);
          if (!data) {
            // revert
            if (wasSaved) saveIcon.classList.add("saved"); else saveIcon.classList.remove("saved");
            return;
          }
          if (data.saved) {
            saveIcon.classList.add("saved");
            saveIcon.setAttribute("aria-pressed","true");
            saveIcon.title = "Unsave";
          } else {
            saveIcon.classList.remove("saved");
            saveIcon.setAttribute("aria-pressed","false");
            saveIcon.title = "Save";
          }
          if (currentMode === "saved") await loadSavedUnified();
        } else {
          // local fallback
          const nowSaved = toggleSavedItemLocal(key, item);
          if (nowSaved) {
            saveIcon.classList.add("saved");
            saveIcon.setAttribute("aria-pressed","true");
            saveIcon.title = "Unsave";
          } else {
            saveIcon.classList.remove("saved");
            saveIcon.setAttribute("aria-pressed","false");
            saveIcon.title = "Save";
          }
          if (currentMode === "saved") renderSavedFromLocalStorage();
        }
      } catch (err) {
        console.error("Save icon toggle error:", err);
        // revert optimistic UI
        if (wasSaved) {
          saveIcon.classList.add("saved"); saveIcon.setAttribute("aria-pressed","true"); saveIcon.title = "Unsave";
        } else {
          saveIcon.classList.remove("saved"); saveIcon.setAttribute("aria-pressed","false"); saveIcon.title = "Save";
        }
      }
      return;
    }

    // 2) Legacy text Save button (.save-btn)
    const legacySave = e.target.closest(".save-btn");
    if (legacySave) {
      e.preventDefault(); e.stopPropagation();
      const key = legacySave.getAttribute("data-item-key");
      if (!key) return;
      const item = findItemByKey(key);
      if (!item) return;

      try {
        if (isLoggedIn()) {
          const data = await toggleSavedOnBackend(item);
          if (!data) return;
          legacySave.textContent = data.saved ? "Saved" : "Save";
          if (currentMode === "saved") await loadSavedUnified();
        } else {
          const now = toggleSavedItemLocal(key, item);
          legacySave.textContent = now ? "Saved" : "Save";
          if (currentMode === "saved") renderSavedFromLocalStorage();
        }
      } catch (err) {
        console.error("legacySave error", err);
      }
      return;
    }

    // 3) Summary button
    const summaryBtn = e.target.closest(".summary-btn");
    if (summaryBtn) {
      e.preventDefault(); e.stopPropagation();
      const key = summaryBtn.getAttribute("data-item-key");
      if (!key) return;
      const item = findItemByKey(key);
      if (!item) return;

      // show modal with loader text
      openSummaryModal("Generating summary...");

      try {
        const result = await fetchSummaryForItem(item);
        if (result.error) {
          openSummaryModal("Error: " + result.error);
        } else {
          // show a cleaned, multi-line summary
          const summaryText = (result.summary || "").trim();
          openSummaryModal(summaryText || "No summary returned.");
        }
      } catch (err) {
        console.error("summary button error:", err);
        openSummaryModal("Error: " + (err.message || "AI summarization failed."));
      }
      return;
    }

    // 4) Ask AI button - FIXED HANDLER
    const askBtn = e.target.closest(".askai-btn");
    if (askBtn) {
      e.preventDefault(); e.stopPropagation();
      const key = askBtn.getAttribute("data-item-key");
      if (!key) {
        console.warn("AskAI clicked but no key");
        return;
      }
      const item = findItemByKey(key);
      if (!item) {
        console.warn("AskAI clicked but item not found", key);
        return;
      }

      // set global context and open chat modal
      currentAiItem = item;
      currentAiHistory = [];
      // populate chat history UI with context line
      const histEl = document.getElementById("ai-chat-history");
      if (histEl) histEl.innerHTML = "";
      appendChatMessageUI("assistant", `Context loaded: ${item.title || item.url || "Article context"}`);
      // open modal
      openChatModal([]);
      // focus input if present
      const input = document.getElementById("ai-chat-input");
      if (input) input.focus();
      return;
    }

    // 5) Normal anchor click -> record read counts for For You
    const anchor = e.target.closest("a");
    if (!anchor) return;
    const card = anchor.closest(".news-card");
    if (!card) return;
    const category = card.dataset.category;
    const topic = card.dataset.topic;
    recordArticleClick(category, topic);
    // allow navigation
  });
}

/* ---------------------------
   INFINITE SCROLL
   --------------------------- */
function setupInfiniteScroll() {
  window.addEventListener("scroll", function () {
    if (currentMode === "saved") return;
    if (isLoading || noMorePages) return;
    const nearBottom = window.innerHeight + window.scrollY >= document.body.offsetHeight - 300;
    if (nearBottom) {
      loadFeed(true);
    }
  });
}

/* ---------------------------
   SEARCH
   --------------------------- */
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
      const text = (item.title || "") + " " + (item.summary || "") + " " + (item.category || "") + " " + (item.topic || "");
      return text.toLowerCase().includes(q);
    });
    renderFeed(filtered);
  });
}

/* ---------------------------
   TOPIC PILLS
   --------------------------- */
function setupTopicFilters() {
  const pills = document.querySelectorAll(".topic-pill");
  if (!pills.length) return;
  pills.forEach(function (btn) {
    btn.addEventListener("click", function () {
      pills.forEach(b => b.classList.remove("topic-pill-active"));
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

/* ---------------------------
   NAV MODE SWITCH (Trending | For You | Saved)
   --------------------------- */
async function setupNavModeSwitch() {
  const buttons = document.querySelectorAll(".nav-links .nav-btn");
  if (!buttons.length) return;
  buttons.forEach(function (btn) {
    btn.addEventListener("click", async function () {
      const view = btn.getAttribute("data-view");
      if (!view) return;
      currentMode = view;
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
    if (v === view) btn.classList.add("nav-btn-primary");
  });
}
// public/app.js
// Full restored app.js (Part 4/4)
// ------------------------------
// Auth modal, user badge, user profile fetching, init
// ---------------------------

/* ---------------------------
   AUTH user badge & modal
   --------------------------- */
function setupAuthUserBadge() {
  const btn = document.getElementById("authUserBtn");
  if (!btn) return;
  const user = getCurrentUser();
  const token = getAuthToken();
  if (user && token) {
    const firstName = user.name ? user.name.split(" ")[0] : "User";
    btn.textContent = `Hi, ${firstName} · Logout`;
  } else {
    btn.textContent = "Sign in";
  }

  btn.addEventListener("click", () => {
    const userNow = getCurrentUser();
    const tokenNow = getAuthToken();
    if (userNow && tokenNow) {
      const confirmLogout = confirm("Logout from WorldStream?");
      if (!confirmLogout) return;
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.reload();
    } else {
      const modal = document.getElementById("auth-modal");
      if (modal) modal.classList.remove("hidden");
      else window.location.href = "login.html";
    }
  });
}

function setupAuthModal() {
  const modal = document.getElementById("auth-modal");
  if (!modal) return;
  const loginBtn = document.getElementById("authLoginBtn");
  const registerBtn = document.getElementById("authRegisterBtn");
  const skipBtn = document.getElementById("authSkipBtn");

  const token = getAuthToken();
  if (token) modal.classList.add("hidden");
  else modal.classList.remove("hidden");

  if (loginBtn) loginBtn.addEventListener("click", () => window.location.href = "login.html");
  if (registerBtn) registerBtn.addEventListener("click", () => window.location.href = "register.html");
  if (skipBtn) skipBtn.addEventListener("click", () => modal.classList.add("hidden"));
}

/* ---------------------------
   send reading events to backend to update user profile
   --------------------------- */
async function sendReadingEventToBackend(item, category, topic) {
  const token = getAuthToken();
  if (!token) return;
  try {
    await fetch("/api/user/reading", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
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

/* ---------------------------
   load user profile (used for ForYou)
   --------------------------- */
async function loadUserProfile() {
  if (!isLoggedIn()) { userProfile = null; return; }
  try {
    const res = await fetch("/api/user/profile", { headers: { Authorization: `Bearer ${getAuthToken()}` } });
    if (!res.ok) { userProfile = null; console.error("Failed to load profile", await res.text()); return; }
    userProfile = await res.json();
    // keep it in memory only
  } catch (err) {
    console.error("loadUserProfile error", err);
    userProfile = null;
  }
}

/* ---------------------------
   BACKEND save toggle wrapper (used by save icon)
   --------------------------- */
async function toggleSavedOnBackend(article) {
  const token = getAuthToken();
  if (!token) return null;
  try {
    const res = await fetch("/api/user/saved", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(article)
    });
    if (!res.ok) {
      console.error("toggleSavedOnBackend failed", await res.text());
      return null;
    }
    const data = await res.json();
    return data; // expected { saved: boolean, savedArticles: [...] }
  } catch (err) {
    console.error("toggleSavedOnBackend error", err);
    return null;
  }
}

/* ---------------------------
   Utility getItemKey used earlier
   --------------------------- */
function getItemKey(item, index) {
  if (!item) return String(index);
  if (item.url) return item.url;
  if (item.id) return item.id;
  return String(index);
}

/* ---------------------------
   Setup and INIT
   --------------------------- */
document.addEventListener("DOMContentLoaded", function () {
  const yearSpan = document.getElementById("year");
  if (yearSpan) yearSpan.textContent = new Date().getFullYear();

  // wire everything up
  setupNavModeSwitch();
  setupTopicFilters();
  setupSearch();
  setupClickTracking();
  setupInfiniteScroll();
  setupAuthModal();
  setupAuthUserBadge();
  setupAiChatSendHandler();

  // initial load
  loadFeed(false);
});

/* ---------------------------
   Exports or final notes
   --------------------------- */
// nothing to export; this file attaches global behavior to page
