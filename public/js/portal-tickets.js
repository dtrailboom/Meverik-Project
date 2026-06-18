const statusColors = { new: 'badge-blue', in_progress: 'badge-amber', in_review: 'badge-purple', delivered: 'badge-green', blocked: 'badge-red' };
const statusLabels = { new: 'New', in_progress: 'In progress', in_review: 'In review', delivered: 'Delivered', blocked: 'Blocked' };
let allTickets = [];

async function load() {
  const [meRes, tRes] = await Promise.all([fetch('/portal/api/me', { cache: 'no-store' }), fetch('/portal/api/tickets', { cache: 'no-store' })]);
  if (meRes.status === 401) { window.location = '/auth/login'; return; }
  const { user } = await meRes.json();
  const { tickets } = await tRes.json();
  allTickets = tickets;
  document.getElementById('sidebar-name').textContent = user.name;
  document.getElementById('sidebar-business').textContent = user.businessName || 'My Business';
  document.getElementById('sidebar-plan').textContent = (user.plan ? user.plan.charAt(0).toUpperCase() + user.plan.slice(1) : 'No') + ' Plan';
  renderTickets(tickets);
}

function filterTickets() {
  const f = document.getElementById('filter').value;
  const filtered = f === 'all' ? allTickets : f === 'open' ? allTickets.filter(t => t.status !== 'delivered') : allTickets.filter(t => t.status === 'delivered');
  renderTickets(filtered);
}

function renderTickets(tickets) {
  const el = document.getElementById('tickets-list');
  if (!tickets.length) {
    el.innerHTML = '<div class="empty-state"><p>No tickets yet</p><a href="/portal/request" class="link-accent">Submit your first request →</a></div>';
    return;
  }
  el.innerHTML = tickets.map(t => `
    <div class="dgrid dgrid-row">
      <div class="col-request"><div class="cell-title">#${t.ticketNumber} · ${t.title}</div></div>
      <div class="col-type"><span class="cell-type">${t.complexity}</span></div>
      <div class="col-status"><span class="badge ${statusColors[t.status] || 'badge-gray'}">${statusLabels[t.status] || t.status}</span></div>
      <div class="col-tokens"><span class="cell-muted">${t.tokenCost} token${t.tokenCost > 1 ? 's' : ''}</span></div>
      <div class="col-date">
        <span class="cell-muted">${new Date(t.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>${t.status === 'new' ? `<button data-id="${t._id}" class="cancel-btn link-danger">Cancel</button>` : ''}
      </div>
      ${t.adminReply ? `<div class="ticket-reply"><div class="detail-label">Reply from the team</div><div class="detail-text"></div></div>` : ''}
    </div>`).join('');

  // Fill reply text via textContent (XSS-safe). Order matches the rendered array.
  const rows = el.querySelectorAll('.dgrid-row');
  rows.forEach((row, i) => {
    const r = row.querySelector('.ticket-reply .detail-text');
    if (r) r.textContent = tickets[i].adminReply || '';
  });

  document.querySelectorAll('.cancel-btn').forEach(btn => {
    btn.addEventListener('click', () => cancelTicket(btn.dataset.id));
  });
}

async function cancelTicket(id) {
  if (!confirm('Cancel this request? Your tokens will be refunded.')) return;
  try {
    const res = await fetch('/portal/api/tickets/' + id, { method: 'DELETE' });
    if (res.ok) load();
    else { const d = await res.json(); alert(d.error || 'Failed to cancel.'); }
  } catch (e) {
    alert('Something went wrong.');
  }
}

async function logout() {
  await fetch('/auth/logout', { method: 'POST' });
  window.location = '/';
}

document.getElementById('logout-btn').addEventListener('click', logout);
document.getElementById('filter').addEventListener('change', filterTickets);

load();
