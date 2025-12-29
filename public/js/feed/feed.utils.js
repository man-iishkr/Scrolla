// Feed utility functions

function getArticleContext(article) {
  return `
    Title: ${article.title}
    Description: ${article.description || 'No description'}
    Content: ${article.content || article.description || 'No content available'}
    Source: ${article.source?.name || 'Unknown'}
    Published: ${formatDate(article.publishedAt)}
  `.trim();
}

function findArticleById(articleId) {
  return AppState.articles.find(a => a.articleId === articleId);
}

function preloadNextArticle() {
  const nextIndex = AppState.currentArticleIndex + 1;
  if (nextIndex < AppState.articles.length) {
    const nextArticle = AppState.articles[nextIndex];
    if (nextArticle.urlToImage) {
      const img = new Image();
      img.src = nextArticle.urlToImage;
    }
  }
}