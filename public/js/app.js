// public/js/app.js - Main application entry point

document.addEventListener('DOMContentLoaded', async () => {
  console.log('App initializing...');
  
  // Setup all event listeners first
  setupEventListeners();
  
  // Check if user is authenticated
  if (typeof AppState !== 'undefined' && AppState.isAuthenticated()) {
    // User is logged in, hide auth modal and initialize
    hideElement('authModal');
    hideElement('locationModal');
    await initializeApp();
  } else {
    // Show auth modal for new users
    showElement('authModal');
  }
});

function setupEventListeners() {
  // Auth modal buttons
  const loginBtn = document.getElementById('loginBtnModal');
  const registerBtn = document.getElementById('registerBtnModal');
  const guestBtn = document.getElementById('guestBtnModal');
  
  if (loginBtn) loginBtn.addEventListener('click', () => window.location.href = 'login.html');
  if (registerBtn) registerBtn.addEventListener('click', () => window.location.href = 'register.html');
  if (guestBtn) guestBtn.addEventListener('click', handleContinueAsGuest);
  
  // Location modal buttons
  const allowLocationBtn = document.getElementById('allowLocationBtn');
  const skipLocationBtn = document.getElementById('skipLocationBtn');
  
  if (allowLocationBtn) allowLocationBtn.addEventListener('click', handleRequestLocation);
  if (skipLocationBtn) skipLocationBtn.addEventListener('click', handleSkipLocation);
  
  // Sign in button
  const signInBtn = document.getElementById('signInBtn');
  if (signInBtn) signInBtn.addEventListener('click', () => window.location.href = 'login.html');
  
  // Language selector
  const languageSelect = document.getElementById('languageSelect');
  if (languageSelect) {
    // Set current language
    if (AppState.user?.language) {
      languageSelect.value = AppState.user.language;
    }
    
    languageSelect.addEventListener('change', async (e) => {
      const newLanguage = e.target.value;
      await handleLanguageChange(newLanguage);
    });
  }
  
  // Summary modal
  const closeSummaryBtn = document.getElementById('closeSummaryBtn');
  if (closeSummaryBtn) closeSummaryBtn.addEventListener('click', closeSummaryModal);
  
  // Ask AI modal
  const closeAskAiBtn = document.getElementById('closeAskAiBtn');
  const sendAiBtn = document.getElementById('sendAiBtn');
  
  if (closeAskAiBtn) closeAskAiBtn.addEventListener('click', closeAskAiModal);
  if (sendAiBtn) sendAiBtn.addEventListener('click', askAI);
  
  // AI question input - Enter key
  const aiQuestionInput = document.getElementById('aiQuestion');
  if (aiQuestionInput) {
    aiQuestionInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        askAI();
      }
    });
  }
  
  // Modal click outside to close
  document.addEventListener('click', (e) => {
    if (e.target.id === 'summaryModal') closeSummaryModal();
    if (e.target.id === 'askAiModal') closeAskAiModal();
  });
}

async function handleLanguageChange(language) {
  try {
    // Update language in backend if user is logged in
    if (AppState.isAuthenticated() && !AppState.isGuest()) {
      await API.user.updateLanguage(language);
    }
    
    // Update local state
    if (AppState.user) {
      AppState.user.language = language;
      localStorage.setItem('user', JSON.stringify(AppState.user));
    }
    
    // Reload current tab with new language
    console.log('Language changed to:', language);
    showSuccess(`Language changed to ${language === 'hi' ? 'Hindi' : 'English'}`);
    
    // Reload feed
    if (typeof FeedService !== 'undefined') {
      FeedService.currentPage = 1;
      FeedService.hasMore = true;
      await FeedService.loadFeed(AppState.currentTab, AppState.currentCategory);
    }
  } catch (error) {
    console.error('Language change error:', error);
    showError('Failed to change language');
  }
}

async function handleContinueAsGuest() {
  hideElement('authModal');
  showElement('locationModal');
}

async function handleRequestLocation() {
  try {
    const location = await getGeolocation();
    const response = await API.auth.continueAsGuest('en', location);
    AppState.setAuth(response.token, response.user);
    
    hideElement('locationModal');
    await initializeApp();
    showSuccess('Location enabled successfully');
  } catch (error) {
    console.error('Location error:', error);
    handleSkipLocation();
  }
}

async function handleSkipLocation() {
  try {
    const defaultLocation = {
      country: 'IN',
      state: 'Delhi',
      city: 'New Delhi',
      lat: 28.6139,
      lon: 77.2090
    };
    
    const response = await API.auth.continueAsGuest('en', defaultLocation);
    AppState.setAuth(response.token, response.user);
    
    hideElement('locationModal');
    await initializeApp();
  } catch (error) {
    showError('Failed to initialize');
  }
}

async function initializeApp() {
  try {
    console.log('Initializing app...');
    
    // Update auth UI
    updateAuthUI();

    // Setup feed events
    if (typeof setupFeedEvents === 'function') {
      setupFeedEvents();
    }

    // Set language selector
    const languageSelect = document.getElementById('languageSelect');
    if (languageSelect && AppState.user?.language) {
      languageSelect.value = AppState.user.language;
    }

    // Load saved articles if authenticated
    if (!AppState.isGuest() && typeof SavedService !== 'undefined') {
      try {
        await SavedService.syncSavedArticles();
      } catch (error) {
        console.error('Failed to sync saved articles:', error);
      }
    }

    // Load initial feed
    if (typeof FeedService !== 'undefined') {
      await FeedService.loadFeed('main', 'all');
    }

  } catch (error) {
    console.error('App initialization error:', error);
    showError('Failed to initialize app');
  }
}

// Make functions available globally
window.initializeApp = initializeApp;
window.handleLanguageChange = handleLanguageChange;