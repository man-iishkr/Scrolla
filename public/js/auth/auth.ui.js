// public/js/auth/auth.ui.js
// -------------------------
// Handles auth modal + user badge safely

import { isLoggedIn, getCurrentUser,logout } from "../core/auth.js";


/* ---------------------------
   AUTH MODAL
--------------------------- */
function setupAuthModal() {
  const modal = document.getElementById("auth-modal");
  if (!modal) return;

  const loginBtn = modal.querySelector("[data-action='login']");
  const registerBtn = modal.querySelector("[data-action='register']");
  const guestBtn = modal.querySelector("[data-action='guest']");

  loginBtn?.addEventListener("click", () => {
    window.location.href = "login.html";
  });

  registerBtn?.addEventListener("click", () => {
    window.location.href = "register.html";
  });

  guestBtn?.addEventListener("click", () => {
    modal.classList.add("hidden");
  });
}

/* ---------------------------
   USER BADGE (TOP RIGHT)
--------------------------- */
function setupUserBadge() {
  const btn = document.getElementById("auth-user-btn");
  if (!btn) return;

  if (isLoggedIn()) {
    const user = getCurrentUser();
    btn.textContent = user?.name || "Account";
  } else {
    btn.textContent = "Sign in";
    btn.addEventListener("click", () => {
      window.location.href = "login.html";
    });
  }
}

/* ---------------------------
   INIT (EXPORTED)
--------------------------- */
// public/js/auth/auth.ui.js

export function initAuthUI() {
  const gate = document.getElementById("auth-gate");
  const continueBtn = document.getElementById("continue-guest");
  const signInBtn = document.getElementById("signin-btn");
  const badge = document.getElementById("user-badge");

  const token = localStorage.getItem("token");
  const user = localStorage.getItem("user");

  if (!token && gate) {
    gate.classList.remove("hidden");
  }

  if (continueBtn) {
    continueBtn.onclick = () => {
      gate.classList.add("hidden");
    };
  }
   if (signInBtn) {
    signInBtn.onclick = () => {
      window.location.href = "/login.html";
    };
  }


  if (token && user && badge) {
    const u = JSON.parse(user);
    badge.textContent = u.name;
    badge.classList.remove("hidden");
    if (signInBtn) signInBtn.classList.add("hidden");
  }
    
  const userBadge = document.getElementById("user-badge");

  if (!signInBtn || !userBadge) return;

  if (isLoggedIn()) {
    const user = getCurrentUser();

    signInBtn.classList.add("hidden");

    userBadge.classList.remove("hidden");
    userBadge.innerHTML = `
      <span class="user-name">Hi, ${user?.name || "User"}</span>
      <button id="logout-btn" class="btn ghost small">Logout</button>
    `;

    document
      .getElementById("logout-btn")
      .addEventListener("click", () => {
        logout();
        window.location.reload();
      });

  } else {
    userBadge.classList.add("hidden");
    signInBtn.classList.remove("hidden");

    signInBtn.addEventListener("click", () => {
      window.location.href = "/login.html";
    });
  }
}
