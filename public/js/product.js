// js/product.js — renders a single product and handles "add to cart".

const root = document.getElementById("productRoot");
const params = new URLSearchParams(window.location.search);
const productId = params.get("id");

function money(amount) {
  return `Rs. ${Number(amount).toLocaleString("en-PK")}`;
}

function stockNote(stock) {
  if (stock <= 0) return `<div class="stock-note low">Currently out of stock</div>`;
  if (stock <= 5) return `<div class="stock-note low">Only ${stock} left</div>`;
  return `<div class="stock-note ok">In stock, ready to ship</div>`;
}

async function load() {
  if (!productId) {
    root.innerHTML = `<div class="empty-state">No product specified.</div>`;
    return;
  }

  try {
    const { product } = await api.get(`/api/products/${encodeURIComponent(productId)}`);
    document.title = `${product.name} — Kessler Goods`;
    document.getElementById("breadcrumbCat").textContent = `/ ${product.category} / ${product.name}`;

    root.innerHTML = `
      <div class="thumb"><img src="${product.image}" alt="${product.name}" onerror="this.onerror=null;this.src='/assets/images/product-placeholder.svg';" /></div>
      <div class="product-info">
        <div class="cat">${product.category}</div>
        <h1>${product.name}</h1>
        <div class="price">${money(product.price)}</div>
        ${stockNote(product.stock)}
        <p>${product.description}</p>

        <div class="qty-row">
          <div class="qty-stepper">
            <button type="button" id="qtyMinus" aria-label="Decrease quantity">–</button>
            <input type="text" id="qtyInput" value="1" inputmode="numeric" aria-label="Quantity" />
            <button type="button" id="qtyPlus" aria-label="Increase quantity">+</button>
          </div>
          <button class="btn" id="addToCartBtn" ${product.stock <= 0 ? "disabled" : ""}>
            ${product.stock <= 0 ? "Out of stock" : "Add to cart"}
          </button>
        </div>

        <ul class="specs">
          ${product.specs.map((s) => `<li>${s}</li>`).join("")}
        </ul>
      </div>
    `;

    wireQuantity(product);
  } catch (err) {
    root.innerHTML = `<div class="empty-state">Couldn't load this product: ${err.message}</div>`;
  }
}

function wireQuantity(product) {
  const qtyInput = document.getElementById("qtyInput");
  const minus = document.getElementById("qtyMinus");
  const plus = document.getElementById("qtyPlus");
  const addBtn = document.getElementById("addToCartBtn");

  function clamp() {
    let val = parseInt(qtyInput.value, 10);
    if (isNaN(val) || val < 1) val = 1;
    if (val > product.stock) val = product.stock;
    qtyInput.value = val;
  }

  minus.addEventListener("click", () => {
    qtyInput.value = Math.max(1, (parseInt(qtyInput.value, 10) || 1) - 1);
  });
  plus.addEventListener("click", () => {
    clamp();
    qtyInput.value = Math.min(product.stock, (parseInt(qtyInput.value, 10) || 1) + 1);
  });
  qtyInput.addEventListener("change", clamp);

  addBtn.addEventListener("click", () => {
    clamp();
    const qty = parseInt(qtyInput.value, 10) || 1;
    cartStore.add(product.id, qty);
    showToast(`Added ${qty} × ${product.name} to your cart`);
  });
}

load();
