const User = require('../models/User');
const { COMPLEXITY } = require('../models/Ticket');

const checkTokenBalance = async (req, res, next) => {
  try {
    const { complexity } = req.body;
    if (!complexity || !COMPLEXITY[complexity]) {
      return res.status(400).json({ error: 'Invalid complexity type.' });
    }

    const user = await User.findById(req.session.userId);
    if (!user) return res.status(401).json({ error: 'Not authenticated.' });

    const cost = COMPLEXITY[complexity].tokenCost;

    if (!user.canAfford(cost)) {
      return res.status(402).json({
        error: 'insufficient_tokens',
        message: `You need ${cost} tokens but only have ${user.tokenBalance}. Please top up.`,
        tokenBalance: user.tokenBalance,
        required: cost,
      });
    }

    req.tokenCost = cost;
    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = { checkTokenBalance };
