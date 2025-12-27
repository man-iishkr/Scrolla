// public/js/auth/register.page.js
let currentStep = 1;
let userLocation = null;

document.addEventListener('DOMContentLoaded', () => {
  const registerForm = document.getElementById('registerForm');
  const passwordInput = document.getElementById('password');
  const emailInput = document.getElementById('email');
  const nextStepBtn = document.getElementById('nextStepBtn');
  const backStepBtn = document.getElementById('backStepBtn');
  const enableLocationBtn = document.getElementById('enableLocationBtn');
  const skipLocationStepBtn = document.getElementById('skipLocationStepBtn');

  // Email validation
  if (emailInput) {
    emailInput.addEventListener('blur', () => {
      const email = emailInput.value.trim();
      if (email && !validateEmail(email)) {
        showError('Please enter a valid email address');
        emailInput.focus();
      }
    });
  }

  // Password strength checker
  if (passwordInput) {
    passwordInput.addEventListener('input', debounce(() => {
      const password = passwordInput.value;
      
      if (!password) {
        document.getElementById('strengthBar').className = 'strength-fill';
        document.getElementById('strengthText').textContent = 'Enter password';
        document.getElementById('passwordFeedback').innerHTML = '';
        return;
      }

      const result = checkPasswordStrength(password);
      
      const strengthBar = document.getElementById('strengthBar');
      strengthBar.className = `strength-fill ${result.strength.toLowerCase()}`;
      
      document.getElementById('strengthText').textContent = result.strength.charAt(0).toUpperCase() + result.strength.slice(1);
      
      const feedbackList = document.getElementById('passwordFeedback');
      feedbackList.innerHTML = result.feedback
        .map(item => `<li>${item}</li>`)
        .join('');
    }, 300));
  }

  // Next step button
  if (nextStepBtn) {
    nextStepBtn.addEventListener('click', goToStep2);
  }

  // Back step button
  if (backStepBtn) {
    backStepBtn.addEventListener('click', goToStep1);
  }

  // Enable location button
  if (enableLocationBtn) {
    enableLocationBtn.addEventListener('click', requestLocation);
  }

  // Skip location button
  if (skipLocationStepBtn) {
    skipLocationStepBtn.addEventListener('click', skipLocation);
  }

  // Form submission
  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const name = document.getElementById('name').value.trim();
      const email = document.getElementById('email').value.trim();
      const password = document.getElementById('password').value;
      const language = document.getElementById('language').value;

      // Validate name
      if (name.length < 2) {
        showError('Name must be at least 2 characters long');
        return;
      }

      // Validate email
      if (!validateEmail(email)) {
        showError('Please enter a valid email address');
        return;
      }

      // Check password strength
      const strength = checkPasswordStrength(password);
      if (strength.score < 3) {
        showError('Please use a stronger password (Good or Strong)');
        return;
      }

      try {
        const registerBtn = document.getElementById('registerBtn');
        registerBtn.disabled = true;
        registerBtn.textContent = 'Creating account...';

        // Default to India, New Delhi if no location
        const finalLocation = userLocation || {
          country: 'IN',
          state: 'Delhi',
          city: 'New Delhi',
          lat: 28.6139,
          lon: 77.2090
        };

        const response = await API.auth.register({
          name,
          email,
          password,
          language,
          location: finalLocation
        });

        AppState.setAuth(response.token, response.user);
        
        showSuccess('Registration successful! Redirecting...');
        
        setTimeout(() => {
          window.location.href = 'index.html';
        }, 1500);
        
      } catch (error) {
        showError(error.message || 'Registration failed. Please try again.');
        const registerBtn = document.getElementById('registerBtn');
        if (registerBtn) {
          registerBtn.disabled = false;
          registerBtn.textContent = 'Create Account';
        }
      }
    });
  }
});

function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

function goToStep1() {
  currentStep = 1;
  document.getElementById('step1').classList.remove('hidden');
  document.getElementById('step2').classList.add('hidden');
}

function goToStep2() {
  const name = document.getElementById('name').value.trim();
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;

  if (!name || name.length < 2) {
    showError('Please enter a valid name (at least 2 characters)');
    return;
  }

  if (!email || !validateEmail(email)) {
    showError('Please enter a valid email address');
    return;
  }

  if (!password) {
    showError('Please enter a password');
    return;
  }

  const strength = checkPasswordStrength(password);
  if (strength.score < 3) {
    showError('Please use a stronger password (Good or Strong)');
    return;
  }

  currentStep = 2;
  document.getElementById('step1').classList.add('hidden');
  document.getElementById('step2').classList.remove('hidden');
}

async function requestLocation() {
  try {
    showSuccess('Requesting location permission...');
    
    const location = await getGeolocation();
    userLocation = location;
    
    const locationInfo = document.getElementById('locationInfo');
    locationInfo.innerHTML = `
      <p><strong>✓ Location detected:</strong></p>
      <p>${location.city ? location.city + ', ' : ''}${location.state || ''} ${location.country || 'India'}</p>
    `;
    locationInfo.classList.remove('hidden');
    
    showSuccess('Location enabled successfully!');
  } catch (error) {
    console.error('Location error:', error);
    showError('Could not access location. Using default location (New Delhi, India).');
    skipLocation();
  }
}

function skipLocation() {
  // Default location: India, New Delhi
  userLocation = {
    country: 'IN',
    state: 'Delhi',
    city: 'New Delhi',
    lat: 28.6139,
    lon: 77.2090
  };
  
  const locationInfo = document.getElementById('locationInfo');
  locationInfo.innerHTML = `
    <p><strong>Default location set:</strong></p>
    <p>New Delhi, India</p>
  `;
  locationInfo.classList.remove('hidden');
  
  showSuccess('Using default location: New Delhi, India');
}