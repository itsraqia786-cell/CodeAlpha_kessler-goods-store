// server.js
//
// Kessler Goods — a self-contained e-commerce backend.
// Deliberately built on Node's built-in `http` module only, with a JSON-file
// datastore, so the whole project runs with `node server.js` and nothing
// else to install. Swapping this file's storage layer (lib/db.js) for a real
// database (Postgres, MongoDB, etc.) later would not require touching the
// route handlers, since they only call readCollection/writeCollection.

const http = require("http");
const fs = require("fs");
const path = require("path");
const { URL } = require("url");

const { parseCookies, readJsonBody, sendJson } = require("./lib/http");
const { verifyToken } = require("./lib/auth");

const authRoutes = require("./routes/auth");
const productRoutes = require("./routes/products");
const orderRoutes = require("./routes/orders");

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, "public");

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
};

function serveStatic(req, res, pathname) {
  let filePath = pathname === "/" ? "/index.html" : pathname;
  // Allow clean URLs like /product without the .html suffix.
  if (!path.extname(filePath)) filePath += ".html";

  const resolved = path.join(PUBLIC_DIR, filePath);

  // Guard against path traversal outside the public directory.
  if (!resolved.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    return res.end("Forbidden");
  }

  fs.readFile(resolved, (err, data) => {
    if (err) {
      fs.readFile(path.join(PUBLIC_DIR, "404.html"), (err2, notFoundPage) => {
        res.writeHead(404, { "Content-Type": "text/html; charset=utf-8" });
        res.end(notFoundPage || "404 Not Found");
      });
      return;
    }
    const ext = path.extname(resolved);
    res.writeHead(200, { "Content-Type": MIME_TYPES[ext] || "application/octet-stream" });
    res.end(data);
  });
}

async function handleApi(req, res, url) {
  const segments = url.pathname.split("/").filter(Boolean); // ["api", "products", "p001"]
  const resource = segments[1];
  const resourceId = segments[2];

  // Attach the authenticated user id (if any) to the request for handlers to use.
  const cookies = parseCookies(req);
  req.userId = verifyToken(cookies.token);

  const needsBody = ["POST", "PUT", "PATCH", "DELETE"].includes(req.method);
  let body = {};
  if (needsBody) {
    try {
      body = await readJsonBody(req);
    } catch (err) {
      return sendJson(res, err.statusCode || 400, { error: err.message });
    }
  }

  try {
    // ---- /api/auth/* ----
    if (resource === "auth") {
      const action = resourceId;
      if (action === "register" && req.method === "POST") return authRoutes.register(req, res, body);
      if (action === "login" && req.method === "POST") return authRoutes.login(req, res, body);
      if (action === "logout" && req.method === "POST") return authRoutes.logout(req, res);
      if (action === "me" && req.method === "GET") return authRoutes.me(req, res);
    }

    // ---- /api/products* ----
    if (resource === "products") {
      if (!resourceId && req.method === "GET") {
        const query = Object.fromEntries(url.searchParams.entries());
        return productRoutes.list(req, res, query);
      }
      if (resourceId && req.method === "GET") return productRoutes.getOne(req, res, resourceId);
    }

    // ---- /api/orders* ----
    if (resource === "orders") {
      if (!resourceId && req.method === "POST") return orderRoutes.create(req, res, body);
      if (!resourceId && req.method === "GET") return orderRoutes.list(req, res);
      if (resourceId && req.method === "GET") return orderRoutes.getOne(req, res, resourceId);
    }

    sendJson(res, 404, { error: "Not found." });
  } catch (err) {
    console.error("Unhandled error:", err);
    sendJson(res, 500, { error: "Something went wrong on our end. Please try again." });
  }
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (url.pathname.startsWith("/api/")) {
    handleApi(req, res, url);
  } else {
    serveStatic(req, res, url.pathname);
  }
});

server.listen(PORT, () => {
  console.log(`Kessler Goods running at http://localhost:${PORT}`);
});
