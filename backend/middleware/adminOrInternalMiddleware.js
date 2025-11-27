const authMiddleware = require('./authMiddleware');

/**
 * Allows access if either:
 *  - request contains valid x-internal-secret header matching process.env.INTERNAL_ADMIN_SECRET
 *  - or the request has a valid JWT and the user's role is 'admin'
 */
module.exports = (req, res, next) => {
  try {
    const secret = req.headers['x-internal-secret'] || req.headers['X-Internal-Secret'];
    if (secret && process.env.INTERNAL_ADMIN_SECRET && secret === process.env.INTERNAL_ADMIN_SECRET) {
      // mark as internal actor
      req.user = { role: 'internal' };
      return next();
    }

    // Fallback to normal auth + admin role check
    authMiddleware(req, res, (err) => {
      if (err) return next(err);
      const userRole = (req.user && (req.user.role || '')).toString().toLowerCase();
      if (userRole === 'admin') return next();
      return res.status(403).json({ success: false, error: 'Forbidden' });
    });
  } catch (err) {
    next(err);
  }
};
