const typeColors = { subscription: 'bg-purple-50 text-purple-600', topup: 'bg-green-50 text-green-600', token_refill: 'bg-blue-50 text-blue-600', refund: 'bg-amber-50 text-amber-600' };
const typeLabels = { subscription: 'Subscription', topup: 'Top-up', token_refill: 'Token refill', refund: 'Refund' };
const statusColors = { succeeded: '', failed: 'text-red-500', pending: 'text-amber-500' };

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
    el.innerHTML = '<div class="px-5 py-8 text-center text-sm text-gray-400">No transactions yet</div>';
    return;
  }
  el.innerHTML = transactions.map(t => `
    <div class="grid grid-cols-12 gap-4 px-5 py-3.5 border-b border-gray-50 last:border-0 items-center text-sm">
      <div class="col-span-5 font-medium text-gray-700">${t.description || '—'}</div>
      <div class="col-span-3"><span class="text-xs font-medium px-2 py-1 rounded-full ${typeColors[t.type] || 'bg-gray-100 text-gray-500'}">${typeLabels[t.type] || t.type}</span></div>
      <div class="col-span-2 ${statusColors[t.status] || ''}">${t.amountEur ? '€' + t.amountEur.toFixed(2) : t.tokensAdded ? '+' + t.tokensAdded + ' tokens' : '—'}</div>
      <div class="col-span-2 text-xs text-gray-400">${new Date(t.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
    </div>`).join('');
}

async function logout() {
  await fetch('/auth/logout', { method: 'POST' });
  window.location = '/';
}

document.getElementById('logout-btn').addEventListener('click', logout);

load();
