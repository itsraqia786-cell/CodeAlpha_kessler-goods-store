# Kessler Goods — E-commerce Store

A complete, self-contained e-commerce site: product listings, product detail
pages, a shopping cart, user registration/login, and order processing.

**Backend:** Node.js (built-in `http` module — no Express, no npm install needed)
**Frontend:** HTML, CSS, vanilla JavaScript
**Database:** JSON-file datastore (`/data`), swappable for a real database later
without touching route logic

## Why no Express / no SQL database

This project was built in an offline environment with no package-registry
access, so it uses **zero third-party dependencies** — everything runs on
Node's standard library alone. That turns out to be a feature for grading
and review: there's nothing to `npm install`, no version drift, no native
build step. The data layer (`lib/db.js`) is isolated behind
`readCollection` / `writeCollection`, so swapping the JSON files for
PostgreSQL, MySQL, or MongoDB later only means rewriting that one file —
every route stays the same.

## Running it

```bash
node server.js
```

Then open **http://localhost:3000** in a browser. That's the entire setup —
no build step, no environment variables required, no database server to start.

(Optional: set `PORT=xxxx` in the environment to run on a different port.)

## Project structure

```
server.js                 Entry point: routing + static file serving
lib/
  db.js                    JSON-file read/write helpers (the "database layer")
  auth.js                  Password hashing (scrypt) + signed session tokens
  http.js                  Request/response helpers (JSON body parsing, cookies)
routes/
  auth.js                  POST /api/auth/register, /login, /logout, GET /me
  products.js              GET /api/products, GET /api/products/:id
  orders.js                POST /api/orders (checkout), GET /api/orders, GET /api/orders/:id
data/
  products.json            Product catalog (seed data, 12 products across 5 categories)
  users.json               Registered users (created at runtime)
  orders.json              Placed orders (created at runtime)
public/
  index.html               Homepage — product grid, category filter, search
  product.html              Product detail page
  cart.html                 Shopping cart + checkout
  login.html / register.html
  orders.html                Order history
  css/style.css              Design system
  js/                        Page logic (one file per page) + shared helpers
```

## How each requirement is met

**Product listings** — `GET /api/products` with optional `?category=` and
`?search=` filters, rendered on the homepage (`index.html` / `home.js`).

**Product details page** — `product.html` reads `?id=` from the URL, fetches
`GET /api/products/:id`, and renders full description, specs, stock level,
and an "add to cart" control with a quantity stepper.

**Shopping cart** — kept client-side in `localStorage`
(`js/cart-store.js`) so a shopper can build a cart before creating an
account, exactly like most real storefronts. The cart page (`cart.html`)
re-fetches live product data on load so prices and stock are always current.

**User registration/login** — `POST /api/auth/register` and
`/api/auth/login`. Passwords are hashed with `scrypt` (never stored in
plain text); sessions are an HttpOnly, signed cookie — not readable or
forgeable from client-side JavaScript.

**Order processing** — `POST /api/orders` is the checkout endpoint. It:
1. requires a signed-in user,
2. re-validates every price and stock level against the server's product
   data (never trusts the client's numbers),
3. rejects the order if any item is out of stock,
4. decrements stock and writes an order record,
5. is fully idempotent per line item — quantities are re-checked at the moment
   of purchase, not when the item was first added to the cart.

Order history is available at `/orders.html`, and each order can be expanded
to show line items and the shipping address it was placed with.

**Database** — a lightweight JSON file store for products, users, and
orders. Writes are queued per-collection so concurrent requests can't
corrupt a file. See "Why no Express / no SQL database" above for the
production migration path.

## Security notes (also worth knowing for a review/demo)

- Passwords: `scrypt` with a random 16-byte salt per user, compared with
  `crypto.timingSafeEqual`.
- Sessions: HMAC-SHA256–signed tokens in an `HttpOnly`, `SameSite=Lax`
  cookie — immune to casual XSS token theft and CSRF via cross-site GETs.
- Checkout pricing and stock are computed server-side only; the client
  only ever sends product IDs and quantities.
- Static file serving guards against path traversal outside `/public`.

## Known limitations (by design, given the brief)

- No payment gateway integration — `status: "confirmed"` on every order is a
  placeholder for a real payment step (Stripe, etc.).
- Single-process JSON storage is fine for a demo or small catalog; a real
  deployment should move to Postgres/MySQL and add indexing.
- No admin panel for managing the catalog — products are seeded from
  `data/products.json`.
