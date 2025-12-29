// public/js/feed/feed.render.js
// Render articles in grid layout

function renderArticles(append = false) {
  const container = document.getElementById('newsCards');
  
  if (!container) {
    console.error('newsCards container not found');
    return;
  }
  
  if (!append) {
    container.innerHTML = '';
  }

  if (!AppState.articles || AppState.articles.length === 0) {
    console.log('No articles to render');
    showEmptyState(AppState.currentTab);
    return;
  }

  console.log(`Rendering ${AppState.articles.length} articles (append: ${append})`);

  // Render all articles in grid
  AppState.articles.forEach((article, index) => {
    // Skip already rendered articles when appending
    if (append && container.querySelector(`[data-article-id="${article.articleId}"]`)) {
      return;
    }
    
    const card = createArticleCard(article, index);
    container.appendChild(card);
  });
  
  console.log(`✓ Rendered ${container.children.length} cards total`);
}

function createArticleCard(article, index) {
  const card = document.createElement('div');
  card.className = 'news-card';
  card.dataset.articleId = article.articleId;
  card.dataset.index = index;

  const isSaved = AppState.isArticleSaved(article.articleId);

  const imageHTML = article.urlToImage ? 
    `<img src="${article.urlToImage}" alt="${escapeHtml(article.title)}" class="news-card-image" loading="lazy"
         onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 400 300%22%3E%3Crect fill=%22%23f5f5f5%22 width=%22400%22 height=%22300%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 fill=%22%23999999%22 font-size=%2216%22 dy=%22.3em%22%3ENo Image%3C/text%3E%3C/svg%3E'">` :
    `<div class="news-card-image" style="display: flex; align-items: center; justify-content: center; background: var(--accent);">
      <span style="color: var(--text-muted); font-size: 0.9rem;">No Image Available</span>
    </div>`;

  const descriptionHTML = article.description ? 
    `<p class="news-card-description">${escapeHtml(article.description)}</p>` : '';

  card.innerHTML = `
    ${imageHTML}
    
    <div class="news-card-content">
      <div class="news-source">
        <span class="source-badge">${escapeHtml(article.source?.name || 'News')}</span>
        <span>•</span>
        <span>${formatDate(article.publishedAt)}</span>
      </div>

      <h2 class="news-card-title">${escapeHtml(article.title)}</h2>

      ${descriptionHTML}

      <div class="news-card-actions">
        <button class="action-btn ${isSaved ? 'saved' : ''}" data-action="save" data-article-id="${article.articleId}">
          ${isSaved ? getSavedIcon() : getBookmarkIcon()}
          <span>${isSaved ? 'Saved' : 'Save'}</span>
        </button>
        <button class="action-btn" data-action="summary" data-article-id="${article.articleId}">
          ${getSummaryIcon()}
          <span>Summary</span>
        </button>
        <button class="action-btn" data-action="ask-ai" data-article-id="${article.articleId}">
          ${getAIIcon()}
          <span>Ask AI</span>
        </button>
      </div>

      <button class="read-more-btn" data-action="read-more" data-url="${escapeHtml(article.url)}" data-category="${article.category || ''}">
        Read Full Article
      </button>

      <div class="news-card-meta">
        <span>${escapeHtml(article.author || 'Unknown Author')}</span>
      </div>
    </div>
  `;

  // Add event listeners to buttons
  setupCardEventListeners(card);

  return card;
}

function setupCardEventListeners(card) {
  // Save button
  const saveBtn = card.querySelector('[data-action="save"]');
  if (saveBtn) {
    saveBtn.addEventListener('click', () => {
      const articleId = saveBtn.dataset.articleId;
      if (typeof toggleSaveArticle === 'function') {
        toggleSaveArticle(articleId);
      }
    });
  }

  // Summary button
  const summaryBtn = card.querySelector('[data-action="summary"]');
  if (summaryBtn) {
    summaryBtn.addEventListener('click', () => {
      const articleId = summaryBtn.dataset.articleId;
      if (typeof showSummary === 'function') {
        showSummary(articleId);
      }
    });
  }

  // Ask AI button
  const askAiBtn = card.querySelector('[data-action="ask-ai"]');
  if (askAiBtn) {
    askAiBtn.addEventListener('click', () => {
      const articleId = askAiBtn.dataset.articleId;
      if (typeof showAskAI === 'function') {
        showAskAI(articleId);
      }
    });
  }

  // Read more button
  const readMoreBtn = card.querySelector('[data-action="read-more"]');
  if (readMoreBtn) {
    readMoreBtn.addEventListener('click', () => {
      const url = readMoreBtn.dataset.url;
      const category = readMoreBtn.dataset.category;
      openArticle(url, category);
    });
  }
}

function openArticle(url, category) {
  if (category && typeof FeedService !== 'undefined') {
    FeedService.trackArticleClick(category);
  }
  window.open(url, '_blank', 'noopener,noreferrer');
}

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// SVG Icons
function getBookmarkIcon() {
  return `
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
    </svg>
  `;
}

function getSavedIcon() {
  return `
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2">
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
    </svg>
  `;
}

function getSummaryIcon() {
  return `
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/>
    </svg>
  `;
}

function getAIIcon() {
  return `
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
    </svg>
  `;
}

// Make functions globally available
window.renderArticles = renderArticles;