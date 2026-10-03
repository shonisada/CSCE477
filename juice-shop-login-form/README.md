# Juice Shop Login Form (Secure Mini Clone)

A small HTML/CSS/JavaScript login form styled after OWASP Juice Shop's
login page, built as a security-coursework exercise. It includes a
minimal, dependency-free Node backend so the "server-side validation"
requirement is real, not just a comment.

## What it does

- Renders an email + password login form (`index.html` / `style.css`).
- **Client-side validation** (`script.js`): blocks empty submissions,
  requires the email to contain `@`, and requires the password to be
  at least 8 characters, before anything is sent to the server.
- **Server-side validation** (`server.js`): re-checks the same two
  rules independently (client-side checks can always be bypassed by
  disabling JS or calling the API directly), returning `400` on
  invalid input.
- **Secure auth practices**:
  - Passwords are hashed with a salted `scrypt` KDF (Node's built-in
    `crypto` module — same category of algorithm as bcrypt/argon2),
    never stored or compared in plain text.
  - The user lookup compares values in code rather than building a SQL
    string from user input, so there's no injectable query (the file
    has a comment showing what the vulnerable version would look like
    and why it's dangerous).
  - Login failures return one generic "Invalid email or password"
    message, so the API can't be used to enumerate which emails have
    accounts.
  - Password comparison uses `crypto.timingSafeEqual` to avoid timing
    side-channels.
- Demo account: `demo@juice-sh.op` / `Password123!`

## Running it

No npm install needed — it only uses Node's built-in modules.

```bash
node server.js
```

Then open `http://localhost:3001` in a browser.

## Project structure

```
index.html   - markup for the login form
style.css    - styling
script.js    - client-side validation + calls the login API
server.js    - Node http server: serves the static files and
               validates/authenticates POST /api/login
package.json - metadata only; no external dependencies
```
