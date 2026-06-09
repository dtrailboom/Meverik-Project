const express = require('express');
const router = express.Router();
const { handleWebhook } = require('../controllers/stripeController');

// Stripe requires the raw body for signature verification
// This route must come BEFORE express.json() parses the body
router.post(
  '/stripe',
  express.raw({ type: 'application/json' }),
  handleWebhook
);

module.exports = router;
