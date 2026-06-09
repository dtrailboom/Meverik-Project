const { stripe, PLANS, TOPUP_PACKS } = require('../config/stripe');
const User = require('../models/User');
const Transaction = require('../models/Transaction');

// POST /portal/topup/checkout — create Stripe Checkout for a top-up pack
const createTopupCheckout = async (req, res) => {
  try {
    const { pack } = req.body;
    if (!TOPUP_PACKS[pack]) {
      return res.status(400).json({ error: 'Invalid pack.' });
    }

    const user = await User.findById(req.session.userId);
    if (!user) return res.status(401).json({ error: 'Not authenticated.' });

    const session = await stripe.checkout.sessions.create({
      customer: user.stripeCustomerId,
      mode: 'payment',
      line_items: [{ price: TOPUP_PACKS[pack].priceId, quantity: 1 }],
      success_url: `${process.env.APP_URL}/portal/topup?success=1`,
      cancel_url: `${process.env.APP_URL}/portal/topup?canceled=1`,
      metadata: {
        userId: user._id.toString(),
        type: 'topup',
        pack,
        tokensToAdd: TOPUP_PACKS[pack].tokens,
      },
    });

    res.json({ checkoutUrl: session.url });
  } catch (err) {
    console.error('Topup checkout error:', err);
    res.status(500).json({ error: 'Failed to start checkout.' });
  }
};

// POST /webhooks/stripe — handle Stripe events
const handleWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body, // raw body required — see webhookRoutes.js
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook signature error:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {

      // Subscription activated after register or plan change
      case 'checkout.session.completed': {
        const session = event.data.object;
        const userId = session.metadata?.userId;
        const plan = session.metadata?.plan;

        if (session.mode === 'subscription' && plan && userId) {
          const planData = PLANS[plan];
          const user = await User.findById(userId);
          if (!user) break;

          user.plan = plan;
          user.planTokensPerMonth = planData.tokens;
          user.stripeSubscriptionId = session.subscription;
          user.subscriptionStatus = 'active';
          user.tokenBalance += planData.tokens; // first month tokens
          user.subscriptionRenewsAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
          await user.save();

          await Transaction.create({
            user: user._id,
            type: 'subscription',
            description: `${planData.name} plan activated`,
            amountEur: planData.amount,
            tokensAdded: planData.tokens,
            stripeSessionId: session.id,
          });
        }

        // One-time top-up completed
        if (session.mode === 'payment' && session.metadata?.type === 'topup') {
          const { userId, pack, tokensToAdd } = session.metadata;
          const user = await User.findById(userId);
          if (!user) break;

          const tokens = parseInt(tokensToAdd, 10);
          await user.addTokens(tokens);

          const packData = TOPUP_PACKS[pack];
          await Transaction.create({
            user: user._id,
            type: 'topup',
            description: `${packData.name} top-up`,
            amountEur: packData.amount,
            tokensAdded: tokens,
            stripeSessionId: session.id,
          });
        }
        break;
      }

      // Monthly subscription invoice paid → refill tokens
      case 'invoice.paid': {
        const invoice = event.data.object;
        if (invoice.billing_reason !== 'subscription_cycle') break;

        const customer = await stripe.customers.retrieve(invoice.customer);
        const userId = customer.metadata?.appUserId;
        if (!userId) break;

        const user = await User.findById(userId);
        if (!user || !user.plan) break;

        const planData = PLANS[user.plan];
        user.tokenBalance += planData.tokens;
        user.tokensUsedThisMonth = 0;
        user.subscriptionRenewsAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        await user.save();

        await Transaction.create({
          user: user._id,
          type: 'token_refill',
          description: `Monthly token refill — ${planData.name} plan`,
          tokensAdded: planData.tokens,
          stripeInvoiceId: invoice.id,
        });
        break;
      }

      // Payment failed — mark subscription
      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        const customer = await stripe.customers.retrieve(invoice.customer);
        const userId = customer.metadata?.appUserId;
        if (!userId) break;

        await User.findByIdAndUpdate(userId, { subscriptionStatus: 'past_due' });

        await Transaction.create({
          user: userId,
          type: 'subscription',
          description: 'Subscription payment failed',
          amountEur: invoice.amount_due / 100,
          tokensAdded: 0,
          stripeInvoiceId: invoice.id,
          status: 'failed',
        });
        break;
      }

      // Subscription cancelled
      case 'customer.subscription.deleted': {
        const sub = event.data.object;
        await User.findOneAndUpdate(
          { stripeSubscriptionId: sub.id },
          { subscriptionStatus: 'canceled', plan: null }
        );
        break;
      }
    }

    res.json({ received: true });
  } catch (err) {
    console.error('Webhook handler error:', err);
    res.status(500).json({ error: 'Webhook processing failed.' });
  }
};

module.exports = { createTopupCheckout, handleWebhook };
