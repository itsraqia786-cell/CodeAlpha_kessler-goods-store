// lib/auth.js
//
// Password hashing (scrypt) and a small signed-token session scheme.
// No external auth libraries — everything here is Node's built-in `crypto`.

const crypto = require("crypto");

// In a real deployment this must come from an environment variable and be
// kept secret. For this self-contained project it is generated once per
// process start, which is fine for local/demo use — it just means existing
// sessions are invalidated if the server restarts.
const SESSION_SECRET = crypto.randomBytes(32).toString("hex");

const TOKEN_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return { salt, hash };
}

function verifyPassword(password, salt, expectedHash) {
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  const a = Buffer.from(hash, "hex");
  const b = Buffer.from(expectedHash, "hex");
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

function sign(payloadObj) {
  const payload = Buffer.from(JSON.stringify(payloadObj)).toString("base64url");
  const signature = crypto.createHmac("sha256", SESSION_SECRET).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

function createToken(userId) {
  return sign({ uid: userId, exp: Date.now() + TOKEN_TTL_MS });
}

function verifyToken(token) {
  if (!token || typeof token !== "string" || !token.includes(".")) return null;
  const [payload, signature] = token.split(".");
  const expected = crypto.createHmac("sha256", SESSION_SECRET).update(payload).digest("base64url");

  const sigBuf = Buffer.from(signature);
  const expBuf = Buffer.from(expected);
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) return null;

  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString());
    if (!data.exp || Date.now() > data.exp) return null;
    return data.uid;
  } catch {
    return null;
  }
}

module.exports = { hashPassword, verifyPassword, createToken, verifyToken };
