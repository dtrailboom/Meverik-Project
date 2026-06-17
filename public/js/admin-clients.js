let allClients = [];
let currentClientId = null;
const planColors = { starter: 'badge-gray', growth: 'badge-purple', pro: 'badge-blue' };
const subColors = { active: 'badge-green', past_due: 'badge-red', canceled: 'badge-gray', trialing: 'badge-amber' };

async function load() {
  try {
    const res = await fetch('/admin/api/clients');
    if (res.status === 401 || res.status === 403) { window.location = '/auth/login'; return; }
    const { clients } = await res.json();
    allClients = clients;
    document.getElementById('m-total').textContent = clients.length;
    document.getElementById('m-active').textContent = clients.filter(c => c.subscriptionStatus === 'active').length;
    document.getElementById('m-empty').textContent = clients.filter(c => c.tokenBalance === 0).length;
    renderClients(clients);
  } catch (e) {
    console.error(e);
  }
}

function filterClients() {
  const q = document.getElementById('search').value.toLowerCase();
  const plan = document.getElementById('plan-filter').value;
  renderClients(allClients.filter(c => {
    const matchQ = !q || (c.name || '').toLowerCase().includes(q) || (c.businessName || '').toLowerCase().includes(q) || (c.email || '').toLowerCase().includes(q);
    const matchP = !plan || c.plan === plan;
    return matchQ && matchP;
  }));
}

function renderClients(clients) {
  const el = document.getElementById('clients-list');
  if (!clients.length) {
    el.innerHTML = '<div class="empty-state">No clients found</div>';
    return;
  }
  el.innerHTML = clients.map(c => {
    const pct = c.planTokensPerMonth > 0 ? Math.round((c.tokenBalance / c.planTokensPerMonth) * 100) : 0;
    const barClass = pct === 0 ? 'is-empty' : pct < 30 ? 'is-low' : 'is-ok';
    return `<div class="dgrid dgrid-row">
      <div class="col-name">
        <div class="client-name">${c.businessName || c.name}</div>
        <div class="client-email">${c.email}</div>
      </div>
      <div class="col-plan"><span class="badge cap ${planColors[c.plan] || 'badge-gray'}">${c.plan || 'none'}</span></div>
      <div class="col-tokens">
        <div class="token-meter">
          <div class="progress progress-sm"><div class="progress-bar ${barClass}" style="width:${Math.min(pct, 100)}%"></div></div>
          <span class="token-meter-label">${c.tokenBalance}/${c.planTokensPerMonth}</span>
        </div>
      </div>
      <div class="col-status"><span class="badge cap ${subColors[c.subscriptionStatus] || 'badge-gray'}">${c.subscriptionStatus || 'inactive'}</span></div>
      <div class="col-date">${new Date(c.createdAt).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}</div>
      <div class="col-actions">
        <button data-id="${c._id}" data-name="${c.businessName || c.name}" title="Add tokens" class="token-btn icon-btn icon-btn-teal">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
        </button>
        <button data-id="${c._id}" title="Edit client" class="edit-btn icon-btn">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
        </button>
        <button data-id="${c._id}" data-name="${c.businessName || c.name}" title="Delete client" class="delete-btn icon-btn icon-btn-danger">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
        </button>
      </div>
    </div>`;
  }).join('');

  document.querySelectorAll('.token-btn').forEach(btn => {
    btn.addEventListener('click', () => openModal(btn.dataset.id, btn.dataset.name));
  });
  document.querySelectorAll('.edit-btn').forEach(btn => {
    btn.addEventListener('click', () => openEditModal(btn.dataset.id));
  });
  document.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', () => deleteClient(btn.dataset.id, btn.dataset.name));
  });
}

function openModal(id, name) {
  currentClientId = id;
  document.getElementById('modal-client-name').textContent = name;
  document.getElementById('modal-tokens').value = 10;
  document.getElementById('modal').classList.remove('hidden');
}

function closeModal() {
  document.getElementById('modal').classList.add('hidden');
  currentClientId = null;
}

async function addTokens() {
  const amount = parseInt(document.getElementById('modal-tokens').value);
  if (!amount || amount < 1) { alert('Enter a valid amount.'); return; }
  const btn = document.getElementById('modal-save');
  btn.disabled = true;
  btn.textContent = 'Adding...';
  try {
    const res = await fetch('/admin/api/clients/' + currentClientId + '/tokens', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount }),
    });
    if (res.ok) { closeModal(); load(); }
    else { alert('Failed to add tokens.'); }
  } catch (e) {
    alert('Something went wrong.');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Add tokens';
  }
}

let editClientId = null;

function openEditModal(id) {
  const c = allClients.find(x => x._id === id);
  if (!c) return;
  editClientId = id;
  document.getElementById('edit-client-email').textContent = c.email;
  document.getElementById('edit-business').value = c.businessName || '';
  document.getElementById('edit-website').value = c.websiteUrl || '';
  document.getElementById('edit-plan').value = c.plan || 'starter';
  document.getElementById('edit-active').value = String(c.isActive !== false);
  document.getElementById('edit-modal').classList.remove('hidden');
}

function closeEditModal() {
  document.getElementById('edit-modal').classList.add('hidden');
  editClientId = null;
}

async function saveClient() {
  if (!editClientId) return;
  const planTokens = { starter: 10, growth: 25, pro: 60 };
  const plan = document.getElementById('edit-plan').value;
  const btn = document.getElementById('edit-save');
  btn.disabled = true;
  btn.textContent = 'Saving...';
  try {
    const res = await fetch('/admin/api/clients/' + editClientId, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        businessName: document.getElementById('edit-business').value.trim(),
        websiteUrl: document.getElementById('edit-website').value.trim(),
        plan,
        planTokensPerMonth: planTokens[plan],
        isActive: document.getElementById('edit-active').value === 'true',
      }),
    });
    if (res.ok) { closeEditModal(); load(); }
    else { const d = await res.json(); alert(d.error || 'Failed to update client.'); }
  } catch (e) {
    alert('Something went wrong.');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Save changes';
  }
}

async function deleteClient(id, name) {
  if (!confirm(`Delete ${name}? This cannot be undone.`)) return;
  try {
    const res = await fetch('/admin/api/clients/' + id, { method: 'DELETE' });
    if (res.ok) load();
    else alert('Failed to delete client.');
  } catch (e) {
    alert('Something went wrong.');
  }
}

async function logout() {
  await fetch('/auth/logout', { method: 'POST' });
  window.location = '/';
}

document.getElementById('logout-btn').addEventListener('click', logout);
document.getElementById('search').addEventListener('input', filterClients);
document.getElementById('plan-filter').addEventListener('change', filterClients);
document.getElementById('modal-cancel').addEventListener('click', closeModal);
document.getElementById('modal-save').addEventListener('click', addTokens);
document.getElementById('edit-cancel').addEventListener('click', closeEditModal);
document.getElementById('edit-save').addEventListener('click', saveClient);

load();
