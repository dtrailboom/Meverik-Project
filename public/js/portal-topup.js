let selectedPack = 'medium';
let tokenBalance = 0;
const packs = { small: { tokens: 5, price: '€9' }, medium: { tokens: 15, price: '€19' }, large: { tokens: 35, price: '€39' } };

async function load() {
  const res = await fetch('/portal/api/me');
  if (res.status === 401) { window.location = '/auth/login'; return; }
  const { user } = await res.json();
  tokenBalance = user.tokenBalance;
  document.getElementById('sidebar-name').textContent = user.name;
  document.getElementById('sidebar-business').textContent = user.businessName || 'My Business';
  document.getElementById('sidebar-plan').textContent = (user.plan ? user.plan.charAt(0).toUpperCase() + user.plan.slice(1) : 'No') + ' Plan';
  document.getElementById('token-count').textContent = user.tokenBalance + ' tokens left';
  document.getElementById('curr-balance').textContent = user.tokenBalance + ' tokens';
  updatePreview();
  if (new URLSearchParams(window.location.search).get('success') === '1') {
    document.getElementById('success-banner').classList.remove('hidden');
  }
}

function selectPack(p) {
  selectedPack = p;
  document.querySelectorAll('.pack-card').forEach(c => {
    c.classList.remove('selected', 'border-2', 'border-teal');
    c.classList.add('border', 'border-gray-200');
  });
  const sel = document.querySelector(`[data-pack="${p}"]`);
  sel.classList.add('selected', 'border-2', 'border-teal');
  sel.classList.remove('border', 'border-gray-200');
  updatePreview();
}

function updatePreview() {
  const d = packs[selectedPack];
  document.getElementById('adding-tokens').textContent = '+' + d.tokens + ' tokens';
  document.getElementById('balance-after').textContent = (tokenBalance + d.tokens) + ' tokens';
  document.getElementById('charge-total').textContent = d.price;
}

async function startCheckout() {
  const btn = document.getElementById('pay-btn');
  btn.disabled = true;
  btn.innerHTML = '<svg class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg> Redirecting…';
  try {
    const res = await fetch('/portal/api/topup', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pack: selectedPack }) });
    const data = await res.json();
    if (res.ok && data.checkoutUrl) { window.location.href = data.checkoutUrl; }
    else { alert(data.error || 'Failed to start checkout.'); }
  } catch (e) {
    alert('Something went wrong.');
  } finally {
    btn.disabled = false;
    btn.innerHTML = 'Pay with Stripe →';
  }
}

async function logout() {
  await fetch('/auth/logout', { method: 'POST' });
  window.location = '/';
}

document.getElementById('logout-btn').addEventListener('click', logout);
document.getElementById('pay-btn').addEventListener('click', startCheckout);
document.querySelectorAll('.pack-card').forEach(card => {
  card.addEventListener('click', () => selectPack(card.dataset.pack));
});

load();
