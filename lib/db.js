// lib/db.js
//
// A minimal file-backed "database". Each collection (products, users, orders)
// lives in its own JSON file under /data. Reads are synchronous (the files
// are small); writes are queued per-file so two concurrent requests never
// interleave and corrupt the file.

const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(__dirname, "..", "data");

const FILES = {
  products: path.join(DATA_DIR, "products.json"),
  users: path.join(DATA_DIR, "users.json"),
  orders: path.join(DATA_DIR, "orders.json"),
};

// One write queue per collection so writes never race each other.
const writeQueues = { products: Promise.resolve(), users: Promise.resolve(), orders: Promise.resolve() };

function readCollection(name) {
  const file = FILES[name];
  if (!file) throw new Error(`Unknown collection: ${name}`);
  const raw = fs.readFileSync(file, "utf-8");
  return JSON.parse(raw || "[]");
}

function writeCollection(name, data) {
  const file = FILES[name];
  if (!file) throw new Error(`Unknown collection: ${name}`);

  // Chain onto the existing queue for this collection so writes are ordered.
  writeQueues[name] = writeQueues[name].then(
    () =>
      new Promise((resolve, reject) => {
        const tmp = `${file}.tmp`;
        fs.writeFile(tmp, JSON.stringify(data, null, 2), (err) => {
          if (err) return reject(err);
          fs.rename(tmp, file, (err2) => (err2 ? reject(err2) : resolve()));
        });
      })
  );
  return writeQueues[name];
}

function nextId(prefix, collection) {
  const n = Math.floor(Math.random() * 900000 + 100000);
  return `${prefix}${Date.now().toString(36)}${n.toString(36)}`;
}

module.exports = { readCollection, writeCollection, nextId };
