// backend/services/news/newsService.js

const axios = require("axios");

const TOP_HEADLINES = "https://newsapi.org/v2/top-headlines";
const EVERYTHING = "https://newsapi.org/v2/everything";

const apiKey = process.env.NEWS_API_KEY;

if (!apiKey) {
  throw new Error("❌ NEWS_API_KEY missing in environment");
}

async function fetchTopHeadlines(params) {
  return axios.get(TOP_HEADLINES, {
    params: { ...params, apiKey }
  });
}

async function fetchEverything(params) {
  return axios.get(EVERYTHING, {
    params: {
      ...params,
      apiKey,
      sortBy: "publishedAt",
      language: "en"
      
    }
  });
}

exports.fetchNews = async ({
  country = "in",
  category,
  q,
  page = 1,
  pageSize = 10
}) => {
  try {
    const effectiveQuery =
      category && category !== "All"
        ? `${category} india`
        : q || "india news";

    const res = await fetchEverything({
      q: effectiveQuery,
      page,
      pageSize
    });

    return {
      articles: res.data.articles || [],
      totalResults: res.data.totalResults || 0
    };

  } catch (err) {
    console.error("❌ News fetch failed:", err.response?.data || err.message);
    throw err;
  }
};
