function showError(msg) {
  const b = document.getElementById('error-banner');
  b.textContent = msg;
  b.classList.remove('hidden');
  document.getElementById('success-banner').classList.add('hidden');
}

function showSuccess(msg) {
  const b = document.getElementById('success-banner');
  b.textContent = msg;
  b.classList.remove('hidden');
  document.getElementById('error-banner').classList.add('hidden');
}

function hideAll() {
  document.getElementById('error-banner').classList.add('hidden');
  document.getElementById('success-banner').classList.add('hidden');
}

function setLoading(loading) {
  const btn = document.getElementById('submit-btn');
  btn.disabled = loading;
  btn.innerHTML = loading
    ? '<svg class="spinner" fill="none" viewBox="0 0 24 24"><circle class="spinner-track" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="spinner-head" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg> Sending…'
    : 'Send reset link';
}

async function doForgotPassword() {
  const email = document.getElementById('email').value.trim();

  if (!email || !/\S+@\S+\.\S+/.test(email)) return showError('Please enter a valid email address.');

  hideAll();
  setLoading(true);
  try {
    const res  = await fetch('/auth/forgot-password', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ email }),
    });
    const data = await res.json();
    if (res.ok && data.success) {
      showSuccess('If that email exists, a reset link has been sent. Check your inbox.');
      document.getElementById('email').value = '';
    } else {
      showError(data.error || 'Something went wrong. Please try again.');
    }
  } catch (err) {
    showError('Something went wrong. Please try again.');
  } finally {
    setLoading(false);
  }
}

document.getElementById('submit-btn').addEventListener('click', doForgotPassword);

document.getElementById('email').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') doForgotPassword();
});
