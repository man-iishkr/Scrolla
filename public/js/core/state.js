// public/js/core/state.js

export let currentView = "trending";
export let currentTopic = "All";
export let articles = [];
export let noMorePages = false;

/* ---------- INIT ---------- */
export function initState() {
  currentView = "trending";
  currentTopic = "All";
  articles = [];
  noMorePages = false;
}

/* ---------- ARTICLES ---------- */
export function setArticles(list) {
  articles = Array.isArray(list) ? list : [];
}

export function getArticles() {
  return articles;
}

/* ---------- FLAGS ---------- */
export function setNoMorePages(val) {
  noMorePages = Boolean(val);
}
export function setCurrentTopic(topic) {
  currentTopic = topic || "All";
}
export function getCurrentTopic() {
  return currentTopic;
}