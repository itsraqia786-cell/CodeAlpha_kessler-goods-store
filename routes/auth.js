// routes/auth.js — registration, login, logout, and "who am I".

const { readCollection, writeCollection, nextId } = require("../lib/db");
const { hashPassword, verifyPassword, createToken } = require("../lib/auth");
const { sendJson, setSessionCookie, clearSessionCookie } = require("../lib/http");

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function publicUser(user) {
  return { id: user.id, name: user.name, email: user.email };
}

async function register(req, res, body) {
  const name = (body.name || "").trim();
  const email = (body.email || "").trim().toLowerCase();
  const password = body.password || "";

  if (!name || !email || !password) {
    return sendJson(res, 400, { error: "Name, email, and password are all required." });
  }
  if (!EMAIL_RE.test(email)) {
    return sendJson(res, 400, { error: "That email address doesn't look valid." });
  }
  if (password.length < 8) {
    return sendJson(res, 400, { error: "Password must be at least 8 characters." });
  }

  const users = readCollection("users");
  if (users.some((u) => u.email === email)) {
    return sendJson(res, 409, { error: "An account with that email already exists." });
  }

  const { salt, hash } = hashPassword(password);
  const user = {
    id: nextId("u_"),
    name,
    email,
    salt,
    passwordHash: hash,
    createdAt: new Date().toISOString(),
  };
  users.push(user);
  await writeCollection("users", users);

  setSessionCookie(res, createToken(user.id));
  sendJson(res, 201, { user: publicUser(user) });
}

async function login(req, res, body) {
  const email = (body.email || "").trim().toLowerCase();
  const password = body.password || "";

  if (!email || !password) {
    return sendJson(res, 400, { error: "Email and password are required." });
  }

  const users = readCollection("users");
  const user = users.find((u) => u.email === email);
  if (!user || !verifyPassword(password, user.salt, user.passwordHash)) {
    return sendJson(res, 401, { error: "Incorrect email or password." });
  }

  setSessionCookie(res, createToken(user.id));
  sendJson(res, 200, { user: publicUser(user) });
}

function logout(req, res) {
  clearSessionCookie(res);
  sendJson(res, 200, { ok: true });
}

function me(req, res) {
  if (!req.userId) return sendJson(res, 401, { error: "Not signed in." });
  const users = readCollection("users");
  const user = users.find((u) => u.id === req.userId);
  if (!user) return sendJson(res, 401, { error: "Not signed in." });
  sendJson(res, 200, { user: publicUser(user) });
}

module.exports = { register, login, logout, me, publicUser };
