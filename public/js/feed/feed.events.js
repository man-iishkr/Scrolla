// public/js/feed/feed.events.js
// Feed event handlers with improved scroll detection

function setupFeedEvents() {
  // Navigation tabs
  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
      const tab = link.dataset.tab;
      switchTab(tab);
    });
  });

  // Category select
  const categorySelect = document.getElementById('categorySelect');
  if (categorySelect) {
    categorySelect.addEventListener('change', (e) => {
      handleCategoryChange(e.target.value);
    });
  }

  // Load more button
  const loadMoreBtn = document.getElementById('loadMoreBtn');
  if (loadMoreBtn) {
    loadMoreBtn.addEventListener('click', () => {
      console.log('Load More button clicked');
      FeedService.loadMore();
    });
  }

  // Infinite scroll detection - improved
  let scrollTimeout;
  let lastScrollTop = 0;
  
  window.addEventListener('scroll', () => {
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {
      handleScroll();
    }, 100);
  }, { passive: true });

  // Also add scroll listener to document
  document.addEventListener('scroll', () => {
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {
      handleScroll();
    }, 100);
  }, { passive: true });

  console.log('Feed events setup complete');
}

function handleScroll() {
  // Get scroll position
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
  const scrollHeight = document.documentElement.scrollHeight;
  const clientHeight = document.documentElement.clientHeight;
  
  // Calculate scroll percentage
  const scrollPercentage = (scrollTop / (scrollHeight - clientHeight)) * 100;
  
  // Debug logging
  if (scrollPercentage > 70) {
    console.log('Scroll %:', scrollPercentage.toFixed(1), 
                'isLoading:', FeedService.isLoadingMore, 
                'hasMore:', FeedService.hasMore);
  }

  // Load more when scrolled 75% down
  if (scrollPercentage >= 75) {
    if (!FeedService.isLoadingMore && FeedService.hasMore && !AppState.isLoading) {
      console.log('Triggering load more at', scrollPercentage.toFixed(1), '% scroll');
      FeedService.loadMore();
    }
  }
}

function switchTab(tab) {
  console.log('Switching to tab:', tab);
  
  // Update active state
  document.querySelectorAll('.nav-link').forEach(link => {
    link.classList.remove('active');
  });
  
  const activeLink = document.querySelector(`[data-tab="${tab}"]`);
  if (activeLink) {
    activeLink.classList.add('active');
  }

  // Scroll to top smoothly
  window.scrollTo({ top: 0, behavior: 'smooth' });

  // Reset category select if switching tabs
  const categorySelect = document.getElementById('categorySelect');
  if (categorySelect && tab !== 'main') {
    categorySelect.value = 'all';
  }

  // Load feed for selected tab
  FeedService.currentPage = 1;
  FeedService.hasMore = true;
  FeedService.totalLoaded = 0;
  FeedService.loadFeed(tab, 'all');
}

function handleCategoryChange(category) {
  console.log('Category changed to:', category);
  
  // Only apply category filter on main tab
  if (AppState.currentTab === 'main') {
    AppState.currentCategory = category;
    FeedService.currentPage = 1;
    FeedService.hasMore = true;
    FeedService.totalLoaded = 0;
    FeedService.loadFeed('main', category);
  }
}

// Make functions globally available
window.switchTab = switchTab;
window.handleCategoryChange = handleCategoryChange;