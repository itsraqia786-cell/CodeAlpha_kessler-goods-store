// js/auth.js — handles both login.html and register.html forms.
// Which one is active is read from this <script>'s own data-mode attribute.

const currentScript = document.currentScript;
const mode = currentScript.dataset.mode;
const formMessage = document.getElementById("formMessage");

function setMessage(text, type) {
  formMessage.textContent = text;
  formMessage.className = `form-message ${type || ""}`;
}

function redirectAfterAuth() {
  const params = new URLSearchParams(window.location.search);
  const next = params.get("next");
  window.location.href = next === "cart" ? "/cart.html" : "/index.html";
}

if (mode === "login") {
  document.getElementById("loginForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    setMessage("", "");
    const submitBtn = document.getElementById("submitBtn");
    submitBtn.disabled = true;
    submitBtn.textContent = "Logging in…";

    try {
      await api.post("/api/auth/login", {
        email: document.getElementById("email").value,
        password: document.getElementById("password").value,
      });
      redirectAfterAuth();
    } catch (err) {
      setMessage(err.message, "error");
      submitBtn.disabled = false;
      submitBtn.textContent = "Log in";
    }
  });
}

if (mode === "register") {
  document.getElementById("registerForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    setMessage("", "");
    const submitBtn = document.getElementById("submitBtn");
    submitBtn.disabled = true;
    submitBtn.textContent = "Creating account…";

    try {
      await api.post("/api/auth/register", {
        name: document.getElementById("name").value,
        email: document.getElementById("email").value,
        password: document.getElementById("password").value,
      });
      redirectAfterAuth();
    } catch (err) {
      setMessage(err.message, "error");
      submitBtn.disabled = false;
      submitBtn.textContent = "Create account";
    }
  });
}
