// public/js/core/auth.js
// ----------------------
// Auth helpers (SINGLE SOURCE OF TRUTH)

export function getAuthToken() {
  return localStorage.getItem("token");
}

export function isLoggedIn() {
  return !!getAuthToken();
}

export function getCurrentUser() {
  try {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
}
