const API = "/api/auth";

// ---------- HELPERS ----------
function isValidEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(String(email).toLowerCase());
}

function isStrongPassword(password) {
  // Strong password: 8+ chars, upper, lower, digit, special
  const re =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_\-+={}[\]|:;"'<>,.?/~`]).{8,}$/;
  return re.test(password);
}

function showAlert(msg) {
  alert(msg);
}

// ---------- PASSWORD STRENGTH ----------
function scorePassword(pw) {
  let score = 0;
  if (!pw) return 0;

  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[!@#$%^&*()_\-+={}[\]|:;"'<>,.?/~`]/.test(pw)) score++;

  if (score >= 4) return 3; // strong
  if (score >= 2) return 2; // medium
  return 1; // weak
}

function updatePasswordStrengthUI(pw) {
  const bar = document.getElementById("passwordStrengthBar");
  const label = document.getElementById("passwordStrengthLabel");
  if (!bar || !label) return;

  if (!pw) {
    bar.style.width = "0%";
    bar.style.backgroundColor = "#e5e7eb";
    label.textContent = "Password strength";
    return;
  }

  const score = scorePassword(pw);
  if (score === 1) {
    bar.style.width = "33%";
    bar.style.backgroundColor = "#ef4444"; // red
    label.textContent = "Weak";
  } else if (score === 2) {
    bar.style.width = "66%";
    bar.style.backgroundColor = "#f59e0b"; // amber
    label.textContent = "Medium";
  } else {
    bar.style.width = "100%";
    bar.style.backgroundColor = "#22c55e"; // green
    label.textContent = "Strong";
  }
}

// ---------- PASSWORD TOGGLE ----------
function setupPasswordToggles() {
  const buttons = document.querySelectorAll(".toggle-password");
  buttons.forEach((btn) => {
    const targetId = btn.getAttribute("data-target");
    const input = document.getElementById(targetId);
    if (!input) return;

    btn.addEventListener("click", () => {
      const isPassword = input.type === "password";
      input.type = isPassword ? "text" : "password";
      btn.textContent = isPassword ? "Hide" : "Show";
    });
  });

  // If register page with strength meter, hook into password input
  const pwInput = document.getElementById("password");
  if (pwInput && document.getElementById("passwordStrengthBar")) {
    pwInput.addEventListener("input", (e) => {
      updatePasswordStrengthUI(e.target.value);
    });
  }
}

// ---------- REGISTER ----------
async function register() {
  const name = document.getElementById("name").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  if (!name) {
    showAlert("Please enter your name.");
    return;
  }

  if (!isValidEmail(email)) {
    showAlert("Please enter a valid email address (e.g. user@example.com).");
    return;
  }

  if (!isStrongPassword(password)) {
    showAlert(
      "Password must be at least 8 characters and include:\n" +
        "• one uppercase letter\n" +
        "• one lowercase letter\n" +
        "• one digit\n" +
        "• one special character (e.g. !@#$%)"
    );
    return;
  }

  const res = await fetch(`${API}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password })
  });

  const data = await res.json();
  if (res.ok) {
    alert("Registration successful! Please login.");
    window.location.href = "login.html";
  } else {
    showAlert(data.error || "Registration failed.");
  }
}

// ---------- LOGIN ----------
async function login() {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  if (!isValidEmail(email)) {
    showAlert("Please enter a valid email address.");
    return;
  }

  if (!password) {
    showAlert("Please enter your password.");
    return;
  }

  const res = await fetch(`${API}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });

  const data = await res.json();
  if (res.ok) {
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));
    window.location.href = "index.html";
  } else {
    showAlert(data.error || "Login failed.");
  }
}

// ---------- INIT ON AUTH PAGES ----------
document.addEventListener("DOMContentLoaded", () => {
  setupPasswordToggles();
});
