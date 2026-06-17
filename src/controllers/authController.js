const crypto = require('crypto');
const path   = require('path');
const User   = require('../models/User');
const { stripe, PLANS } = require('../config/stripe');
const { sendPasswordResetEmail } = require('../services/emailService');

// GET /auth/login
const getLogin = (req, res) => {
  if (req.session.userId) return res.redirect('/portal');
  res.sendFile(path.join(__dirname, '../../views/pages/login.html'));
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

    req.session.userId  = user._id.toString();
    req.session.role    = user.role;
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
  res.sendFile(path.join(__dirname, '../../views/pages/register.html'));
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
      cancel_url:  `${process.env.APP_URL}/register?canceled=1`,
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

// ─────────────────────────────────────────────
// FORGOT PASSWORD
// ─────────────────────────────────────────────

// GET /auth/forgot-password
const getForgotPassword = (req, res) => {
  res.sendFile(path.join(__dirname, '../../views/pages/forgot-password.html'));
};

// POST /auth/forgot-password
const forgotPassword = async (req, res) => {
  // Always respond the same way — no user enumeration
  const generic = { success: true, message: 'If that email exists, a reset link has been sent.' };

  try {
    const { email } = req.body;
    if (!email) return res.json(generic);

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) return res.json(generic);   // silent — no leak

    // Generate token (Klartext nur im Link, nie in DB)
    const token       = crypto.randomBytes(32).toString('hex');
    const tokenHashed = crypto.createHash('sha256').update(token).digest('hex');

    user.resetPasswordToken   = tokenHashed;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 h
    await user.save();                                 // password nicht modifiziert → Hook greift nicht

    const resetUrl = `${process.env.APP_URL}/auth/reset-password/${token}`;
    await sendPasswordResetEmail({ to: user.email, name: user.name, resetUrl });

    res.json(generic);
  } catch (err) {
    console.error('forgotPassword error:', err);
    res.json(generic); // immer gleiche Antwort, auch bei Server-Fehler
  }
};

// ─────────────────────────────────────────────
// RESET PASSWORD
// ─────────────────────────────────────────────

// GET /auth/reset-password/:token
const getResetPassword = (req, res) => {
  res.sendFile(path.join(__dirname, '../../views/pages/reset-password.html'));
};

// POST /auth/reset-password/:token
const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password || password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters.' });
    }

    // Token hashen und User suchen (Token gültig + nicht abgelaufen)
    const tokenHashed = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken:   tokenHashed,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ error: 'This reset link is invalid or has expired.' });
    }

    // Passwort setzen — pre('save')-Hook hasht automatisch
    user.password             = password;
    user.resetPasswordToken   = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ success: true, message: 'Password updated. You can now log in.' });
  } catch (err) {
    console.error('resetPassword error:', err);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
};

module.exports = {
  getLogin,
  postLogin,
  getRegister,
  postRegister,
  logout,
  getForgotPassword,
  forgotPassword,
  getResetPassword,
  resetPassword,
};
