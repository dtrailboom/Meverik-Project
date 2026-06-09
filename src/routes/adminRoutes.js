const express = require('express');
const path = require('path');
const router = express.Router();
const { requireAdmin } = require('../middleware/auth');
const { getAllTickets, updateTicketStatus } = require('../controllers/ticketController');
const User = require('../models/User');
const Transaction = require('../models/Transaction');

router.use(requireAdmin);

const page = (name) => (req, res) =>
  res.sendFile(path.join(__dirname, `../../views/pages/admin/${name}.html`));

router.get('/', page('tickets'));
router.get('/clients', page('clients'));
router.get('/tokens', page('tokens'));
router.get('/payments', page('payments'));
router.get('/settings', page('settings'));

// API — all tickets
router.get('/api/tickets', getAllTickets);
router.patch('/api/tickets/:id', updateTicketStatus);

// API — all clients
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

// API — manually add tokens to a client
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

// API — all transactions
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

module.exports = router;
