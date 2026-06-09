const User = require('../models/User');
const { stripe, PLANS } = require('../config/stripe');

// GET /auth/login
const getLogin = (req, res) => {
  if (req.session.userId) return res.redirect('/portal');
  res.sendFile(require('path').join(__dirname, '../../views/pages/login.html'));
};

// POST /auth/login
const postLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    if (!user.isActive) {
      return res.status(403).json({ error: 'Account is inactive. Please contact support.' });
    }

    req.session.userId = user._id.toString();
    req.session.role = user.role;
    req.session.userName = user.name;

    const redirect = user.role === 'admin' ? '/admin' : '/portal';
    res.json({ success: true, redirect });
  } catch (err) {
    res.status(500).json({ error: 'Login failed. Please try again.' });
  }
};

// GET /auth/register
const getRegister = (req, res) => {
  if (req.session.userId) return res.redirect('/portal');
  res.sendFile(require('path').join(__dirname, '../../views/pages/register.html'));
};

// POST /auth/register
const postRegister = async (req, res) => {
  try {
    const { name, email, password, businessName, plan } = req.body;

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    if (!PLANS[plan]) {
      return res.status(400).json({ error: 'Invalid plan selected.' });
    }

    // Create Stripe customer
    const stripeCustomer = await stripe.customers.create({
      email,
      name: businessName || name,
      metadata: { appUserId: 'pending' },
    });

    // Create user in DB
    const user = await User.create({
      name,
      email,
      password,
      businessName,
      stripeCustomerId: stripeCustomer.id,
    });

    // Update Stripe customer with real user ID
    await stripe.customers.update(stripeCustomer.id, {
      metadata: { appUserId: user._id.toString() },
    });

    // Create Stripe Checkout session for subscription
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomer.id,
      mode: 'subscription',
      line_items: [{ price: PLANS[plan].priceId, quantity: 1 }],
      success_url: `${process.env.APP_URL}/portal?welcome=1`,
      cancel_url: `${process.env.APP_URL}/register?canceled=1`,
      metadata: { userId: user._id.toString(), plan },
    });

    res.json({ success: true, checkoutUrl: session.url });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
};

// POST /auth/logout
const logout = (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('meverik.sid');
    res.redirect('/');
  });
};

module.exports = { getLogin, postLogin, getRegister, postRegister, logout };
