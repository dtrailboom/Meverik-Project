function showError(msg) {
  const b = document.getElementById('error-banner');
  b.textContent = msg;
  b.classList.remove('hidden');
}

function hideError() {
  document.getElementById('error-banner').classList.add('hidden');
}

function setLoading(loading) {
  const btn = document.getElementById('login-btn');
  btn.disabled = loading;
  btn.innerHTML = loading
    ? '<svg class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg> Logging in…'
    : 'Log in';
}

async function doLogin() {
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;

  if (!email || !/\S+@\S+\.\S+/.test(email)) return showError('Please enter a valid email address.');
  if (!password) return showError('Please enter your password.');

  hideError();
  setLoading(true);
  try {
    const res = await fetch('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (res.ok && data.success) {
      window.location.href = data.redirect || '/portal';
    } else {
      showError(data.error || 'Login failed. Please try again.');
    }
  } catch (err) {
    showError('Something went wrong. Please try again.');
  } finally {
    setLoading(false);
  }
}

document.getElementById('toggle-password').addEventListener('click', () => {
  const inp = document.getElementById('password');
  inp.type = inp.type === 'password' ? 'text' : 'password';
});

document.getElementById('login-btn').addEventListener('click', doLogin);

// Submit on Enter
['email', 'password'].forEach(id => {
  document.getElementById(id).addEventListener('keydown', (e) => {
    if (e.key === 'Enter') doLogin();
  });
});
