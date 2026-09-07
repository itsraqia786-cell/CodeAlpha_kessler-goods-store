// js/nav.js — runs on every page. Keeps the cart badge in sync and swaps
// the nav's auth link between "Log in" and "Log out" depending on session state.

function renderCartCount() {
  const el = document.getElementById("navCartCount");
  if (!el) return;
  const count = cartStore.count();
  el.textContent = count;
  el.dataset.empty = count === 0 ? "true" : "false";
}

function setActiveNavItem() {
  const pathname = window.location.pathname;
  const shopPages = ["/", "/index.html", "/product.html"];

  document.querySelectorAll(".main-nav a").forEach((link) => {
    const href = new URL(link.href, window.location.origin).pathname;
    const isActive =
      (shopPages.includes(pathname) && href === "/index.html") || href === pathname;
    link.classList.toggle("is-active", isActive);
    if (isActive) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  });
}

async function renderAuthArea() {
  const el = document.getElementById("navAuthArea");
  if (!el) return;

  try {
    const { user } = await api.get("/api/auth/me");
    el.innerHTML = `
      <a href="/orders.html">Orders</a>
      <button type="button" id="navLogout" class="logout-btn">Log out</button>
    `;
    const logoutLink = document.getElementById("navLogout");
    logoutLink.addEventListener("click", async (e) => {
      await api.post("/api/auth/logout");
      showToast("You have been logged out successfully.");
      setTimeout(() => {
        window.location.href = "/index.html";
      }, 900);
    });
  } catch {
    el.innerHTML = `<a href="/login.html">Log in</a>`;
  }

  setActiveNavItem();
}

document.addEventListener("DOMContentLoaded", () => {
  renderCartCount();
  setActiveNavItem();
  renderAuthArea();
});

document.addEventListener("cart:changed", renderCartCount);
