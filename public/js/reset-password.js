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
    ? '<svg class="spinner" fill="none" viewBox="0 0 24 24"><circle class="spinner-track" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="spinner-head" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg> Updating…'
    : 'Update password';
}

// Token lives in the last path segment: /auth/reset-password/:token
function getTokenFromUrl() {
  const parts = window.location.pathname.split('/');
  return parts[parts.length - 1] || '';
}

async function doResetPassword() {
  const password = document.getElementById('password').value;
  const confirm  = document.getElementById('confirm').value;
  const token    = getTokenFromUrl();

  if (!token) return showError('Invalid reset link. Please request a new one.');
  if (!password || password.length < 8) return showError('Password must be at least 8 characters.');
  if (password !== confirm) return showError('Passwords do not match.');

  hideAll();
  setLoading(true);
  try {
    const res  = await fetch(`/auth/reset-password/${token}`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ password }),
    });
    const data = await res.json();
    if (res.ok && data.success) {
      showSuccess('Password updated! Redirecting to login…');
      document.getElementById('submit-btn').disabled = true;
      setTimeout(() => { window.location.href = '/auth/login'; }, 2000);
    } else {
      showError(data.error || 'Something went wrong. Please try again.');
    }
  } catch (err) {
    showError('Something went wrong. Please try again.');
  } finally {
    setLoading(false);
  }
}

document.getElementById('toggle-password').addEventListener('click', () => {
  const inp = document.getElementById('password');
  inp.type  = inp.type === 'password' ? 'text' : 'password';
});

document.getElementById('submit-btn').addEventListener('click', doResetPassword);

['password', 'confirm'].forEach((id) => {
  document.getElementById(id).addEventListener('keydown', (e) => {
    if (e.key === 'Enter') doResetPassword();
  });
});
