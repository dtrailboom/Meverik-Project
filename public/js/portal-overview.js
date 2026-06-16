const statusColors = {
  new: 'badge-blue',
  in_progress: 'badge-amber',
  in_review: 'badge-purple',
  delivered: 'badge-green',
  blocked: 'badge-red',
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
    const bar = document.getElementById('token-bar');
    bar.style.width = Math.min(pct, 100) + '%';
    bar.className = 'progress-bar' + (pct < 20 ? ' is-empty' : pct < 50 ? ' is-low' : '');
    document.getElementById('token-bar-label').textContent = `${user.tokenBalance} / ${user.planTokensPerMonth}`;

    if (user.websiteUrl) {
      document.getElementById('website-url').textContent = user.websiteUrl;
      document.getElementById('visit-website').href = user.websiteUrl.startsWith('http') ? user.websiteUrl : 'https://' + user.websiteUrl;
    } else {
      document.getElementById('website-url').textContent = 'Not set yet';
    }

    const container = document.getElementById('recent-tickets');
    if (tickets.length === 0) {
      container.innerHTML = `<div class="empty-state">
        <p>No requests yet</p>
        <a href="/portal/request" class="link-accent">Submit your first request →</a>
      </div>`;
    } else {
      container.innerHTML = tickets.slice(0, 4).map(t => `
        <div class="ticket-item">
          <div>
            <div class="ticket-item-title">#${t.ticketNumber} · ${t.title}</div>
            <div class="ticket-item-meta">${t.complexity} · ${new Date(t.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</div>
          </div>
          <span class="badge ${statusColors[t.status] || 'badge-gray'}">${statusLabels[t.status] || t.status}</span>
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
