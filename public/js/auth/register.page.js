const password = document.getElementById("password");
const strength = document.getElementById("passwordStrength");
const toggle = document.getElementById("togglePass");

toggle?.addEventListener("click", () => {
  password.type = password.type === "password" ? "text" : "password";
  toggle.textContent = password.type === "password" ? "Show" : "Hide";
});

password?.addEventListener("input", () => {
  const val = password.value;
  if (val.length < 6) {
    strength.textContent = "Weak password";
    strength.className = "password-strength weak";
  } else if (/[A-Z]/.test(val) && /\d/.test(val)) {
    strength.textContent = "Strong password";
    strength.className = "password-strength strong";
  } else {
    strength.textContent = "Medium strength";
    strength.className = "password-strength medium";
  }
});
const form = document.getElementById("register-form");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const name = form.name.value.trim();
  const email = form.email.value.trim();
  const password = form.password.value;

  if (!name || !email || !password) {
    alert("All fields are required");
    return;
  }

  try {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password })
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.message || "Registration failed");
      return;
    }

    // ✅ SUCCESS → LOGIN PAGE
    window.location.href = "/login.html";

  } catch (err) {
    console.error(err);
    alert("Something went wrong");
  }
});
