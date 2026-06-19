(function () {
  var KEY = 'meverik-theme';
  var root = document.documentElement;
  var btn = document.getElementById('theme-toggle');

  function current() {
    return root.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
  }

  if (btn) {
    btn.addEventListener('click', function () {
      var next = current() === 'dark' ? 'light' : 'dark';
      if (next === 'dark') {
        root.setAttribute('data-theme', 'dark');
      } else {
        root.removeAttribute('data-theme');
      }
      try { localStorage.setItem(KEY, next); } catch (e) {}
    });
  }
})();
