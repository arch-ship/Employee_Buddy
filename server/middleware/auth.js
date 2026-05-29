// server/middleware/auth.js
const passport = require('passport');

// Protect any route — just add verifyToken as middleware
const verifyToken = (req, res, next) => {
  passport.authenticate('jwt', { session: false }, (err, user) => {
    if (err || !user) {
      return res.status(401).json({ error: 'Unauthorized. Please log in.' });
    }
    req.user = user;
    next();
  })(req, res, next);
};

// Role-based access — use after verifyToken
// Example: checkRole('ADMIN', 'HR')  allows ADMIN or HR
const checkRole = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ error: 'Forbidden. You do not have permission.' });
  }
  next();
};

module.exports = { verifyToken, checkRole };
