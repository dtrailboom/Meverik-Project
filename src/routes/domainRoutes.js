const express = require('express');
const router = express.Router();

// C1 — dritte externe REST-API: Domain-Verfügbarkeit (RapidAPI Domains API)
// Erfüllt: M3 (HTTP FE↔BE), M4 (AJAX/fetch), M5 (JSON), M7 (FE konsumiert BE), M8/C1 (externe REST-API)

const API_HOST = 'domains-api.p.rapidapi.com';
const TLDS = ['at', 'com', 'eu', 'net']; // Vorschläge

// Businessname säubern: nur a–z, 0–9, Bindestrich. Schutz gegen Injection/Müll.
function sanitizeName(raw = '') {
  return String(raw)
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '') // alles außer a-z 0-9 - entfernen
    .replace(/-+/g, '-')        // mehrere - zu einem
    .replace(/^-|-$/g, '')      // - am Anfang/Ende weg
    .slice(0, 63);              // max. Label-Länge laut DNS
}

// availability-Feld der API in einen Boolean übersetzen.
// .at liefert oft "unknown" → dann den whois-Text auswerten ("nothing found" = frei).
function parseAvailability(data) {
  const a = String(data.availability || '').toLowerCase();

  if (a === 'available') return true;
  if (['registered', 'unavailable', 'taken', 'active'].includes(a)) return false;

  // unknown → whois-Text durchsuchen
  const whoisText = JSON.stringify(data.whois || {}).toLowerCase();
  if (/nothing found|no match|not found|no entries found|no data found/.test(whoisText)) {
    return true; // Registry sagt: nicht registriert → frei
  }
  // Hat die Domain einen Registrar oder ein Erstell-Datum, ist sie belegt
  if (data.registrar || (data.dates && data.dates.created)) return false;

  return null; // echt unbekannt
}

// Eine einzelne Domain bei der externen API prüfen (mit Timeout)
async function checkOne(domain) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(`https://${API_HOST}/domains/${encodeURIComponent(domain)}`, {
      headers: {
        'x-rapidapi-host': API_HOST,
        'x-rapidapi-key': process.env.RAPIDAPI_KEY, // NIE im Code, nur aus .env
      },
      signal: controller.signal,
    });
    if (!response.ok) return { domain, available: null, error: true };
    const data = await response.json();
    return { domain, available: parseAvailability(data) };
  } catch (err) {
    return { domain, available: null, error: true };
  } finally {
    clearTimeout(timeout);
  }
}

// GET /api/domain/check?name=annascafe
router.get('/check', async (req, res) => {
  const name = sanitizeName(req.query.name);

  if (!name || name.length < 2) {
    return res.status(400).json({ error: 'Please provide a valid business name (min 2 characters).' });
  }
  if (!process.env.RAPIDAPI_KEY) {
    return res.status(500).json({ error: 'Domain service not configured.' });
  }

  try {
    const domains = TLDS.map(tld => `${name}.${tld}`);
    // Parallel statt sequenziell → schneller
    const results = await Promise.all(domains.map(checkOne));
    res.json({ name, results });
  } catch (err) {
    console.error('Domain check error:', err);
    res.status(500).json({ error: 'Failed to check domain availability.' });
  }
});

module.exports = router;
