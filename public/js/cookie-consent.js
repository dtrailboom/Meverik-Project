(function () {
  var KEY = 'meverik-cookie-consent';      // 'accepted' | 'declined'
  var PUB_ID = 'ca-pub-3931174652506557';   // deine AdSense Publisher-ID
  var banner = document.getElementById('cookie-banner');
  var acceptBtn = document.getElementById('cookie-accept');
  var declineBtn = document.getElementById('cookie-decline');

  function getConsent() {
    try { return localStorage.getItem(KEY); } catch (e) { return null; }
  }
  function setConsent(value) {
    try { localStorage.setItem(KEY, value); } catch (e) {}
  }

  // AdSense erst NACH Zustimmung laden — vorher keine Tracking-Cookies
  function loadAds() {
    if (window.__adsenseLoaded) return;
    window.__adsenseLoaded = true;

    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=' + PUB_ID;
    s.crossOrigin = 'anonymous';
    s.onload = function () {
      // Alle Anzeigenblöcke auf der Seite aktivieren
      document.querySelectorAll('ins.adsbygoogle').forEach(function () {
        try { (window.adsbygoogle = window.adsbygoogle || []).push({}); } catch (e) {}
      });
    };
    document.head.appendChild(s);
  }

  function hideBanner() {
    if (banner) banner.hidden = true;
  }

  var consent = getConsent();
  if (consent === 'accepted') {
    // Frühere Zustimmung → Ads direkt laden, Banner bleibt versteckt
    loadAds();
  } else if (consent === 'declined') {
    // Frühere Ablehnung → nichts laden, Banner bleibt versteckt
  } else {
    // Noch keine Entscheidung → Banner zeigen
    if (banner) banner.hidden = false;
  }

  if (acceptBtn) {
    acceptBtn.addEventListener('click', function () {
      setConsent('accepted');
      hideBanner();
      loadAds();
    });
  }
  if (declineBtn) {
    declineBtn.addEventListener('click', function () {
      setConsent('declined');
      hideBanner();
      // keine Ads, keine Cookies
    });
  }
})();
