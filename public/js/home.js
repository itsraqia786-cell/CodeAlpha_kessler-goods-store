// js/home.js — product grid, category chips, and search on the homepage.

const grid = document.getElementById("productGrid");
const categoryRow = document.getElementById("categoryRow");
const searchInput = document.getElementById("searchInput");

let activeCategory = "";
let searchTimer = null;

function money(amount) {
  return `$${amount.toFixed(2)}`;
}

function renderCategories(categories) {
  const existingChips = categoryRow.querySelectorAll("[data-category]:not(.always)");
  existingChips.forEach((chip) => {
    if (chip.dataset.category !== "") chip.remove();
  });

  categories.forEach((cat) => {
    const chip = document.createElement("a");
    chip.href = "#catalog";
    chip.className = "chip";
    chip.dataset.category = cat;
    chip.textContent = cat;
    chip.addEventListener("click", (e) => {
      e.preventDefault();
      setActiveCategory(cat);
    });
    categoryRow.insertBefore(chip, categoryRow.querySelector(".search-box"));
  });
}

function setActiveCategory(cat) {
  activeCategory = cat;
  categoryRow.querySelectorAll(".chip").forEach((chip) => {
    chip.classList.toggle("active", chip.dataset.category === cat);
  });
  loadProducts();
}

function renderProducts(products) {
  if (products.length === 0) {
    grid.innerHTML = `<div class="empty-state">No products match that search. Try a different term or category.</div>`;
    return;
  }

  grid.innerHTML = products
    .map(
      (p) => `
    <a class="product-card" href="/product.html?id=${p.id}">
      <div class="thumb"><img src="${p.image}" alt="${p.name}" loading="lazy" onerror="this.onerror=null;this.src='/assets/images/product-placeholder.svg';" /></div>
      <div class="cat">${p.category}</div>
      <h3>${p.name}</h3>
      <div class="price">${money(p.price)}</div>
    </a>
  `
    )
    .join("");
}

async function loadProducts() {
  grid.innerHTML = `<div class="empty-state">Loading products…</div>`;
  const params = new URLSearchParams();
  if (activeCategory) params.set("category", activeCategory);
  if (searchInput.value.trim()) params.set("search", searchInput.value.trim());

  try {
    const { products, categories } = await api.get(`/api/products?${params.toString()}`);
    renderProducts(products);
    if (!categoryRow.dataset.rendered) {
      renderCategories(categories);
      categoryRow.dataset.rendered = "true";
    }
  } catch (err) {
    grid.innerHTML = `<div class="empty-state">Couldn't load products right now: ${err.message}</div>`;
  }
}

document.querySelector('.chip[data-category=""]').addEventListener("click", (e) => {
  e.preventDefault();
  setActiveCategory("");
});

searchInput.addEventListener("input", () => {
  // Searching is across the whole catalog, not only the previously selected chip.
  if (activeCategory) {
    activeCategory = "";
    categoryRow.querySelectorAll(".chip").forEach((chip) => {
      chip.classList.toggle("active", chip.dataset.category === "");
    });
  }
  clearTimeout(searchTimer);
  searchTimer = setTimeout(loadProducts, 250);
});

loadProducts();
