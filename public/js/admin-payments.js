let allTx = [];
const typeColors = {
  subscription: 'badge-purple',
  topup: 'badge-green',
  token_refill: 'badge-blue',
  refund: 'badge-amber',
};
const typeLabels = {
  subscription: 'Subscription',
  topup: 'Top-up',
  token_refill: 'Refill',
  refund: 'Refund',
};

async function load() {
  try {
    const res = await fetch('/admin/api/transactions');
    if (res.status === 401 || res.status === 403) {
      window.location = '/auth/login';
      return;
    }
    const { transactions } = await res.json();
    allTx = transactions;

    const totalRevenue = transactions.filter(t => t.status === 'succeeded' && t.amountEur).reduce((s, t) => s + t.amountEur, 0);
    const subRevenue = transactions.filter(t => t.type === 'subscription' && t.status === 'succeeded' && t.amountEur).reduce((s, t) => s + t.amountEur, 0);
    const topupRevenue = transactions.filter(t => t.type === 'topup' && t.status === 'succeeded' && t.amountEur).reduce((s, t) => s + t.amountEur, 0);
    const failed = transactions.filter(t => t.status === 'failed').length;

    document.getElementById('m-total').textContent = '€' + totalRevenue.toFixed(2);
    document.getElementById('m-subs').textContent = '€' + subRevenue.toFixed(2);
    document.getElementById('m-topups').textContent = '€' + topupRevenue.toFixed(2);
    document.getElementById('m-failed').textContent = failed;

    renderTx(transactions);
  } catch (e) {
    console.error(e);
  }
}

function filterTx() {
  const type = document.getElementById('type-filter').value;
  renderTx(type ? allTx.filter(t => t.type === type) : allTx);
}

function renderTx(txs) {
  const el = document.getElementById('tx-list');
  if (!txs.length) {
    el.innerHTML = '<div class="empty-state">No transactions found</div>';
    return;
  }
  el.innerHTML = txs.map(t => {
    const statusClass = t.status === 'failed' ? 'is-failed' : t.status === 'pending' ? 'is-pending' : '';
    const amount = t.amountEur ? '€' + t.amountEur.toFixed(2) : t.tokensAdded ? '+' + t.tokensAdded + ' tkn' : '—';
    return `
    <div class="dgrid dgrid-row">
      <div class="col-client"><div class="cell-strong">${t.user?.businessName || t.user?.name || '—'}</div><div class="client-email">${t.user?.email || ''}</div></div>
      <div class="col-desc"><span class="cell-desc">${t.description || '—'}</span></div>
      <div class="col-type"><span class="badge ${typeColors[t.type] || 'badge-gray'}">${typeLabels[t.type] || t.type}</span></div>
      <div class="col-amount"><span class="cell-amount ${t.status === 'failed' ? 'is-danger' : ''}">${amount}</span></div>
      <div class="col-status"><span class="tx-status ${statusClass}">${t.status}</span></div>
      <div class="col-date"><span class="cell-muted">${new Date(t.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span></div>
    </div>`;
  }).join('');

  document.querySelectorAll('#tx-list .dgrid-row').forEach(row => {
    row.addEventListener('click', () => row.classList.toggle('is-open'));
  });
}

async function logout() {
  await fetch('/auth/logout', { method: 'POST' });
  window.location = '/';
}

// Exchange rates
let rates = {};

async function fetchRates() {
  try {
    const res = await fetch('/admin/api/stats/exchange-rates');
    if (!res.ok) throw new Error('API error: ' + res.status);
    const data = await res.json();
    rates = data.rates;
    document.getElementById('er-status').textContent = 'Live · ' + data.date;

    const pinned = [
      { code: 'USD', flag: '🇺🇸' }, { code: 'GBP', flag: '🇬🇧' }, { code: 'CHF', flag: '🇨🇭' },
      { code: 'JPY', flag: '🇯🇵' }, { code: 'CAD', flag: '🇨🇦' }, { code: 'AUD', flag: '🇦🇺' },
    ];
    document.getElementById('er-pinned').innerHTML = pinned.map(c => `
      <div class="rate-cell">
        <div class="rate-flag">${c.flag}</div>
        <div class="rate-code">${c.code}</div>
        <div class="rate-value">${rates[c.code]?.toFixed(4) || '—'}</div>
        <div class="rate-conv">1 EUR = ${rates[c.code]?.toFixed(2) || '—'} ${c.code}</div>
      </div>`).join('');

    document.getElementById('er-date').textContent = 'Rates as of ' + data.date + ' · exchangerate-api.com';
    updateConverter();
  } catch (e) {
    document.getElementById('er-status').textContent = 'Offline';
  }
}

function updateConverter() {
  const amount = parseFloat(document.getElementById('er-amount').value) || 0;
  const currency = document.getElementById('er-currency').value;
  const rate = rates[currency];
  if (!rate) return;
  document.getElementById('er-from-label').textContent = `€${amount.toFixed(2)} EUR =`;
  document.getElementById('er-to-val').textContent = `${(amount * rate).toFixed(2)} ${currency}`;
  document.getElementById('er-rate-val').textContent = `1 EUR = ${rate.toFixed(4)} ${currency}`;
}

// Event listeners
document.getElementById('logout-btn').addEventListener('click', logout);
document.getElementById('type-filter').addEventListener('change', filterTx);
document.getElementById('er-amount').addEventListener('input', updateConverter);
document.getElementById('er-currency').addEventListener('change', updateConverter);

// Init
load();
fetchRates();
