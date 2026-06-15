let selectedComplexity = 'small';
let tokenBalance = 0;
const costs = { small: 1, medium: 3, large: 8 };

async function loadUser() {
  try {
    const res = await fetch('/portal/api/me');
    if (res.status === 401) { window.location = '/auth/login'; return; }
    const { user } = await res.json();
    tokenBalance = user.tokenBalance;
    document.getElementById('sidebar-name').textContent = user.name;
    document.getElementById('sidebar-business').textContent = user.businessName || 'My Business';
    document.getElementById('sidebar-plan').textContent = (user.plan || 'no plan') + ' plan';
    document.getElementById('token-count').textContent = user.tokenBalance + ' tokens left';
    updateCostPreview();
  } catch (e) {
    console.error(e);
  }
}

function updateCostPreview() {
  const cost = costs[selectedComplexity];
  const after = tokenBalance - cost;
  document.getElementById('balance-display').textContent = tokenBalance + ' tokens';
  document.getElementById('cost-display').textContent = cost + ' token' + (cost > 1 ? 's' : '');
  document.getElementById('after-display').textContent = after + ' left';
}

function selectComplexity(c) {
  selectedComplexity = c;
  ['small', 'medium', 'large'].forEach(x => {
    const el = document.getElementById('cc-' + x);
    el.classList.remove('selected', 'border-2', 'border-teal');
    el.classList.add('border', 'border-gray-200');
  });
  const sel = document.getElementById('cc-' + c);
  sel.classList.add('selected', 'border-2', 'border-teal');
  sel.classList.remove('border', 'border-gray-200');
  updateCostPreview();
}

function goToStep(n) {
  if (n === 2) {
    const cost = costs[selectedComplexity];
    if (tokenBalance < cost) {
      document.getElementById('blocked-banner').classList.remove('hidden');
      document.getElementById('blocked-msg').textContent = `This request costs ${cost} tokens but you only have ${tokenBalance}.`;
      return;
    }
    document.getElementById('blocked-banner').classList.add('hidden');
  }
  if (n === 3) {
    const title = document.getElementById('req-title').value.trim();
    const desc = document.getElementById('req-description').value.trim();
    if (!title) { alert('Please enter a title for your request.'); return; }
    if (!desc) { alert('Please describe your request.'); return; }
    const cost = costs[selectedComplexity];
    document.getElementById('confirm-type').textContent = selectedComplexity.charAt(0).toUpperCase() + selectedComplexity.slice(1) + ' change';
    document.getElementById('confirm-title').textContent = title;
    document.getElementById('confirm-cost').textContent = cost + ' token' + (cost > 1 ? 's' : '');
    document.getElementById('confirm-after').textContent = (tokenBalance - cost) + ' tokens';
  }
  ['step-1', 'step-2', 'step-3'].forEach((id, i) => {
    document.getElementById(id).classList.toggle('hidden', i + 1 !== n);
  });
  document.getElementById('step-2-num').className = `w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${n >= 2 ? 'bg-teal text-white' : 'bg-gray-200 text-gray-400'}`;
  document.getElementById('step-2-text').className = n >= 2 ? 'teal' : 'text-gray-400';
  document.getElementById('step-3-num').className = `w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${n >= 3 ? 'bg-teal text-white' : 'bg-gray-200 text-gray-400'}`;
  document.getElementById('step-3-text').className = n >= 3 ? 'teal' : 'text-gray-400';
}

async function submitRequest() {
  const btn = document.getElementById('submit-btn');
  btn.disabled = true;
  btn.innerHTML = '<svg class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg> Submitting…';
  try {
    const res = await fetch('/portal/api/tickets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: document.getElementById('req-title').value.trim(),
        description: document.getElementById('req-description').value.trim(),
        referenceUrl: document.getElementById('req-reference').value.trim(),
        complexity: selectedComplexity,
      }),
    });
    const data = await res.json();
    if (res.ok) {
      document.getElementById('step-3').classList.add('hidden');
      document.getElementById('step-success').classList.remove('hidden');
      document.getElementById('success-ticket-num').textContent = '#' + data.ticket.ticketNumber;
    } else {
      document.getElementById('error-msg').textContent = data.message || data.error || 'Failed to submit.';
      document.getElementById('error-msg').classList.remove('hidden');
      if (data.error === 'insufficient_tokens') {
        document.getElementById('blocked-banner').classList.remove('hidden');
        document.getElementById('blocked-msg').textContent = data.message;
      }
    }
  } catch (e) {
    document.getElementById('error-msg').textContent = 'Something went wrong. Please try again.';
    document.getElementById('error-msg').classList.remove('hidden');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Submit request';
  }
}

function resetForm() {
  document.getElementById('step-success').classList.add('hidden');
  document.getElementById('req-title').value = '';
  document.getElementById('req-description').value = '';
  document.getElementById('req-reference').value = '';
  selectComplexity('small');
  goToStep(1);
  loadUser();
}

async function logout() {
  await fetch('/auth/logout', { method: 'POST' });
  window.location = '/';
}

document.getElementById('logout-btn').addEventListener('click', logout);
document.querySelectorAll('.complexity-card').forEach(card => {
  card.addEventListener('click', () => selectComplexity(card.dataset.complexity));
});
document.getElementById('to-step-2').addEventListener('click', () => goToStep(2));
document.getElementById('to-step-3').addEventListener('click', () => goToStep(3));
document.getElementById('back-to-1').addEventListener('click', () => goToStep(1));
document.getElementById('back-to-2').addEventListener('click', () => goToStep(2));
document.getElementById('submit-btn').addEventListener('click', submitRequest);
document.getElementById('new-request-btn').addEventListener('click', resetForm);

loadUser();
