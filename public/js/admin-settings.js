// Toggle switches
document.querySelectorAll('.toggle').forEach(toggle => {
  toggle.addEventListener('click', () => {
    toggle.classList.toggle('on');
    toggle.classList.toggle('off');
  });
});

// Save buttons
document.querySelectorAll('.save-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const orig = btn.textContent;
    btn.textContent = '✓ Saved';
    btn.classList.add('opacity-75');
    setTimeout(() => {
      btn.textContent = orig;
      btn.classList.remove('opacity-75');
    }, 2000);
  });
});

async function logout() {
  await fetch('/auth/logout', { method: 'POST' });
  window.location = '/';
}

document.getElementById('logout-btn').addEventListener('click', logout);
