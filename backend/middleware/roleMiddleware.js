module.exports = {
  requireRole: (role) => (req, res, next) => {
    try {
      const user = req.user || {};
      const userRole = (user.role || '').toString().toLowerCase();
      if (!userRole) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }
      if (Array.isArray(role)) {
        const allowed = role.map(r => r.toString().toLowerCase());
        if (!allowed.includes(userRole)) return res.status(403).json({ success: false, error: 'Forbidden' });
      } else {
        if (userRole !== role.toString().toLowerCase()) return res.status(403).json({ success: false, error: 'Forbidden' });
      }
      next();
    } catch (err) {
      next(err);
    }
  }
};
