async function load() {
  try {
    const res = await fetch('/admin/api/clients');
    if (res.status === 401 || res.status === 403) { window.location = '/auth/login'; return; }
    const { clients } = await res.json();
    const el = document.getElementById('token-balances');
    if (!clients.length) {
      el.innerHTML = '<div class="px-5 py-8 text-center text-sm text-gray-400">No clients yet</div>';
      return;
    }
    el.innerHTML = clients.map(c => {
      const pct = c.planTokensPerMonth > 0 ? Math.round((c.tokenBalance / c.planTokensPerMonth) * 100) : 0;
      const barColor = pct === 0 ? 'bg-red-400' : pct < 30 ? 'bg-amber-400' : 'bg-green-500';
      return `<div class="flex items-center gap-3 px-5 py-3 border-b border-gray-50 last:border-0">
        <div class="flex-1 min-w-0">
          <div class="text-sm font-medium text-gray-700 truncate">${c.businessName || c.name}</div>
          <div class="text-xs text-gray-400 capitalize">${c.plan || 'no plan'} · refills ${c.subscriptionRenewsAt ? new Date(c.subscriptionRenewsAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '—'}</div>
        </div>
        <div class="flex items-center gap-2">
          <span class="text-xs text-gray-400 w-10 text-right">${c.tokenBalance}/${c.planTokensPerMonth}</span>
          <div class="w-16 bg-gray-100 rounded-full h-1.5"><div class="${barColor} h-1.5 rounded-full" style="width:${Math.min(pct, 100)}%"></div></div>
        </div>
      </div>`;
    }).join('');
  } catch (e) {
    console.error(e);
  }
}

function savePricing() {
  document.getElementById('save-msg').classList.remove('hidden');
  setTimeout(() => document.getElementById('save-msg').classList.add('hidden'), 3000);
}

async function logout() {
  await fetch('/auth/logout', { method: 'POST' });
  window.location = '/';
}

document.getElementById('logout-btn').addEventListener('click', logout);
document.getElementById('save-pricing').addEventListener('click', savePricing);

load();
