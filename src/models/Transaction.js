const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
      type: String,
      enum: ['subscription', 'topup', 'refund', 'token_refill'],
      required: true,
    },
    description: { type: String },
    amountEur: { type: Number }, // in euros, null for token_refill
    tokensAdded: { type: Number, default: 0 },

    // Stripe references
    stripePaymentIntentId: { type: String },
    stripeInvoiceId: { type: String },
    stripeSessionId: { type: String },

    status: {
      type: String,
      enum: ['succeeded', 'failed', 'pending'],
      default: 'succeeded',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Transaction', transactionSchema);
