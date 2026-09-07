// routes/orders.js — checkout and order history.
//
// The cart itself lives in the browser (localStorage) so a shopper can
// browse and build a cart without an account. At checkout, the client sends
// the cart's product IDs and quantities; this endpoint is the source of
// truth for pricing and stock — it never trusts prices from the client.

const { readCollection, writeCollection, nextId } = require("../lib/db");
const { sendJson } = require("../lib/http");

const REQUIRED_SHIPPING_FIELDS = ["fullName", "address", "city", "postalCode", "country"];

async function create(req, res, body) {
  if (!req.userId) return sendJson(res, 401, { error: "Please sign in to place an order." });

  const items = Array.isArray(body.items) ? body.items : [];
  if (items.length === 0) {
    return sendJson(res, 400, { error: "Your cart is empty." });
  }

  const shipping = body.shipping || {};
  for (const field of REQUIRED_SHIPPING_FIELDS) {
    if (!String(shipping[field] || "").trim()) {
      return sendJson(res, 400, { error: "Please complete all shipping fields." });
    }
  }

  const products = readCollection("products");
  const orderItems = [];
  let total = 0;

  for (const line of items) {
    const product = products.find((p) => p.id === line.productId);
    const quantity = Number(line.quantity) || 0;

    if (!product) return sendJson(res, 400, { error: `Product ${line.productId} no longer exists.` });
    if (quantity < 1) return sendJson(res, 400, { error: `Invalid quantity for ${product.name}.` });
    if (quantity > product.stock) {
      return sendJson(res, 409, {
        error: `Only ${product.stock} of "${product.name}" left in stock — please update your cart.`,
      });
    }

    orderItems.push({
      productId: product.id,
      name: product.name,
      price: product.price,
      quantity,
      image: product.image,
    });
    total += product.price * quantity;
  }

  // Decrement stock now that the order is confirmed valid.
  for (const line of orderItems) {
    const product = products.find((p) => p.id === line.productId);
    product.stock -= line.quantity;
  }
  await writeCollection("products", products);

  const order = {
    id: nextId("ord_"),
    userId: req.userId,
    items: orderItems,
    total: Math.round(total * 100) / 100,
    shipping: {
      fullName: shipping.fullName.trim(),
      address: shipping.address.trim(),
      city: shipping.city.trim(),
      postalCode: shipping.postalCode.trim(),
      country: shipping.country.trim(),
    },
    status: "confirmed",
    createdAt: new Date().toISOString(),
  };

  const orders = readCollection("orders");
  orders.push(order);
  await writeCollection("orders", orders);

  sendJson(res, 201, { order });
}

function list(req, res) {
  if (!req.userId) return sendJson(res, 401, { error: "Please sign in to view your orders." });
  const orders = readCollection("orders")
    .filter((o) => o.userId === req.userId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  sendJson(res, 200, { orders });
}

function getOne(req, res, id) {
  if (!req.userId) return sendJson(res, 401, { error: "Please sign in to view this order." });
  const order = readCollection("orders").find((o) => o.id === id && o.userId === req.userId);
  if (!order) return sendJson(res, 404, { error: "Order not found." });
  sendJson(res, 200, { order });
}

module.exports = { create, list, getOne };
