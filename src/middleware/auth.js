const requireLogin = (req, res, next) => {
  if (!req.session.userId) {
    return res.redirect('/auth/login?next=' + encodeURIComponent(req.originalUrl));
  }
  next();
};

const requireAdmin = (req, res, next) => {
  if (!req.session.userId || req.session.role !== 'admin') {
    return res.status(403).redirect('/portal');
  }
  next();
};

// Attach user info to res.locals for use in views
const attachUser = (req, res, next) => {
  res.locals.user = req.session.userId
    ? { id: req.session.userId, role: req.session.role, name: req.session.userName }
    : null;
  next();
};

module.exports = { requireLogin, requireAdmin, attachUser };
