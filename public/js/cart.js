// js/cart.js — renders the cart from localStorage + live product data,
// and drives the checkout form.

const cartLinesEl = document.getElementById("cartLines");
const subtotalEl = document.getElementById("summarySubtotal");
const totalEl = document.getElementById("summaryTotal");
const checkoutBtn = document.getElementById("checkoutBtn");
const checkoutPanel = document.getElementById("checkoutPanel");
const checkoutForm = document.getElementById("checkoutForm");
const formMessage = document.getElementById("formMessage");

let currentLines = []; // [{ product, quantity }]

function money(amount) {
  return `$${amount.toFixed(2)}`;
}

function setMessage(text, type) {
  formMessage.textContent = text;
  formMessage.className = `form-message ${type || ""}`;
}

async function loadCart() {
  const cart = cartStore.read();
  const ids = Object.keys(cart);

  if (ids.length === 0) {
    cartLinesEl.innerHTML = `<div class="empty-state">Your cart is empty. <a href="/index.html">Keep browsing →</a></div>`;
    checkoutBtn.disabled = true;
    updateTotals([]);
    return;
  }

  try {
    const { products } = await api.get("/api/products");
    currentLines = ids
      .map((id) => {
        const product = products.find((p) => p.id === id);
        return product ? { product, quantity: Math.min(cart[id], product.stock || cart[id]) } : null;
      })
      .filter(Boolean);

    renderLines();
    updateTotals(currentLines);
    checkoutBtn.disabled = currentLines.length === 0;
  } catch (err) {
    cartLinesEl.innerHTML = `<div class="empty-state">Couldn't load your cart: ${err.message}</div>`;
  }
}

function renderLines() {
  cartLinesEl.innerHTML = currentLines
    .map(
      (line) => `
    <div class="cart-line" data-id="${line.product.id}">
      <img src="${line.product.image}" alt="${line.product.name}" onerror="this.onerror=null;this.src='/assets/images/product-placeholder.svg';" />
      <div>
        <div class="name">${line.product.name}</div>
        <div class="muted">${money(line.product.price)} each</div>
      </div>
      <div class="qty-stepper">
        <button type="button" class="qty-minus" aria-label="Decrease quantity">–</button>
        <input type="text" class="qty-value" value="${line.quantity}" inputmode="numeric" />
        <button type="button" class="qty-plus" aria-label="Increase quantity">+</button>
      </div>
      <div class="line-price">${money(line.product.price * line.quantity)}</div>
      <button type="button" class="btn btn-quiet remove-line" aria-label="Remove item">Remove</button>
    </div>
  `
    )
    .join("");

  cartLinesEl.querySelectorAll(".cart-line").forEach((row) => {
    const id = row.dataset.id;
    const line = currentLines.find((l) => l.product.id === id);

    row.querySelector(".qty-minus").addEventListener("click", () => {
      const next = Math.max(1, line.quantity - 1);
      cartStore.setQuantity(id, next);
      loadCart();
    });
    row.querySelector(".qty-plus").addEventListener("click", () => {
      const next = Math.min(line.product.stock, line.quantity + 1);
      cartStore.setQuantity(id, next);
      loadCart();
    });
    row.querySelector(".qty-value").addEventListener("change", (e) => {
      let val = parseInt(e.target.value, 10);
      if (isNaN(val) || val < 1) val = 1;
      if (val > line.product.stock) val = line.product.stock;
      cartStore.setQuantity(id, val);
      loadCart();
    });
    row.querySelector(".remove-line").addEventListener("click", () => {
      cartStore.remove(id);
      loadCart();
    });
  });
}

function updateTotals(lines) {
  const subtotal = lines.reduce((sum, l) => sum + l.product.price * l.quantity, 0);
  subtotalEl.textContent = money(subtotal);
  totalEl.textContent = money(subtotal);
}

checkoutBtn.addEventListener("click", async () => {
  try {
    await api.get("/api/auth/me");
    checkoutPanel.style.display = checkoutPanel.style.display === "none" ? "block" : "none";
  } catch {
    window.location.href = "/login.html?next=cart";
  }
});

checkoutForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  setMessage("", "");

  const placeOrderBtn = document.getElementById("placeOrderBtn");
  placeOrderBtn.disabled = true;
  placeOrderBtn.textContent = "Placing order…";

  const shipping = {
    fullName: document.getElementById("fullName").value,
    address: document.getElementById("address").value,
    city: document.getElementById("city").value,
    postalCode: document.getElementById("postalCode").value,
    country: document.getElementById("country").value,
  };

  const items = currentLines.map((l) => ({ productId: l.product.id, quantity: l.quantity }));

  try {
    const { order } = await api.post("/api/orders", { items, shipping });
    cartStore.clear();
    window.location.href = `/orders.html?placed=${order.id}`;
  } catch (err) {
    setMessage(err.message, "error");
    placeOrderBtn.disabled = false;
    placeOrderBtn.textContent = "Place order";
  }
});

loadCart();
