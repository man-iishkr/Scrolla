const crypto = require('crypto');

function normalizeArticle(article, source = 'newsapi') {
  const generateId = (url, title) => {
    return crypto
      .createHash('md5')
      .update(url || title || Date.now().toString())
      .digest('hex');
  };

  if (source === 'newsapi') {
    return {
      articleId: generateId(article.url, article.title),
      title: article.title,
      description: article.description,
      content: article.content,
      url: article.url,
      urlToImage: article.urlToImage,
      publishedAt: new Date(article.publishedAt),
      source: {
        id: article.source?.id,
        name: article.source?.name
      },
      author: article.author
    };
  }

  return article;
}

module.exports = { normalizeArticle };