// public/js/auth/login.page.js
document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('loginForm');
  const useOTPCheckbox = document.getElementById('useOTP');
  const otpSection = document.getElementById('otpSection');
  const loginBtn = document.getElementById('loginBtn');
  const resendOTPBtn = document.getElementById('resendOTP');
  let otpSent = false;

  // OTP checkbox handler
  if (useOTPCheckbox) {
    useOTPCheckbox.addEventListener('change', async (e) => {
      if (e.target.checked) {
        const email = document.getElementById('email').value;
        if (!email) {
          showError('Please enter your email first');
          e.target.checked = false;
          return;
        }

        try {
          loginBtn.disabled = true;
          loginBtn.textContent = 'Sending OTP...';
          
          await API.auth.sendOTP(email);
          
          otpSection.classList.remove('hidden');
          showSuccess('OTP sent to your email');
          otpSent = true;
          loginBtn.textContent = 'Verify OTP';
        } catch (error) {
          showError(error.message);
          e.target.checked = false;
        } finally {
          loginBtn.disabled = false;
        }
      } else {
        otpSection.classList.add('hidden');
        otpSent = false;
        loginBtn.textContent = 'Login';
      }
    });
  }

  // Resend OTP button
  if (resendOTPBtn) {
    resendOTPBtn.addEventListener('click', async () => {
      const email = document.getElementById('email').value;
      try {
        await API.auth.sendOTP(email);
        showSuccess('OTP resent successfully');
      } catch (error) {
        showError(error.message);
      }
    });
  }

  // Form submission
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      const otp = document.getElementById('otp')?.value;

      try {
        loginBtn.disabled = true;
        loginBtn.textContent = 'Logging in...';

        let response;
        
        if (otpSent && otp) {
          response = await API.auth.verifyOTP(email, otp);
        } else {
          response = await API.auth.login({ email, password });
        }

        AppState.setAuth(response.token, response.user);
        
        showSuccess('Login successful! Redirecting...');
        
        setTimeout(() => {
          window.location.href = 'index.html';
        }, 1000);
        
      } catch (error) {
        showError(error.message);
        loginBtn.disabled = false;
        loginBtn.textContent = otpSent ? 'Verify OTP' : 'Login';
      }
    });
  }
});