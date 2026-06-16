const statusColors = {
  new: 'bg-blue-50 text-blue-600',
  in_progress: 'bg-amber-50 text-amber-600',
  in_review: 'bg-purple-50 text-purple-600',
  delivered: 'bg-green-50 text-green-600',
  blocked: 'bg-red-50 text-red-600',
};
const statusLabels = {
  new: 'New', in_progress: 'In progress', in_review: 'In review',
  delivered: 'Delivered', blocked: 'Blocked',
};
const complexityColors = { small: 'text-green-600', medium: 'text-amber-500', large: 'text-red-500' };
let currentTicketId = null;

async function loadTickets() {
  const status = document.getElementById('status-filter').value;
  const url = '/admin/api/tickets' + (status ? '?status=' + status : '');
  try {
    const res = await fetch(url);
    if (res.status === 401 || res.status === 403) { window.location = '/auth/login'; return; }
    const { tickets } = await res.json();
    renderMetrics(tickets);
    renderTickets(tickets);
  } catch (e) {
    console.error(e);
  }
}

function renderMetrics(tickets) {
  const week = Date.now() - 7 * 24 * 60 * 60 * 1000;
  document.getElementById('m-open').textContent = tickets.filter(t => t.status !== 'delivered').length;
  document.getElementById('m-delivered').textContent = tickets.filter(t => t.status === 'delivered' && new Date(t.deliveredAt) > week).length;
  document.getElementById('m-progress').textContent = tickets.filter(t => t.status === 'in_progress').length;
  document.getElementById('m-blocked').textContent = tickets.filter(t => t.status === 'blocked').length;
}

function renderTickets(tickets) {
  const el = document.getElementById('tickets-list');
  if (!tickets.length) {
    el.innerHTML = '<div class="px-5 py-10 text-center text-sm text-gray-400">No tickets found</div>';
    return;
  }
  el.innerHTML = tickets.map(t => `
    <div class="grid grid-cols-12 gap-3 px-5 py-3.5 border-b border-gray-50 last:border-0 items-center text-sm hover:bg-gray-50 transition-all">
      <div class="col-span-3">
        <div class="font-medium text-gray-800">${t.client?.businessName || t.client?.name || '—'}</div>
        <div class="text-xs text-gray-400">${t.client?.email || ''}</div>
      </div>
      <div class="col-span-3">
        <div class="font-medium text-gray-700">#${t.ticketNumber} · ${t.title}</div>
      </div>
      <div class="col-span-1"><span class="text-xs font-medium capitalize ${complexityColors[t.complexity] || ''}">${t.complexity}</span></div>
      <div class="col-span-2"><span class="text-xs font-medium px-2 py-1 rounded-full ${statusColors[t.status] || 'bg-gray-100 text-gray-500'}">${statusLabels[t.status] || t.status}</span></div>
      <div class="col-span-1"><span class="text-xs text-gray-400">${t.tokenCost}</span></div>
      <div class="col-span-1"><span class="text-xs text-gray-400">${new Date(t.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span></div>
      <div class="col-span-1"><button data-id="${t._id}" data-status="${t.status}" class="edit-btn text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 hover:bg-gray-100 transition-all">Edit</button></div>
    </div>`).join('');

  document.querySelectorAll('.edit-btn').forEach(btn => {
    btn.addEventListener('click', () => openModal(btn.dataset.id, btn.dataset.status));
  });
}

function openModal(id, status) {
  currentTicketId = id;
  document.getElementById('modal-status').value = status;
  document.getElementById('modal-notes').value = '';
  document.getElementById('modal').classList.remove('hidden');
}

function closeModal() {
  document.getElementById('modal').classList.add('hidden');
  currentTicketId = null;
}

async function saveStatus() {
  if (!currentTicketId) return;
  const btn = document.getElementById('modal-save');
  btn.disabled = true;
  btn.textContent = 'Saving...';
  try {
    const res = await fetch('/admin/api/tickets/' + currentTicketId, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: document.getElementById('modal-status').value,
        notes: document.getElementById('modal-notes').value,
      }),
    });
    if (res.ok) { closeModal(); loadTickets(); }
    else { alert('Failed to update ticket.'); }
  } catch (e) {
    alert('Something went wrong.');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Save';
  }
}

async function logout() {
  await fetch('/auth/logout', { method: 'POST' });
  window.location = '/';
}

document.getElementById('logout-btn').addEventListener('click', logout);
document.getElementById('status-filter').addEventListener('change', loadTickets);
document.getElementById('modal-cancel').addEventListener('click', closeModal);
document.getElementById('modal-save').addEventListener('click', saveStatus);

loadTickets();
