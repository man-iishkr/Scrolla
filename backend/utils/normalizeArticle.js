module.exports = function normalizeArticle(raw, category = "General") {
  return {
    title: raw.title || "",
    description: raw.description || "",
    content: raw.content || "",
    url: raw.url,
    image: raw.urlToImage || null,
    source: raw.source?.name || "Unknown",
    category,
    publishedAt: raw.publishedAt
  };
};
