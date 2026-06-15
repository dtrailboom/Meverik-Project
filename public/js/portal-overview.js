const statusColors = {
  new: 'bg-blue-50 text-blue-600',
  in_progress: 'bg-amber-50 text-amber-600',
  in_review: 'bg-purple-50 text-purple-600',
  delivered: 'bg-green-50 text-green-600',
  blocked: 'bg-red-50 text-red-600',
};
const statusLabels = {
  new: 'New', in_progress: 'In progress',
  in_review: 'In review', delivered: 'Delivered', blocked: 'Blocked',
};

async function loadData() {
  try {
    const [meRes, ticketsRes] = await Promise.all([
      fetch('/portal/api/me'),
      fetch('/portal/api/tickets'),
    ]);
    if (meRes.status === 401) { window.location = '/auth/login'; return; }

    const { user } = await meRes.json();
    const { tickets } = await ticketsRes.json();
    const planName = user.plan ? user.plan.charAt(0).toUpperCase() + user.plan.slice(1) : 'No';

    document.getElementById('sidebar-name').textContent = user.name;
    document.getElementById('sidebar-business').textContent = user.businessName || 'My Business';
    document.getElementById('sidebar-plan').textContent = planName + ' plan';
    document.getElementById('token-count').textContent = user.tokenBalance + ' tokens left';
    document.getElementById('metric-tokens').textContent = user.tokenBalance;
    document.getElementById('metric-tokens-sub').textContent = `of ${user.planTokensPerMonth} this month`;

    const open = tickets.filter(t => t.status !== 'delivered').length;
    const inProgress = tickets.filter(t => t.status === 'in_progress').length;
    document.getElementById('metric-tickets').textContent = open;
    document.getElementById('metric-tickets-sub').textContent = inProgress > 0 ? `${inProgress} in progress` : 'none in progress';

    if (user.subscriptionRenewsAt) {
      const d = new Date(user.subscriptionRenewsAt);
      const days = Math.ceil((d - Date.now()) / (1000 * 60 * 60 * 24));
      document.getElementById('metric-renews').textContent = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
      document.getElementById('metric-renews-sub').textContent = `${days} days away`;
    } else {
      document.getElementById('metric-renews').textContent = '—';
      document.getElementById('metric-renews-sub').textContent = 'No active plan';
    }

    const pct = user.planTokensPerMonth > 0
      ? Math.round((user.tokenBalance / user.planTokensPerMonth) * 100)
      : 0;
    document.getElementById('token-bar').style.width = Math.min(pct, 100) + '%';
    document.getElementById('token-bar').className = `h-2 rounded-full transition-all ${pct < 20 ? 'bg-red-400' : pct < 50 ? 'bg-amber-400' : 'bg-teal'}`;
    document.getElementById('token-bar-label').textContent = `${user.tokenBalance} / ${user.planTokensPerMonth}`;

    if (user.websiteUrl) {
      document.getElementById('website-url').textContent = user.websiteUrl;
      document.getElementById('visit-website').href = user.websiteUrl.startsWith('http') ? user.websiteUrl : 'https://' + user.websiteUrl;
    } else {
      document.getElementById('website-url').textContent = 'Not set yet';
    }

    const container = document.getElementById('recent-tickets');
    if (tickets.length === 0) {
      container.innerHTML = `<div class="px-5 py-8 text-center">
        <p class="text-xs text-gray-400 mb-3">No requests yet</p>
        <a href="/portal/request" class="text-xs teal font-medium hover:underline">Submit your first request →</a>
      </div>`;
    } else {
      container.innerHTML = tickets.slice(0, 4).map(t => `
        <div class="flex items-center justify-between px-5 py-3 border-b border-gray-50 last:border-0">
          <div>
            <div class="text-sm font-medium text-gray-800">#${t.ticketNumber} · ${t.title}</div>
            <div class="text-xs text-gray-400 mt-0.5 capitalize">${t.complexity} · ${new Date(t.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</div>
          </div>
          <span class="text-xs font-medium px-2 py-1 rounded-full ${statusColors[t.status] || 'bg-gray-100 text-gray-500'}">${statusLabels[t.status] || t.status}</span>
        </div>
      `).join('');
    }

    if (new URLSearchParams(window.location.search).get('welcome') === '1') {
      document.getElementById('welcome-banner').classList.remove('hidden');
    }
  } catch (err) {
    console.error('Failed to load portal data:', err);
  }
}

async function logout() {
  await fetch('/auth/logout', { method: 'POST' });
  window.location = '/';
}

document.getElementById('logout-btn').addEventListener('click', logout);
document.getElementById('dismiss-welcome').addEventListener('click', function () {
  this.parentElement.remove();
});

loadData();
