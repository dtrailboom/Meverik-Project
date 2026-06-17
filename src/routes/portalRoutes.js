const express = require('express');
const path = require('path');
const router = express.Router();
const { requireLogin } = require('../middleware/auth');
const { checkTokenBalance } = require('../middleware/tokens');
const { createTicket } = require('../controllers/ticketController'); // getClientTickets entfernt — Logik jetzt inline (C2)
const { createTopupCheckout } = require('../controllers/stripeController');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Ticket = require('../models/Ticket');
const { respondWith } = require('../utils/respondWith'); // C2: JSON/XML-Helper

router.use(requireLogin);

const page = (name) => (req, res) =>
    res.sendFile(path.join(__dirname, `../../views/pages/portal/${name}.html`));

router.get('/', page('overview'));
router.get('/request', page('request'));
router.get('/tickets', page('tickets'));
router.get('/topup', page('topup'));
router.get('/billing', page('billing'));

// GET current user data
router.get('/api/me', async (req, res) => {
  try {
    const user = await User.findById(req.session.userId).select('-password').lean();
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load user data.' });
  }
});

// PUT update own profile (businessName, websiteUrl) — M6/M7
router.put('/api/me', async (req, res) => {
  try {
    const allowed = ['businessName', 'websiteUrl', 'name'];
    const updates = {};
    allowed.forEach(field => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });
    const user = await User.findByIdAndUpdate(
        req.session.userId,
        updates,
        { new: true, select: '-password' }
    );
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update profile.' });
  }
});

// GET tickets — C2: liefert JSON (default) oder XML (?format=xml / Accept: application/xml)
// JSON-Shape ist identisch zur alten getClientTickets-Version → Frontend bleibt intakt.
// Mapping: C2 (JSON + XML), M5 (JSON-Responses), M7 (FE konsumiert BE-Endpoint)
router.get('/api/tickets', async (req, res) => {
  try {
    const tickets = await Ticket.find({ client: req.session.userId })
      .sort({ createdAt: -1 })
      .lean();

    // ObjectIds → String, damit JSON und XML sauber serialisieren
    const clean = tickets.map(t => ({
      ...t,
      _id:    String(t._id),
      client: t.client ? String(t.client) : undefined,
    }));

    respondWith(
      req, res,
      { tickets: clean },  // JSON → bestehende Shape, Frontend-Code bleibt unverändert
      { ticket:  clean },  // XML  → <tickets><ticket>…</ticket></tickets>
      'tickets'            // XML-Root-Element
    );
  } catch (err) {
    res.status(500).json({ error: 'Failed to load tickets.' });
  }
});

// POST create ticket
router.post('/api/tickets', checkTokenBalance, createTicket);

// DELETE own ticket (only if status is 'new') — M6/M7
router.delete('/api/tickets/:id', async (req, res) => {
  try {
    const ticket = await Ticket.findOne({
      _id: req.params.id,
      client: req.session.userId,
    });
    if (!ticket) return res.status(404).json({ error: 'Ticket not found.' });
    if (ticket.status !== 'new') {
      return res.status(400).json({ error: 'Only new tickets can be cancelled.' });
    }
    // Refund tokens
    await User.findByIdAndUpdate(req.session.userId, {
      $inc: { tokenBalance: ticket.tokenCost },
    });
    await ticket.deleteOne();
    res.json({ success: true, message: 'Ticket cancelled. Tokens refunded.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to cancel ticket.' });
  }
});

// GET billing history
router.get('/api/transactions', async (req, res) => {
  try {
    const transactions = await Transaction.find({ user: req.session.userId })
        .sort({ createdAt: -1 })
        .lean();
    res.json({ transactions });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load transactions.' });
  }
});

// POST start top-up checkout
router.post('/api/topup', createTopupCheckout);

// GET weather for client's business location (external API — C1)
router.get('/api/weather', async (req, res) => {
  try {
    const { city } = req.query;
    if (!city) return res.status(400).json({ error: 'City required.' });
    const url = `https://wttr.in/${encodeURIComponent(city)}?format=j1`;
    const response = await fetch(url);
    const data = await response.json();
    const current = data.current_condition?.[0];
    res.json({
      city,
      temp_c: current?.temp_C,
      description: current?.weatherDesc?.[0]?.value,
      humidity: current?.humidity,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch weather.' });
  }
});

module.exports = router;
