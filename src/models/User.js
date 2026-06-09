const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 8 },
    role: { type: String, enum: ['client', 'admin'], default: 'client' },
    businessName: { type: String, trim: true },
    websiteUrl: { type: String, trim: true },

    // Token system
    tokenBalance: { type: Number, default: 0 },
    tokensUsedThisMonth: { type: Number, default: 0 },

    // Subscription
    plan: {
      type: String,
      enum: ['starter', 'growth', 'pro', null],
      default: null,
    },
    planTokensPerMonth: { type: Number, default: 0 },
    subscriptionRenewsAt: { type: Date },

    // Stripe
    stripeCustomerId: { type: String },
    stripeSubscriptionId: { type: String },
    subscriptionStatus: {
      type: String,
      enum: ['active', 'past_due', 'canceled', 'trialing', null],
      default: null,
    },

    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password
userSchema.methods.comparePassword = async function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

// Check if user has enough tokens for a request
userSchema.methods.canAfford = function (cost) {
  return this.tokenBalance >= cost;
};

// Deduct tokens
userSchema.methods.deductTokens = async function (cost) {
  this.tokenBalance -= cost;
  this.tokensUsedThisMonth += cost;
  return this.save();
};

// Add tokens (top-up or monthly refill)
userSchema.methods.addTokens = async function (amount) {
  this.tokenBalance += amount;
  return this.save();
};

module.exports = mongoose.model('User', userSchema);
