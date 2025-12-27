// API configuration and methods
const API = {
  baseURL: 'http://localhost:5000/api',

  // Helper to get auth headers
  getHeaders() {
    const headers = {
      'Content-Type': 'application/json'
    };

    if (AppState.token) {
      headers['Authorization'] = `Bearer ${AppState.token}`;
    }

    return headers;
  },

  // Generic request method
  async request(endpoint, options = {}) {
    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        ...options,
        headers: this.getHeaders()
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Request failed');
      }

      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  },

  // Auth endpoints
  auth: {
    register: (userData) => 
      API.request('/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData)
      }),

    login: (credentials) => 
      API.request('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials)
      }),

    sendOTP: (email) => 
      API.request('/auth/send-otp', {
        method: 'POST',
        body: JSON.stringify({ email })
      }),

    verifyOTP: (email, otp) => 
      API.request('/auth/verify-otp', {
        method: 'POST',
        body: JSON.stringify({ email, otp })
      }),

    continueAsGuest: (language, location) => 
      API.request('/auth/guest', {
        method: 'POST',
        body: JSON.stringify({ language, location })
      }),

    checkPassword: (password) => 
      API.request('/auth/check-password', {
        method: 'POST',
        body: JSON.stringify({ password })
      })
  },

  // Feed endpoints
  feed: {
    getMain: (category = 'all', page = 1) => 
      API.request(`/feed/main?category=${category}&page=${page}`),

    getNational: (page = 1) => 
      API.request(`/feed/national?page=${page}`),

    getInternational: (page = 1) => 
      API.request(`/feed/international?page=${page}`),

    getRegional: (page = 1) => 
      API.request(`/feed/regional?page=${page}`),

    getForYou: (page = 1) => 
      API.request(`/feed/for-you?page=${page}`),

    trackClick: (category) => 
      API.request('/feed/track-click', {
        method: 'POST',
        body: JSON.stringify({ category })
      })
  },

  // AI endpoints
  ai: {
    generateSummary: (title, content) => 
      API.request('/ai/summary', {
        method: 'POST',
        body: JSON.stringify({ title, content })
      }),

    askAI: (question, articleContext) => 
      API.request('/ai/ask', {
        method: 'POST',
        body: JSON.stringify({ question, articleContext })
      }),

    chat: (messages) => 
      API.request('/ai/chat', {
        method: 'POST',
        body: JSON.stringify({ messages })
      })
  },

  // User endpoints
  user: {
    saveArticle: (article) => 
      API.request('/user/save-article', {
        method: 'POST',
        body: JSON.stringify(article)
      }),

    unsaveArticle: (articleId) => 
      API.request(`/user/unsave-article/${articleId}`, {
        method: 'DELETE'
      }),

    getSavedArticles: () => 
      API.request('/user/saved-articles'),

    updateLanguage: (language) => 
      API.request('/user/language', {
        method: 'PUT',
        body: JSON.stringify({ language })
      }),

    updateLocation: (location) => 
      API.request('/user/location', {
        method: 'PUT',
        body: JSON.stringify(location)
      })
  }
};