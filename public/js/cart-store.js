// js/cart-store.js
//
// The cart lives in the browser so anyone can build one before signing in.
// Shape: { [productId]: quantity }. The server is always the source of
// truth for price and stock — this store only remembers what the shopper
// picked.

const CART_KEY = "kessler_cart";

const cartStore = {
  read() {
    try {
      return JSON.parse(localStorage.getItem(CART_KEY)) || {};
    } catch {
      return {};
    }
  },

  write(cart) {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    document.dispatchEvent(new CustomEvent("cart:changed", { detail: cart }));
  },

  add(productId, quantity = 1) {
    const cart = this.read();
    cart[productId] = (cart[productId] || 0) + quantity;
    this.write(cart);
  },

  setQuantity(productId, quantity) {
    const cart = this.read();
    if (quantity <= 0) {
      delete cart[productId];
    } else {
      cart[productId] = quantity;
    }
    this.write(cart);
  },

  remove(productId) {
    const cart = this.read();
    delete cart[productId];
    this.write(cart);
  },

  clear() {
    this.write({});
  },

  count() {
    return Object.values(this.read()).reduce((sum, qty) => sum + qty, 0);
  },
};
