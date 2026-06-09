const express = require('express');
const path = require('path');
const router = express.Router();
const { requireLogin } = require('../middleware/auth');
const { checkTokenBalance } = require('../middleware/tokens');
const { createTicket, getClientTickets } = require('../controllers/ticketController');
const { createTopupCheckout } = require('../controllers/stripeController');
const User = require('../models/User');
const Transaction = require('../models/Transaction');

router.use(requireLogin);

// Serve portal pages
const page = (name) => (req, res) =>
  res.sendFile(path.join(__dirname, `../../views/pages/portal/${name}.html`));

router.get('/', page('overview'));
router.get('/request', page('request'));
router.get('/tickets', page('tickets'));
router.get('/topup', page('topup'));
router.get('/billing', page('billing'));

// API — current user data
router.get('/api/me', async (req, res) => {
  try {
    const user = await User.findById(req.session.userId)
      .select('-password')
      .lean();
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load user data.' });
  }
});

// API — tickets
router.get('/api/tickets', getClientTickets);
router.post('/api/tickets', checkTokenBalance, createTicket);

// API — billing history
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

// API — start top-up checkout
router.post('/api/topup', createTopupCheckout);

module.exports = router;
