// public/js/feed/feed.shared.js

export function getItemKey(item, index) {
  if (!item) return String(index);
  if (item.url) return item.url;
  if (item.id) return item.id;
  return String(index);
}
