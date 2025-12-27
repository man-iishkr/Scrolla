const SavedService = {
  async loadSavedArticles() {
    if (AppState.isGuest()) {
      showError('Please login to view saved articles');
      return;
    }

    try {
      const response = await API.user.getSavedArticles();
      AppState.savedArticles = response.savedArticles || [];
      return AppState.savedArticles;
    } catch (error) {
      console.error('Load saved articles error:', error);
      throw error;
    }
  },

  async syncSavedArticles() {
    if (!AppState.isGuest() && AppState.isAuthenticated()) {
      try {
        await this.loadSavedArticles();
      } catch (error) {
        console.error('Sync error:', error);
      }
    }
  }
};