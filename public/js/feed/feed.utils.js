// public/js/feed/feed.utils.js
// ----------------------------
// Local behaviour helpers (no DOM)

import { LOCAL_KEY_TOPIC_COUNTS } from "../core/state.js";

export function getPreferredCategoryFromHistory() {
  let data = {};

  try {
    const raw = localStorage.getItem(LOCAL_KEY_TOPIC_COUNTS);
    if (raw) data = JSON.parse(raw);
  } catch {
    return "All";
  }

  const entries = Object.entries(data);
  if (!entries.length) return "All";

  return entries.reduce((best, cur) =>
    cur[1] > best[1] ? cur : best
  )[0];
}
