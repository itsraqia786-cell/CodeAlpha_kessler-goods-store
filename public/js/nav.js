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

function renderBackButton() {
  const headerWrap = document.querySelector(".site-header .wrap");
  const header = document.querySelector(".site-header");
  const pathname = window.location.pathname;
  const isHome = pathname === "/" || pathname === "/index.html";
  if (!headerWrap || !header || isHome || document.getElementById("siteBackBtn")) return;

  const backButton = document.createElement("button");
  backButton.type = "button";
  backButton.id = "siteBackBtn";
  backButton.className = "site-back-btn";
  backButton.setAttribute("aria-label", "Go back to the previous page");
  backButton.textContent = "← Back";
  backButton.addEventListener("click", () => {
    if (window.history.length > 1) window.history.back();
    else window.location.href = "/index.html";
  });

  const backSection = document.createElement("div");
  backSection.className = "page-back-section";
  const backWrap = document.createElement("div");
  backWrap.className = "wrap";
  backWrap.appendChild(backButton);
  backSection.appendChild(backWrap);
  header.insertAdjacentElement("afterend", backSection);
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
      const confirmed = window.confirm("Are you sure you want to log out?");
      if (!confirmed) return;
      await api.post("/api/auth/logout");
      showToast("You have been logged out successfully.");
      setTimeout(() => {
        window.location.href = "/index.html";
      }, 900);
    });
  } catch {
    el.innerHTML = `<a href="/login.html" class="login-btn">Log in</a>`;
  }

  setActiveNavItem();
}

document.addEventListener("DOMContentLoaded", () => {
  renderCartCount();
  renderBackButton();
  setActiveNavItem();
  renderAuthArea();
});

document.addEventListener("cart:changed", renderCartCount);
