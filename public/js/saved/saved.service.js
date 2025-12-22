// public/js/saved/saved.service.js
// --------------------------------

import { LOCAL_KEY_SAVED_ITEMS } from "../core/state.js";

function getSavedItemsRaw() {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_KEY_SAVED_ITEMS)) || [];
  } catch {
    return [];
  }
}

export function loadSavedUnified() {
  return getSavedItemsRaw();
}

export function isItemSavedLocal(key) {
  return getSavedItemsRaw().some((i) => i.key === key);
}

export function toggleSavedItemLocal(key, item) {
  const items = getSavedItemsRaw();
  const idx = items.findIndex((i) => i.key === key);
  if (idx >= 0) {
    items.splice(idx, 1);
  } else {
    items.push({ ...item, key });
  }
  localStorage.setItem(LOCAL_KEY_SAVED_ITEMS, JSON.stringify(items));
}
