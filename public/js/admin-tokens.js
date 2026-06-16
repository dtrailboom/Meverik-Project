async function load() {
  try {
    const res = await fetch('/admin/api/clients');
    if (res.status === 401 || res.status === 403) { window.location = '/auth/login'; return; }
    const { clients } = await res.json();
    const el = document.getElementById('token-balances');
    if (!clients.length) {
      el.innerHTML = '<div class="empty-state">No clients yet</div>';
      return;
    }
    el.innerHTML = clients.map(c => {
      const pct = c.planTokensPerMonth > 0 ? Math.round((c.tokenBalance / c.planTokensPerMonth) * 100) : 0;
      const barClass = pct === 0 ? 'is-empty' : pct < 30 ? 'is-low' : 'is-ok';
      return `<div class="balance-item">
        <div class="balance-item-main">
          <div class="balance-item-name">${c.businessName || c.name}</div>
          <div class="balance-item-meta">${c.plan || 'no plan'} · refills ${c.subscriptionRenewsAt ? new Date(c.subscriptionRenewsAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '—'}</div>
        </div>
        <div class="balance-item-side">
          <span class="balance-item-label">${c.tokenBalance}/${c.planTokensPerMonth}</span>
          <div class="progress progress-sm progress-fixed"><div class="progress-bar ${barClass}" style="width:${Math.min(pct, 100)}%"></div></div>
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
