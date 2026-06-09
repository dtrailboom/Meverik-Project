const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

const PLANS = {
  starter: {
    name: 'Starter',
    priceId: process.env.STRIPE_PRICE_STARTER,
    tokens: 10,
    amount: 29,
  },
  growth: {
    name: 'Growth',
    priceId: process.env.STRIPE_PRICE_GROWTH,
    tokens: 25,
    amount: 59,
  },
  pro: {
    name: 'Pro',
    priceId: process.env.STRIPE_PRICE_PRO,
    tokens: 60,
    amount: 99,
  },
};

const TOPUP_PACKS = {
  small: {
    name: 'Small pack',
    priceId: process.env.STRIPE_PRICE_TOPUP_SMALL,
    tokens: 5,
    amount: 9,
  },
  medium: {
    name: 'Medium pack',
    priceId: process.env.STRIPE_PRICE_TOPUP_MEDIUM,
    tokens: 15,
    amount: 19,
  },
  large: {
    name: 'Large pack',
    priceId: process.env.STRIPE_PRICE_TOPUP_LARGE,
    tokens: 35,
    amount: 39,
  },
};

module.exports = { stripe, PLANS, TOPUP_PACKS };
