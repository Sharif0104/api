// Professional Role-Based Access Control (RBAC) middleware
// Usage: router.get('/admin', auth, rbac(['admin']), handler)

module.exports = function rbac(allowedRoles = []) {
  return (req, res, next) => {
    if (!req.user || !req.user.roles) {
      return res.status(403).json({ message: 'Forbidden: No user role found' });
    }
    // Check if user has at least one allowed role
    if (!req.user.roles.some(role => allowedRoles.includes(role))) {
      return res.status(403).json({ message: 'Forbidden: Insufficient role' });
    }
    next();
  };
};
