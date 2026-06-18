const typeColors = { subscription: 'badge-purple', topup: 'badge-green', token_refill: 'badge-blue', refund: 'badge-amber' };
const typeLabels = { subscription: 'Subscription', topup: 'Top-up', token_refill: 'Token refill', refund: 'Refund' };
const statusMods = { succeeded: '', failed: 'is-failed', pending: 'is-pending' };

async function load() {
  const [meRes, txRes] = await Promise.all([fetch('/portal/api/me'), fetch('/portal/api/transactions')]);
  if (meRes.status === 401) { window.location = '/auth/login'; return; }
  const { user } = await meRes.json();
  const { transactions } = await txRes.json();

  document.getElementById('sidebar-name').textContent = user.name;
  document.getElementById('sidebar-business').textContent = user.businessName || 'My Business';
  document.getElementById('sidebar-plan').textContent = (user.plan ? user.plan.charAt(0).toUpperCase() + user.plan.slice(1) : 'No') + ' Plan';

  const planNames = { starter: 'Starter', growth: 'Growth', pro: 'Pro' };
  const planPrices = { starter: '€29/month · 10 tokens/mo', growth: '€59/month · 25 tokens/mo', pro: '€99/month · 60 tokens/mo' };
  document.getElementById('plan-name').textContent = planNames[user.plan] || 'No plan';
  if (user.plan) {
    const renews = user.subscriptionRenewsAt ? new Date(user.subscriptionRenewsAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
    document.getElementById('plan-details').textContent = (planPrices[user.plan] || '') + ' · renews ' + renews;
  } else {
    document.getElementById('plan-details').textContent = 'No active subscription';
  }
  if (user.subscriptionStatus === 'past_due') {
    document.getElementById('past-due-banner').classList.remove('hidden');
  }

  const el = document.getElementById('transactions-list');
  if (!transactions.length) {
    el.innerHTML = '<div class="empty-state">No transactions yet</div>';
    return;
  }
  el.innerHTML = transactions.map(t => `
    <div class="dgrid dgrid-row">
      <div class="col-desc"><span class="cell-strong">${t.description || '—'}</span></div>
      <div class="col-type"><span class="badge ${typeColors[t.type] || 'badge-gray'}">${typeLabels[t.type] || t.type}</span></div>
      <div class="col-amount"><span class="bill-amount ${statusMods[t.status] || ''}">${t.amountEur ? '€' + t.amountEur.toFixed(2) : t.tokensAdded ? '+' + t.tokensAdded + ' tokens' : '—'}</span></div>
      <div class="col-date"><span class="cell-muted">${new Date(t.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span></div>
    </div>`).join('');
}

async function logout() {
  await fetch('/auth/logout', { method: 'POST' });
  window.location = '/';
}

document.getElementById('logout-btn').addEventListener('click', logout);

load();
