// public/js/feed/feed.service.js
// Feed service with working infinite scroll

const FeedService = {
  currentPage: 1,
  isLoadingMore: false,
  hasMore: true,
  totalLoaded: 0,

  async loadFeed(tab = 'main', category = 'all', append = false) {
    try {
      if (!append) {
        AppState.isLoading = true;
        showElement('loadingSpinner');
        hideElement('errorMessage');
        this.currentPage = 1;
        this.hasMore = true;
        this.totalLoaded = 0;
      } else {
        if (this.isLoadingMore || !this.hasMore) {
          console.log('Already loading or no more articles');
          return;
        }
        this.isLoadingMore = true;
        showElement('loadingSpinner');
      }

      let response;

      switch (tab) {
        case 'main':
          // Home tab shows ALL news
          response = await API.feed.getMain(category, this.currentPage);
          break;
        case 'national':
          response = await API.feed.getNational(this.currentPage);
          break;
        case 'international':
          response = await API.feed.getInternational(this.currentPage);
          break;
        case 'regional':
          if (!AppState.user?.location?.state) {
            throw new Error('Please enable location to view regional news');
          }
          response = await API.feed.getRegional(this.currentPage);
          break;
        case 'saved':
          response = await API.user.getSavedArticles();
          AppState.savedArticles = response.savedArticles || [];
          response = { articles: AppState.savedArticles };
          this.hasMore = false;
          break;
        case 'for-you':
          if (AppState.isGuest()) {
            throw new Error('Please login to access personalized feed');
          }
          response = await API.feed.getForYou(this.currentPage);
          break;
        default:
          response = await API.feed.getMain(category, this.currentPage);
      }

      if (response.articles && response.articles.length > 0) {
        if (append) {
          // Filter out duplicates before appending
          const existingIds = new Set(AppState.articles.map(a => a.articleId));
          const newArticles = response.articles.filter(a => !existingIds.has(a.articleId));
          
          if (newArticles.length > 0) {
            AppState.articles = [...AppState.articles, ...newArticles];
            this.totalLoaded += newArticles.length;
            console.log(`Loaded ${newArticles.length} new articles. Total: ${this.totalLoaded}`);
          } else {
            console.log('No new unique articles found');
            this.hasMore = false;
          }
        } else {
          // Replace articles
          AppState.articles = response.articles;
          AppState.currentArticleIndex = 0;
          this.totalLoaded = response.articles.length;
          console.log(`Initial load: ${this.totalLoaded} articles`);
        }
        
        AppState.currentTab = tab;
        AppState.currentCategory = category;

        // Check if there are more articles to load
        // If we got fewer than requested (usually 20), there are no more
        if (response.articles.length < 20) {
          this.hasMore = false;
          console.log('No more articles available');
        }

        renderArticles(append);
        
        // Show/hide load more button
        if (this.hasMore && tab !== 'saved') {
          showElement('loadMoreContainer');
        } else {
          hideElement('loadMoreContainer');
        }
      } else {
        if (!append) {
          showEmptyState(tab);
        }
        this.hasMore = false;
        hideElement('loadMoreContainer');
        console.log('No articles returned from API');
      }

    } catch (error) {
      console.error('Feed Error:', error);
      const errorEl = document.getElementById('errorMessage');
      if (errorEl) {
        errorEl.textContent = error.message;
        errorEl.classList.remove('hidden');
      }
      this.hasMore = false;
      hideElement('loadMoreContainer');
    } finally {
      AppState.isLoading = false;
      this.isLoadingMore = false;
      hideElement('loadingSpinner');
    }
  },

  async loadMore() {
    if (this.isLoadingMore || !this.hasMore || AppState.isLoading) {
      console.log('Cannot load more:', { 
        isLoadingMore: this.isLoadingMore, 
        hasMore: this.hasMore,
        isLoading: AppState.isLoading 
      });
      return;
    }
    
    console.log('Loading more articles... Page:', this.currentPage + 1);
    this.currentPage++;
    await this.loadFeed(AppState.currentTab, AppState.currentCategory, true);
  },

  async trackArticleClick(category) {
    if (!AppState.isGuest() && category) {
      try {
        await API.feed.trackClick(category);
      } catch (error) {
        console.error('Track click error:', error);
      }
    }
  }
};

function showEmptyState(tab) {
  const container = document.getElementById('newsCards');
  const messages = {
    main: 'No news articles available at the moment',
    saved: 'No saved articles yet. Start saving articles you want to read later!',
    'for-you': 'No personalized articles yet. Read some articles to build your feed!'
  };

  container.innerHTML = `
    <div class="empty-state">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
      </svg>
      <h3>No Articles Found</h3>
      <p>${messages[tab] || messages.main}</p>
      ${tab === 'saved' || tab === 'for-you' ? `
        <button class="btn btn-primary" onclick="switchTab('main')">Browse News</button>
      ` : ''}
    </div>
  `;
}