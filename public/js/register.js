let selectedPlan = 'growth';

// Pre-select plan from URL param e.g. /register?plan=pro
const urlPlan = new URLSearchParams(window.location.search).get('plan');
if (urlPlan && ['starter', 'growth', 'pro'].includes(urlPlan)) {
  selectedPlan = urlPlan;
  document.querySelectorAll('.plan-card').forEach(c => c.classList.remove('selected'));
  document.querySelector(`[data-plan="${urlPlan}"]`).classList.add('selected');
}

function selectPlan(plan) {
  selectedPlan = plan;
  document.querySelectorAll('.plan-card').forEach(c => c.classList.remove('selected'));
  document.querySelector(`[data-plan="${plan}"]`).classList.add('selected');
}

function showError(msg) {
  const b = document.getElementById('error-banner');
  b.textContent = msg;
  b.classList.remove('hidden');
  b.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function hideError() {
  document.getElementById('error-banner').classList.add('hidden');
}

function setLoading(loading) {
  const btn = document.getElementById('submit-btn');
  btn.disabled = loading;
  btn.innerHTML = loading
    ? '<svg class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg> Redirecting to Stripe…'
    : 'Pay with Stripe →';
}

// Plan selection
document.querySelectorAll('.plan-card').forEach(card => {
  card.addEventListener('click', () => selectPlan(card.dataset.plan));
});

// Password toggle
document.getElementById('toggle-password').addEventListener('click', () => {
  const inp = document.getElementById('password');
  inp.type = inp.type === 'password' ? 'text' : 'password';
});

// Password strength
document.getElementById('password').addEventListener('input', function () {
  const val = this.value;
  let score = 0;
  if (val.length >= 8) score++;
  if (/[A-Z]/.test(val)) score++;
  if (/[0-9]/.test(val)) score++;
  if (/[^A-Za-z0-9]/.test(val)) score++;

  const colors = ['', 'bg-red-400', 'bg-orange-400', 'bg-yellow-400', 'bg-green-500'];
  const labels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
  for (let i = 1; i <= 4; i++) {
    const bar = document.getElementById(`bar-${i}`);
    bar.className = `h-1 flex-1 rounded ${i <= score ? colors[score] : 'bg-gray-200'}`;
  }
  document.getElementById('strength-label').textContent = val.length > 0 ? labels[score] : '';
});

// Step navigation
document.getElementById('next-btn').addEventListener('click', () => {
  const name = document.getElementById('name').value.trim();
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;

  if (!name) return showError('Please enter your full name.');
  if (!email || !/\S+@\S+\.\S+/.test(email)) return showError('Please enter a valid email address.');
  if (password.length < 8) return showError('Password must be at least 8 characters.');

  hideError();
  document.getElementById('step-1').classList.add('hidden');
  document.getElementById('step-2').classList.remove('hidden');
  document.getElementById('step-num').textContent = '2';
  document.getElementById('step-text').textContent = 'Choose your plan';
  document.getElementById('step-count').textContent = 'Step 2 of 2';
});

document.getElementById('back-btn').addEventListener('click', () => {
  document.getElementById('step-2').classList.add('hidden');
  document.getElementById('step-1').classList.remove('hidden');
  document.getElementById('step-num').textContent = '1';
  document.getElementById('step-text').textContent = 'Your details';
  document.getElementById('step-count').textContent = 'Step 1 of 2';
});

// Submit
document.getElementById('submit-btn').addEventListener('click', async () => {
  hideError();
  setLoading(true);
  try {
    const res = await fetch('/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: document.getElementById('name').value.trim(),
        businessName: document.getElementById('business').value.trim(),
        email: document.getElementById('email').value.trim(),
        password: document.getElementById('password').value,
        plan: selectedPlan,
      }),
    });
    const data = await res.json();
    if (res.ok && data.checkoutUrl) {
      window.location.href = data.checkoutUrl;
    } else {
      showError(data.error || 'Registration failed. Please try again.');
    }
  } catch (err) {
    showError('Something went wrong. Please try again.');
  } finally {
    setLoading(false);
  }
});
