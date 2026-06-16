const express = require('express');
const path = require('path');
const router = express.Router();
const { requireAdmin } = require('../middleware/auth');
const { getAllTickets, updateTicketStatus } = require('../controllers/ticketController');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Ticket = require('../models/Ticket');

router.use(requireAdmin);

const page = (name) => (req, res) =>
    res.sendFile(path.join(__dirname, `../../views/pages/admin/${name}.html`));

router.get('/', page('tickets'));
router.get('/clients', page('clients'));
router.get('/tokens', page('tokens'));
router.get('/payments', page('payments'));
router.get('/settings', page('settings'));

// ─── TICKETS ───────────────────────────────────────────
// GET all tickets
router.get('/api/tickets', getAllTickets);

// PATCH ticket status (already existing)
router.patch('/api/tickets/:id', updateTicketStatus);

// DELETE a ticket — M6/M7
router.delete('/api/tickets/:id', async (req, res) => {
  try {
    const ticket = await Ticket.findByIdAndDelete(req.params.id);
    if (!ticket) return res.status(404).json({ error: 'Ticket not found.' });
    res.json({ success: true, message: 'Ticket deleted.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete ticket.' });
  }
});

// ─── CLIENTS ───────────────────────────────────────────
// GET all clients
router.get('/api/clients', async (req, res) => {
  try {
    const clients = await User.find({ role: 'client' })
        .select('-password')
        .sort({ createdAt: -1 })
        .lean();
    res.json({ clients });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load clients.' });
  }
});

// PUT update client (plan, websiteUrl, businessName etc.) — M6/M7
router.put('/api/clients/:id', async (req, res) => {
  try {
    const allowed = ['businessName', 'websiteUrl', 'plan', 'planTokensPerMonth', 'isActive'];
    const updates = {};
    allowed.forEach(field => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });
    const client = await User.findByIdAndUpdate(
        req.params.id,
        updates,
        { new: true, select: '-password' }
    );
    if (!client) return res.status(404).json({ error: 'Client not found.' });
    res.json({ success: true, client });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update client.' });
  }
});

// POST manually add tokens to a client
router.post('/api/clients/:id/tokens', async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount || amount < 1) return res.status(400).json({ error: 'Invalid amount.' });
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'Client not found.' });
    await user.addTokens(parseInt(amount, 10));
    res.json({ success: true, tokenBalance: user.tokenBalance });
  } catch (err) {
    res.status(500).json({ error: 'Failed to add tokens.' });
  }
});

// DELETE a client — M6/M7
router.delete('/api/clients/:id', async (req, res) => {
  try {
    const client = await User.findById(req.params.id);
    if (!client) return res.status(404).json({ error: 'Client not found.' });
    if (client.role === 'admin') return res.status(403).json({ error: 'Cannot delete admin accounts.' });
    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Client deleted.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete client.' });
  }
});

// ─── TRANSACTIONS ───────────────────────────────────────
// GET all transactions
router.get('/api/transactions', async (req, res) => {
  try {
    const transactions = await Transaction.find()
        .populate('user', 'name businessName email')
        .sort({ createdAt: -1 })
        .lean();
    res.json({ transactions });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load transactions.' });
  }
});

// ─── STATS (third external API proxy) ──────────────────
// GET exchange rates via external API (satisfies C1 - third external REST API)
router.get('/api/stats/exchange-rates', async (req, res) => {
  try {
    const response = await fetch('https://api.exchangerate-api.com/v4/latest/EUR');
    const data = await response.json();
    res.json({ rates: data.rates, base: data.base, date: data.date });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch exchange rates.' });
  }
});

module.exports = router;