// public/js/feed/feed.service.js
// Debug version with extensive logging

const FeedService = {
  currentPage: 1,
  isLoadingMore: false,
  hasMore: true,
  totalLoaded: 0,

  async loadFeed(tab = 'main', category = 'all', append = false) {
    console.log(`\n=== LOADING FEED ===`);
    console.log(`Tab: ${tab}, Category: ${category}, Append: ${append}`);
    
    try {
      if (!append) {
        AppState.isLoading = true;
        showElement('loadingSpinner');
        hideElement('errorMessage');
        this.currentPage = 1;
        this.hasMore = true;
        this.totalLoaded = 0;
        console.log('Starting fresh load...');
      } else {
        if (this.isLoadingMore || !this.hasMore) {
          console.log('⚠ Cannot load more:', { isLoadingMore: this.isLoadingMore, hasMore: this.hasMore });
          return;
        }
        this.isLoadingMore = true;
        showElement('loadingSpinner');
        console.log('Loading more articles...');
      }

      console.log('Fetching from API...');
      let response;

      switch (tab) {
        case 'main':
          console.log('  → Calling API.feed.getMain()');
          response = await API.feed.getMain(category, this.currentPage);
          break;
        case 'national':
          console.log('  → Calling API.feed.getNational()');
          response = await API.feed.getNational(this.currentPage);
          break;
        case 'international':
          console.log('  → Calling API.feed.getInternational()');
          response = await API.feed.getInternational(this.currentPage);
          break;
        case 'regional':
          if (!AppState.user?.location?.state) {
            throw new Error('Please enable location to view regional news');
          }
          console.log('  → Calling API.feed.getRegional()');
          response = await API.feed.getRegional(this.currentPage);
          break;
        case 'saved':
          console.log('  → Calling API.user.getSavedArticles()');
          response = await API.user.getSavedArticles();
          AppState.savedArticles = response.savedArticles || [];
          response = { articles: AppState.savedArticles };
          this.hasMore = false;
          break;
        case 'for-you':
          if (AppState.isGuest()) {
            throw new Error('Please login to access personalized feed');
          }
          console.log('  → Calling API.feed.getForYou()');
          response = await API.feed.getForYou(this.currentPage);
          break;
        default:
          console.log('  → Default: Calling API.feed.getMain()');
          response = await API.feed.getMain(category, this.currentPage);
      }

      console.log('API Response received:', {
        articlesCount: response.articles?.length || 0,
        totalResults: response.totalResults
      });

      if (response.articles && response.articles.length > 0) {
        console.log(`✓ Got ${response.articles.length} articles from API`);
        
        if (append) {
          const existingIds = new Set(AppState.articles.map(a => a.articleId));
          const newArticles = response.articles.filter(a => !existingIds.has(a.articleId));
          
          if (newArticles.length > 0) {
            AppState.articles = [...AppState.articles, ...newArticles];
            this.totalLoaded += newArticles.length;
            console.log(`✓ Added ${newArticles.length} new articles. Total: ${this.totalLoaded}`);
          } else {
            console.log('⚠ No new unique articles found');
            this.hasMore = false;
          }
        } else {
          AppState.articles = response.articles;
          AppState.currentArticleIndex = 0;
          this.totalLoaded = response.articles.length;
          console.log(`✓ Loaded ${this.totalLoaded} articles into state`);
        }
        
        AppState.currentTab = tab;
        AppState.currentCategory = category;

        if (response.articles.length < 30) {
          this.hasMore = false;
          console.log('ℹ No more articles available (got less than 30)');
        }

        console.log('Calling renderArticles...');
        console.log('  - renderArticles type:', typeof renderArticles);
        
        if (typeof renderArticles === 'function') {
          renderArticles(append);
          console.log('✓ renderArticles called');
          
          // Verify render
          setTimeout(() => {
            const container = document.getElementById('newsCards');
            const cards = container?.querySelectorAll('.news-card');
            console.log(`✓ Cards in DOM after render: ${cards?.length || 0}`);
          }, 100);
        } else {
          console.error('❌ renderArticles is not a function!');
        }
        
        if (this.hasMore && tab !== 'saved') {
          showElement('loadMoreContainer');
        } else {
          hideElement('loadMoreContainer');
        }
      } else {
        console.warn('⚠ No articles in API response');
        if (!append) {
          showEmptyState(tab);
        }
        this.hasMore = false;
        hideElement('loadMoreContainer');
      }

    } catch (error) {
      console.error('❌ Feed Error:', error);
      console.error('Error stack:', error.stack);
      
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
      console.log('=== FEED LOAD COMPLETE ===\n');
    }
  },

  async loadMore() {
    if (this.isLoadingMore || !this.hasMore || AppState.isLoading) {
      console.log('❌ Cannot load more:', { 
        isLoadingMore: this.isLoadingMore, 
        hasMore: this.hasMore,
        isLoading: AppState.isLoading 
      });
      return;
    }
    
    console.log('📥 Loading more - Page:', this.currentPage + 1);
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
  console.log('Showing empty state for tab:', tab);
  
  const container = document.getElementById('newsCards');
  if (!container) {
    console.error('Cannot show empty state - container not found');
    return;
  }
  
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

console.log('✓ FeedService loaded');