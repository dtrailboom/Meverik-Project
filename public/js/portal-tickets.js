const statusColors = { new: 'bg-blue-50 text-blue-600', in_progress: 'bg-amber-50 text-amber-600', in_review: 'bg-purple-50 text-purple-600', delivered: 'bg-green-50 text-green-600', blocked: 'bg-red-50 text-red-600' };
const statusLabels = { new: 'New', in_progress: 'In progress', in_review: 'In review', delivered: 'Delivered', blocked: 'Blocked' };
let allTickets = [];

async function load() {
  const [meRes, tRes] = await Promise.all([fetch('/portal/api/me'), fetch('/portal/api/tickets')]);
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
    el.innerHTML = '<div class="px-5 py-10 text-center"><p class="text-sm text-gray-400 mb-3">No tickets yet</p><a href="/portal/request" class="text-sm teal font-medium hover:underline">Submit your first request →</a></div>';
    return;
  }
  el.innerHTML = tickets.map(t => `
    <div class="grid grid-cols-12 gap-4 px-5 py-3.5 border-b border-gray-50 last:border-0 items-center text-sm hover:bg-gray-50 transition-all">
      <div class="col-span-5"><div class="font-medium text-gray-800">#${t.ticketNumber} · ${t.title}</div></div>
      <div class="col-span-2"><span class="capitalize text-xs text-gray-500">${t.complexity}</span></div>
      <div class="col-span-2"><span class="text-xs font-medium px-2 py-1 rounded-full ${statusColors[t.status] || 'bg-gray-100 text-gray-500'}">${statusLabels[t.status] || t.status}</span></div>
      <div class="col-span-2"><span class="text-xs text-gray-400">${t.tokenCost} token${t.tokenCost > 1 ? 's' : ''}</span></div>
      <div class="col-span-1">${t.status === 'new'
        ? `<button data-id="${t._id}" class="cancel-btn text-xs text-red-500 hover:underline">Cancel</button>`
        : `<span class="text-xs text-gray-400">${new Date(t.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>`}</div>
    </div>`).join('');

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
