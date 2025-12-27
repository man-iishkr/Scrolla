// public/js/feed/feed.shared.js
// Shared feed utilities

async function toggleSaveArticle(articleId) {
  if (AppState.isGuest()) {
    showError('Please login to save articles');
    setTimeout(() => {
      window.location.href = 'login.html';
    }, 2000);
    return;
  }

  const article = AppState.articles.find(a => a.articleId === articleId);
  if (!article) return;

  try {
    const isSaved = AppState.isArticleSaved(articleId);

    if (isSaved) {
      await API.user.unsaveArticle(articleId);
      AppState.removeSavedArticle(articleId);
      showSuccess('Article removed from saved');
    } else {
      await API.user.saveArticle(article);
      AppState.addSavedArticle(article);
      showSuccess('Article saved successfully');
    }

    // Update button UI - find all instances (could be multiple cards)
    document.querySelectorAll(`[data-article-id="${articleId}"][data-action="save"]`).forEach(button => {
      const newIsSaved = AppState.isArticleSaved(articleId);
      button.className = `action-btn ${newIsSaved ? 'saved' : ''}`;
      button.innerHTML = `
        ${newIsSaved ? getSavedIcon() : getBookmarkIcon()}
        <span>${newIsSaved ? 'Saved' : 'Save'}</span>
      `;
    });

    // If we're on saved tab and unsaving, refresh after delay
    if (AppState.currentTab === 'saved' && isSaved) {
      setTimeout(() => {
        FeedService.loadFeed('saved');
      }, 500);
    }

  } catch (error) {
    showError(error.message || 'Failed to save article');
  }
}

// Make globally available
window.toggleSaveArticle = toggleSaveArticle;