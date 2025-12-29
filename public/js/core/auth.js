// public/js/core/auth.js
// Authentication UI functions

function redirectToLogin() {
  window.location.href = 'login.html';
}

function redirectToRegister() {
  window.location.href = 'register.html';
}

async function continueAsGuest() {
  try {
    hideElement('authModal');
    showElement('locationModal');
  } catch (error) {
    showError('Failed to continue as guest');
  }
}

async function requestLocation() {
  try {
    const location = await getGeolocation();
    
    const response = await API.auth.continueAsGuest('en', location);
    AppState.setAuth(response.token, response.user);
    
    hideElement('locationModal');
    
    // Initialize the app
    if (typeof initializeApp === 'function') {
      initializeApp();
    }
    
    showSuccess('Location enabled successfully');
  } catch (error) {
    console.error('Location error:', error);
    // Continue without location - default to India, New Delhi
    skipLocation();
  }
}

async function skipLocation() {
  try {
    // Default location: India, New Delhi
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
    
    // Initialize the app
    if (typeof initializeApp === 'function') {
      initializeApp();
    }
  } catch (error) {
    showError('Failed to initialize');
  }
}

function updateAuthUI() {
  const authButton = document.getElementById('authButton');
  
  if (!authButton) return;

  if (AppState.isAuthenticated() && !AppState.isGuest()) {
    const firstName = AppState.user.name.split(' ')[0];
    authButton.innerHTML = `
      <div class="user-info">
        <span>Hi, ${firstName}</span>
        <button class="btn btn-ghost" id="logoutBtn">Logout</button>
      </div>
    `;
    
    // Add logout event listener
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', logout);
    }
  } else {
    authButton.innerHTML = `
      <button class="btn btn-primary" id="signInBtn">Sign In</button>
    `;
    
    // Re-add sign in event listener
    const signInBtn = document.getElementById('signInBtn');
    if (signInBtn) {
      signInBtn.addEventListener('click', () => window.location.href = 'login.html');
    }
  }
}

function logout() {
  if (confirm('Are you sure you want to logout?')) {
    AppState.clearAuth();
    window.location.href = 'index.html';
  }
}

// Make functions globally available
window.redirectToLogin = redirectToLogin;
window.redirectToRegister = redirectToRegister;
window.continueAsGuest = continueAsGuest;
window.requestLocation = requestLocation;
window.skipLocation = skipLocation;
window.updateAuthUI = updateAuthUI;
window.logout = logout;