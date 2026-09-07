// routes/products.js — read-only catalog endpoints.

const { readCollection } = require("../lib/db");
const { sendJson } = require("../lib/http");

function list(req, res, query) {
  let products = readCollection("products");

  if (query.category) {
    products = products.filter((p) => p.category.toLowerCase() === query.category.toLowerCase());
  }
  if (query.search) {
    const q = query.search.trim().toLowerCase();
    const categoryMatches = products.filter((p) => p.category.toLowerCase().includes(q));

    // A category term such as "kitchen" should show that category first,
    // rather than unrelated products whose long description happens to use it.
    products = categoryMatches.length
      ? categoryMatches
      : products.filter(
          (p) =>
            p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q)
        );
  }

  const categories = [...new Set(readCollection("products").map((p) => p.category))].sort();
  sendJson(res, 200, { products, categories });
}

function getOne(req, res, id) {
  const products = readCollection("products");
  const product = products.find((p) => p.id === id);
  if (!product) return sendJson(res, 404, { error: "That product doesn't exist." });
  sendJson(res, 200, { product });
}

module.exports = { list, getOne };
