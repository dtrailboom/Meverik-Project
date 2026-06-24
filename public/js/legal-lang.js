(function () {
  var KEY = 'meverik-legal-lang';
  var btn = document.getElementById('lang-toggle');
  var docs = document.querySelectorAll('.legal-doc');

  function apply(lang) {
    docs.forEach(function (el) {
      if (el.getAttribute('data-lang') === lang) {
        el.classList.remove('hidden');
      } else {
        el.classList.add('hidden');
      }
    });
    document.documentElement.setAttribute('lang', lang);
    // Button zeigt die jeweils ANDERE Sprache an
    if (btn) btn.textContent = lang === 'en' ? 'DE' : 'EN';
    try { localStorage.setItem(KEY, lang); } catch (e) {}
  }

  // Startsprache: gespeichert, sonst englisch
  var saved = 'en';
  try { saved = localStorage.getItem(KEY) || 'en'; } catch (e) {}
  apply(saved);

  if (btn) {
    btn.addEventListener('click', function () {
      var current = document.documentElement.getAttribute('lang') === 'de' ? 'de' : 'en';
      apply(current === 'en' ? 'de' : 'en');
    });
  }
})();
