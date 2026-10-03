# Part 1: Secure Feature Design

Testing Juice Shop live, I confirmed two exploits: (1) **SQL injection login bypass** — submitting `' OR 1=1--` as the email logged me in as admin, because the query concatenated raw input into SQL. (2) **DOM-based XSS** — the search field (`?q=<img src=x onerror=alert('xss')>`) rendered my payload unescaped into the results title. (3) **Authentication bypass via weak hashing** — Juice Shop uses unsalted MD5, making credential-stuffing from leaked hashes trivial.

**Mitigations:** use parameterized queries/an ORM (never string-concatenated SQL) to stop injection; escape/sanitize all user input before rendering (or use a framework that auto-escapes, like React) to stop XSS; and hash passwords with bcrypt, e.g. `bcrypt.hash(password, 12)` and `bcrypt.compare(input, hash)`, which salts automatically and resists brute-forcing. Together these close the exact paths I exploited.
