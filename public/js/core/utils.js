// Utility functions

// Format date to readable format
function formatDate(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
  });
}

// Show error message
function showError(message, elementId = 'errorMessage') {
  const errorEl = document.getElementById(elementId);
  if (errorEl) {
    errorEl.textContent = message;
    errorEl.classList.remove('hidden');
    setTimeout(() => errorEl.classList.add('hidden'), 5000);
  }
}

// Show success message
function showSuccess(message, elementId = 'successMessage') {
  const successEl = document.getElementById(elementId);
  if (successEl) {
    successEl.textContent = message;
    successEl.classList.remove('hidden');
    setTimeout(() => successEl.classList.add('hidden'), 5000);
  }
}

// Hide element
function hideElement(elementId) {
  const el = document.getElementById(elementId);
  if (el) el.classList.add('hidden');
}

// Show element
function showElement(elementId) {
  const el = document.getElementById(elementId);
  if (el) el.classList.remove('hidden');
}

// Generate unique ID
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Truncate text
function truncateText(text, maxLength) {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substr(0, maxLength) + '...';
}

// Get geolocation
function getGeolocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation not supported'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        try {
          // Use reverse geocoding API to get location details
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );
          const data = await response.json();
          
          resolve({
            lat: latitude,
            lon: longitude,
            city: data.address?.city || data.address?.town || data.address?.village,
            state: data.address?.state,
            country: data.address?.country_code?.toUpperCase() || 'IN'
          });
        } catch (error) {
          resolve({
            lat: latitude,
            lon: longitude,
            country: 'IN'
          });
        }
      },
      (error) => reject(error)
    );
  });
}

// Debounce function
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Check password strength
function checkPasswordStrength(password) {
  let strength = 0;
  const feedback = [];

  if (password.length >= 8) strength++;
  else feedback.push('At least 8 characters');

  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
  else feedback.push('Upper and lowercase letters');

  if (/\d/.test(password)) strength++;
  else feedback.push('At least one number');

  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength++;
  else feedback.push('At least one special character');

  const levels = ['weak', 'fair', 'good', 'strong'];
  
  return {
    strength: levels[strength] || 'weak',
    score: strength,
    feedback
  };
}