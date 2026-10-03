# Part 2: Front-End Form Write-up

I built a Juice Shop-style login page (`index.html`/`style.css`) with email and password fields. `script.js` does client-side validation: it blocks empty submissions and checks the email contains "@" and the password is ≥8 characters, showing inline errors and never calling the API until both pass. On submit it POSTs JSON to `/api/login`.

The backend (`server.js`) is a dependency-free Node `http` server that re-validates the same two rules server-side (client checks are trivially bypassed via curl/disabled JS), looks up the user by direct value comparison (no string-built SQL), and verifies passwords with a salted `scrypt` hash via `crypto.timingSafeEqual` — never plain text. Failed logins return one generic message to prevent account enumeration.

Repo: https://github.com/shonisada/CSCE477
