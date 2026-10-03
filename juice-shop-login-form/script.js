// script.js
// Client-side validation for the login form.
// NOTE: this is a UX convenience only — it can be bypassed by disabling JS
// or calling the API directly, so the server re-validates everything below.

const form = document.getElementById('loginForm');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const emailError = document.getElementById('emailError');
const passwordError = document.getElementById('passwordError');
const statusMsg = document.getElementById('statusMsg');

function isValidEmail(value) {
  // Matches the assignment spec ("contains @") plus a basic shape check
  // so obviously malformed input doesn't pass client-side.
  return typeof value === 'string' && value.includes('@') && value.length > 3;
}

function isValidPassword(value) {
  return typeof value === 'string' && value.length >= 8;
}

function validateForm() {
  let valid = true;
  emailError.textContent = '';
  passwordError.textContent = '';
  emailInput.classList.remove('invalid');
  passwordInput.classList.remove('invalid');

  const email = emailInput.value.trim();
  const password = passwordInput.value;

  if (email.length === 0) {
    emailError.textContent = 'Email is required.';
    emailInput.classList.add('invalid');
    valid = false;
  } else if (!isValidEmail(email)) {
    emailError.textContent = 'Enter a valid email address (must contain "@").';
    emailInput.classList.add('invalid');
    valid = false;
  }

  if (password.length === 0) {
    passwordError.textContent = 'Password is required.';
    passwordInput.classList.add('invalid');
    valid = false;
  } else if (!isValidPassword(password)) {
    passwordError.textContent = 'Password must be at least 8 characters.';
    passwordInput.classList.add('invalid');
    valid = false;
  }

  return valid;
}

form.addEventListener('submit', async function (event) {
  event.preventDefault();
  statusMsg.textContent = '';
  statusMsg.className = 'status';

  if (!validateForm()) {
    return; // block empty / malformed submissions client-side
  }

  const email = emailInput.value.trim();
  const password = passwordInput.value;

  try {
    const response = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (response.ok) {
      // Safe: textContent never interprets the string as HTML/script,
      // so a value like <img src=x onerror=alert(1)> is shown as plain text.
      statusMsg.textContent = 'Welcome back, ' + data.email;
      statusMsg.classList.add('success');
    } else {
      statusMsg.textContent = data.message || 'Login failed.';
      statusMsg.classList.add('error');
    }
  } catch (err) {
    statusMsg.textContent = 'Could not reach the server.';
    statusMsg.classList.add('error');
  }
});
