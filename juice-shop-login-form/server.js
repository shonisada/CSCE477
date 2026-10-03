// server.js
// Minimal, dependency-free Node HTTP server that mimics Juice Shop's
// login endpoint. No npm packages required - only Node's built-in
// modules (http, fs, path, crypto).
//
// Demonstrates: server-side re-validation (never trust the client),
// parameterized-style lookups (no string-built SQL), and salted
// password hashing.

const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = process.env.PORT || 3001;

// --- Password hashing ---------------------------------------------------
// Uses Node's built-in scrypt (a slow, salted KDF - same category as
// bcrypt/argon2). Never store or compare plain-text passwords.
function hashPassword(plain) {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(plain, salt, 64).toString('hex');
  return `${salt}:${derived}`;
}

function verifyPassword(plain, stored) {
  const [salt, derivedHex] = stored.split(':');
  const derived = crypto.scryptSync(plain, salt, 64).toString('hex');
  const a = Buffer.from(derived, 'hex');
  const b = Buffer.from(derivedHex, 'hex');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

// --- "Database" -------------------------------------------------------
// In a real app this would be Postgres/MySQL etc. Passwords are stored
// hashed, never in plain text.
const users = [
  { email: 'demo@juice-sh.op', passwordHash: hashPassword('Password123!') }
];

// --- Validation helpers -------------------------------------------------
function isValidEmail(value) {
  return typeof value === 'string' && value.includes('@') && value.length > 3;
}

function isValidPassword(value) {
  return typeof value === 'string' && value.length >= 8;
}

// --- Static file serving -------------------------------------------------
const STATIC_FILES = {
  '/': 'index.html',
  '/index.html': 'index.html',
  '/style.css': 'style.css',
  '/script.js': 'script.js'
};

const MIME = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript'
};

function serveStatic(req, res) {
  const filename = STATIC_FILES[req.url];
  if (!filename) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not found');
    return;
  }
  const filePath = path.join(__dirname, filename);
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('Server error');
      return;
    }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(filePath)] || 'text/plain' });
    res.end(data);
  });
}

// --- Login endpoint -------------------------------------------------
function handleLogin(req, res) {
  let body = '';
  req.on('data', (chunk) => {
    body += chunk;
    if (body.length > 1e5) req.destroy(); // basic safety limit
  });
  req.on('end', () => {
    let parsed;
    try {
      parsed = JSON.parse(body || '{}');
    } catch (e) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ message: 'Invalid JSON.' }));
      return;
    }

    const { email, password } = parsed;

    // Server-side validation: the client-side checks in script.js can be
    // bypassed (disabled JS, curl, Postman), so every rule is enforced
    // again here. Never trust the client.
    if (!isValidEmail(email)) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ message: 'Invalid email format.' }));
      return;
    }
    if (!isValidPassword(password)) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ message: 'Password must be at least 8 characters.' }));
      return;
    }

    // Safe lookup: we find the user by exact value comparison in JS,
    // never by interpolating the input into a query string. A vulnerable
    // version of this (DO NOT DO THIS) would look like:
    //
    //   db.query(`SELECT * FROM users WHERE email = '${email}' AND password = '${password}'`)
    //
    // That lets an attacker send   ' OR '1'='1' --   as the email and log
    // in as anyone, because the quote characters escape the intended
    // string literal and change the query's logic. Comparing values in
    // code (or using parameterized queries against a real DB) prevents
    // that class of attack entirely.
    const user = users.find((u) => u.email === email);

    if (!user || !verifyPassword(password, user.passwordHash)) {
      // Same generic message whether the email or password was wrong,
      // so an attacker can't enumerate which accounts exist.
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ message: 'Invalid email or password.' }));
      return;
    }

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ email: user.email }));
  });
}

// --- Server -------------------------------------------------
const server = http.createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/api/login') {
    handleLogin(req, res);
  } else if (req.method === 'GET') {
    serveStatic(req, res);
  } else {
    res.writeHead(405, { 'Content-Type': 'text/plain' });
    res.end('Method not allowed');
  }
});

server.listen(PORT, () => {
  console.log(`Login form running at http://localhost:${PORT}`);
  console.log('Demo credentials: demo@juice-sh.op / Password123!');
});
