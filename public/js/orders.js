// js/orders.js — order history with an expandable detail per order.

const ordersList = document.getElementById("ordersList");
const confirmationBanner = document.getElementById("confirmationBanner");

function money(amount) {
  return `Rs. ${Number(amount).toLocaleString("en-PK")}`;
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

async function load() {
  const params = new URLSearchParams(window.location.search);
  const placedId = params.get("placed");

  try {
    const { orders } = await api.get("/api/orders");

    if (placedId) {
      const placed = orders.find((o) => o.id === placedId);
      confirmationBanner.style.display = "block";
      confirmationBanner.textContent = placed
        ? `Order placed — thank you! Your confirmation number is ${placed.id}.`
        : "Order placed — thank you!";
    }

    if (orders.length === 0) {
      ordersList.innerHTML = `<div class="empty-state">No orders yet. <a href="/index.html">Start shopping →</a></div>`;
      return;
    }

    ordersList.innerHTML = orders
      .map(
        (order) => `
      <div class="order-card">
        <div class="order-head" data-id="${order.id}">
          <div>
            <div><strong>${formatDate(order.createdAt)}</strong></div>
            <div class="oid">${order.id} · ${order.items.reduce((n, i) => n + i.quantity, 0)} item(s)</div>
          </div>
          <div style="display:flex; align-items:center; gap:16px;">
            <span>${money(order.total)}</span>
            <span class="status">${order.status}</span>
          </div>
        </div>
        <div class="order-body" id="body-${order.id}">
          ${order.items
            .map(
              (item) => `
            <div class="order-item-row">
              <span>${item.name} × ${item.quantity}</span>
              <span>${money(item.price * item.quantity)}</span>
            </div>
          `
            )
            .join("")}
          <p class="muted" style="margin-top:16px;">
            Shipping to ${order.shipping.fullName}, ${order.shipping.address}, ${order.shipping.city} ${order.shipping.postalCode}, ${order.shipping.country}
          </p>
        </div>
      </div>
    `
      )
      .join("");

    ordersList.querySelectorAll(".order-head").forEach((head) => {
      head.addEventListener("click", () => {
        document.getElementById(`body-${head.dataset.id}`).classList.toggle("open");
      });
    });

    if (placedId) {
      document.getElementById(`body-${placedId}`)?.classList.add("open");
    }
  } catch (err) {
    ordersList.innerHTML = `<div class="empty-state">Please <a href="/login.html?next=orders">log in</a> to see your orders.</div>`;
  }
}

load();
