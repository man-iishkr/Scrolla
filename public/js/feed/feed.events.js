import { getArticles } from "../core/state.js";
import { loadFeed } from "./feed.service.js";
import { openSummaryForItem } from "../ai/ai.summary.js";
import { openAskAiForItem } from "../ai/ai.chat.js";
import { setCurrentTopic } from "../core/state.js";

export function initFeedEvents() {
  const feed = document.getElementById("feed");
  const categories = document.querySelector(".categories");

  /* ---------- SUMMARY & ASK AI ---------- */
  if (feed) {
    feed.addEventListener("click", (e) => {
      const summaryBtn = e.target.closest(".summary-btn");
      if (summaryBtn) {
        const idx = Number(summaryBtn.dataset.index);
        const item = getArticles()[idx];
        if (item) openSummaryForItem(item);
        return;
      }

      const askBtn = e.target.closest(".askai-btn");
      if (askBtn) {
        const idx = Number(askBtn.dataset.index);
        const item = getArticles()[idx];
        if (item) openAskAiForItem(item);
        return;
      }
const saveBtn = e.target.closest(".save-btn");
if (saveBtn) {
  e.preventDefault();
  e.stopPropagation();

  const idx = Number(saveBtn.dataset.index);

  const isSavedNow = toggleLocalSave(idx);

  saveBtn.classList.toggle("saved", isSavedNow);
  saveBtn.title = isSavedNow ? "Unsave article" : "Save article";

  return;
}


    });
  }

  /* ---------- CATEGORY FILTER ---------- */
 const catButtons = document.querySelectorAll(".cat-btn");
  if (!catButtons.length) return;

  catButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      // UI active state
      catButtons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      // ✅ STATE UPDATE (SAFE)
      const topic = btn.dataset.topic || "All";
      setCurrentTopic(topic);

      // ✅ RELOAD FEED WITH NEW TOPIC
      loadFeed(false);
    });
    
  });
}
function toggleLocalSave(key) {
  const STORAGE_KEY = "ws_saved_articles";
  const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");

  const idx = saved.indexOf(key);

  if (idx >= 0) {
    saved.splice(idx, 1);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
    return false; // now unsaved
  } else {
    saved.push(key);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
    return true; // now saved
  }
}



