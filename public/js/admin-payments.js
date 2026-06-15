let allTx = [];
const typeColors = {
  subscription: 'bg-purple-50 text-purple-600',
  topup: 'bg-green-50 text-green-600',
  token_refill: 'bg-blue-50 text-blue-600',
  refund: 'bg-amber-50 text-amber-600',
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
    el.innerHTML = '<div class="px-5 py-10 text-center text-sm text-gray-400">No transactions found</div>';
    return;
  }
  el.innerHTML = txs.map(t => `
    <div class="grid grid-cols-12 gap-3 px-5 py-3.5 border-b border-gray-50 last:border-0 items-center text-sm hover:bg-gray-50 transition-all">
      <div class="col-span-3"><div class="font-medium text-gray-700">${t.user?.businessName || t.user?.name || '—'}</div><div class="text-xs text-gray-400">${t.user?.email || ''}</div></div>
      <div class="col-span-4 text-gray-600">${t.description || '—'}</div>
      <div class="col-span-2"><span class="text-xs font-medium px-2 py-1 rounded-full ${typeColors[t.type] || 'bg-gray-100 text-gray-500'}">${typeLabels[t.type] || t.type}</span></div>
      <div class="col-span-1 font-medium ${t.status === 'failed' ? 'text-red-500' : ''}">${t.amountEur ? '€' + t.amountEur.toFixed(2) : t.tokensAdded ? '+' + t.tokensAdded + ' tkn' : '—'}</div>
      <div class="col-span-1"><span class="text-xs ${t.status === 'failed' ? 'text-red-500' : t.status === 'pending' ? 'text-amber-500' : 'text-green-600'} capitalize">${t.status}</span></div>
      <div class="col-span-1 text-xs text-gray-400">${new Date(t.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</div>
    </div>`).join('');
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
      <div class="bg-gray-50 rounded-lg p-3">
        <div class="text-base mb-1">${c.flag}</div>
        <div class="text-xs text-gray-400">${c.code}</div>
        <div class="text-sm font-medium text-gray-700">${rates[c.code]?.toFixed(4) || '—'}</div>
        <div class="text-xs text-gray-400">1 EUR = ${rates[c.code]?.toFixed(2) || '—'} ${c.code}</div>
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
