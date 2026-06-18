const statusColors = {
  new: 'badge-blue',
  in_progress: 'badge-amber',
  in_review: 'badge-purple',
  delivered: 'badge-green',
  blocked: 'badge-red',
};
const statusLabels = {
  new: 'New', in_progress: 'In progress', in_review: 'In review',
  delivered: 'Delivered', blocked: 'Blocked',
};
const complexityClasses = { small: 'is-small', medium: 'is-medium', large: 'is-large' };
let currentTicketId = null;
let allTickets = [];

async function loadTickets() {
  const status = document.getElementById('status-filter').value;
  const url = '/admin/api/tickets' + (status ? '?status=' + status : '');
  try {
    const res = await fetch(url, { cache: 'no-store' });
    if (res.status === 401 || res.status === 403) { window.location = '/auth/login'; return; }
    const { tickets } = await res.json();
    allTickets = tickets;
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
    el.innerHTML = '<div class="empty-state">No tickets found</div>';
    return;
  }
  el.innerHTML = tickets.map(t => `
    <div class="dgrid dgrid-row">
      <div class="col-client">
        <div class="client-name">${t.client?.businessName || t.client?.name || '—'}</div>
        <div class="client-email">${t.client?.email || ''}</div>
      </div>
      <div class="col-request">
        <div class="cell-strong">#${t.ticketNumber} · ${t.title}</div>
        <div class="cell-muted cell-desc" style="margin-top:4px;white-space:pre-wrap"></div>
      </div>
      <div class="col-type"><span class="complexity ${complexityClasses[t.complexity] || ''}">${t.complexity}</span></div>
      <div class="col-status"><span class="badge ${statusColors[t.status] || 'badge-gray'}">${statusLabels[t.status] || t.status}</span></div>
      <div class="col-tokens"><span class="cell-muted">${t.tokenCost}</span></div>
      <div class="col-date"><span class="cell-muted">${new Date(t.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span></div>
      <div class="col-action"><button data-id="${t._id}" data-status="${t.status}" class="edit-btn btn btn-outline btn-xs">Edit</button></div>
    </div>`).join('');

  // Fill the request details via textContent (XSS-safe). Order matches the rendered array.
  const rows = el.querySelectorAll('.dgrid-row');
  rows.forEach((row, i) => {
    const d = row.querySelector('.cell-desc');
    if (d) d.textContent = tickets[i].description || 'No details provided.';
  });

  document.querySelectorAll('.edit-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      openModal(btn.dataset.id, btn.dataset.status);
    });
  });

  document.querySelectorAll('#tickets-list .dgrid-row').forEach(row => {
    row.addEventListener('click', (e) => {
      if (e.target.closest('.col-action')) return;
      row.classList.toggle('is-open');
    });
  });
}

function openModal(id, status) {
  currentTicketId = id;
  const t = allTickets.find(x => x._id === id);

  // Defensive: only touch elements that actually exist in the HTML,
  // so the modal still opens even if tickets.html wasn't updated yet.
  const statusEl  = document.getElementById('modal-status');
  const notesEl   = document.getElementById('modal-notes');
  const replyEl   = document.getElementById('modal-reply');
  const detailsEl = document.getElementById('modal-details');

  if (statusEl)  statusEl.value = status;
  if (notesEl)   notesEl.value = (t && t.notes) || '';
  if (replyEl)   replyEl.value = (t && t.adminReply) || '';
  if (detailsEl) detailsEl.textContent = (t && t.description) || 'No details provided.';

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

  const replyEl = document.getElementById('modal-reply');
  const body = {
    status: document.getElementById('modal-status').value,
    notes: document.getElementById('modal-notes').value,
  };
  if (replyEl) body.adminReply = replyEl.value; // only send if the field exists

  try {
    const res = await fetch('/admin/api/tickets/' + currentTicketId, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
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
