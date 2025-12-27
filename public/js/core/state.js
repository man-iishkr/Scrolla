const AppState = {
  user: null,
  token: null,
  articles: [],
  currentArticleIndex: 0,
  currentTab: 'main',
  currentCategory: 'all',
  savedArticles: [],
  isLoading: false,
  currentArticle: null,

  // Initialize state from localStorage
  init() {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    if (token && user) {
      this.token = token;
      this.user = JSON.parse(user);
    }
  },

  // Set user and token
  setAuth(token, user) {
    this.token = token;
    this.user = user;
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
  },

  // Clear auth
  clearAuth() {
    this.token = null;
    this.user = null;
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  // Check if user is authenticated
  isAuthenticated() {
    return !!this.token && !!this.user;
  },

  // Check if user is guest
  isGuest() {
    return this.user?.isGuest || false;
  },

  // Get current article
  getCurrentArticle() {
    return this.articles[this.currentArticleIndex];
  },

  // Move to next article
  nextArticle() {
    if (this.currentArticleIndex < this.articles.length - 1) {
      this.currentArticleIndex++;
      return this.getCurrentArticle();
    }
    return null;
  },

  // Check if article is saved
  isArticleSaved(articleId) {
    return this.savedArticles.some(article => article.articleId === articleId);
  },

  // Add saved article
  addSavedArticle(article) {
    if (!this.isArticleSaved(article.articleId)) {
      this.savedArticles.push(article);
    }
  },

  // Remove saved article
  removeSavedArticle(articleId) {
    this.savedArticles = this.savedArticles.filter(
      article => article.articleId !== articleId
    );
  }
};

// Initialize state on load
AppState.init();