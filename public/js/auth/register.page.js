// public/js/auth/register.page.js
let currentStep = 1;
let userLocation = null;
let userEmail = '';
let userData = {};

document.addEventListener('DOMContentLoaded', () => {
  const registerForm = document.getElementById('registerForm');
  const passwordInput = document.getElementById('password');
  const emailInput = document.getElementById('email');
  const nextStepBtn = document.getElementById('nextStepBtn');
  const backStep1Btn = document.getElementById('backStep1Btn');
  const verifyEmailBtn = document.getElementById('verifyEmailBtn');
  const resendCodeBtn = document.getElementById('resendCodeBtn');
  const enableLocationBtn = document.getElementById('enableLocationBtn');
  const skipLocationStepBtn = document.getElementById('skipLocationStepBtn');
  const completeBtn = document.getElementById('completeBtn');

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

  // Next step button - Send verification email
  if (nextStepBtn) {
    nextStepBtn.addEventListener('click', async () => {
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

      // Store user data
      userData = { name, email, password };
      userEmail = email;

      try {
        nextStepBtn.disabled = true;
        nextStepBtn.textContent = 'Sending verification code...';

        const response = await API.auth.register({
          name,
          email,
          password,
          language: 'en',
          location: { country: 'IN', state: 'Delhi', city: 'New Delhi' }
        });

        if (response.requiresVerification) {
          document.getElementById('emailDisplay').textContent = email;
          goToStep(2);
          showSuccess('Verification code sent to your email!');
        }
      } catch (error) {
        showError(error.message || 'Failed to send verification code');
      } finally {
        nextStepBtn.disabled = false;
        nextStepBtn.textContent = 'Next';
      }
    });
  }

  // Verify email button
  if (verifyEmailBtn) {
    verifyEmailBtn.addEventListener('click', async () => {
      const code = document.getElementById('verificationCode').value.trim();

      if (!code || code.length !== 6) {
        showError('Please enter the 6-digit verification code');
        return;
      }

      try {
        verifyEmailBtn.disabled = true;
        verifyEmailBtn.textContent = 'Verifying...';

        const response = await API.auth.verifyEmail(userEmail, code);

        if (response.token) {
          // Email verified, go to location/language step
          goToStep(3);
          showSuccess('Email verified successfully!');
        }
      } catch (error) {
        showError(error.message || 'Invalid verification code');
      } finally {
        verifyEmailBtn.disabled = false;
        verifyEmailBtn.textContent = 'Verify Email';
      }
    });
  }

  // Resend code button
  if (resendCodeBtn) {
    resendCodeBtn.addEventListener('click', async () => {
      try {
        resendCodeBtn.disabled = true;
        await API.auth.resendVerification(userEmail);
        showSuccess('New verification code sent!');
        setTimeout(() => {
          resendCodeBtn.disabled = false;
        }, 30000); // Disable for 30 seconds
      } catch (error) {
        showError(error.message || 'Failed to resend code');
        resendCodeBtn.disabled = false;
      }
    });
  }

  // Back to step 1
  if (backStep1Btn) {
    backStep1Btn.addEventListener('click', () => goToStep(1));
  }

  // Enable location button
  if (enableLocationBtn) {
    enableLocationBtn.addEventListener('click', requestLocation);
  }

  // Skip location button
  if (skipLocationStepBtn) {
    skipLocationStepBtn.addEventListener('click', skipLocation);
  }

  // Complete registration
  if (registerForm) {
    registerForm.addEventListener('submit', (e) => {
      e.preventDefault();
      window.location.href = 'index.html';
    });
  }
});

function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

function goToStep(step) {
  currentStep = step;
  document.querySelectorAll('.form-step').forEach(el => el.classList.add('hidden'));
  document.getElementById(`step${step}`).classList.remove('hidden');
  window.scrollTo(0, 0);
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

    // Update user location
    if (typeof API !== 'undefined' && AppState.isAuthenticated()) {
      await API.user.updateLocation(location);
    }
  } catch (error) {
    console.error('Location error:', error);
    showError('Could not access location. Using default location (New Delhi, India).');
    skipLocation();
  }
}

async function skipLocation() { 
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

  try {
    
    if (typeof API !== 'undefined' && AppState.isAuthenticated()) {
      await API.user.updateLocation(userLocation);
    }

    
    setTimeout(() => {
      window.location.href = 'index.html';
    }, 1500);

  } catch (error) {
    console.error("Failed to save default location", error);
    
    window.location.href = 'index.html';
  }
}