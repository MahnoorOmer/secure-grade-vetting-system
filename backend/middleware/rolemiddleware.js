function roleMiddleware(role) {
  return (req, res, next) => {
    if (!req.user || req.user.role !== role) {
      return res.status(403).json({ error: "Access denied" });
    }
    next();
  };
}

module.exports = roleMiddleware;

const authorize = (allowedRoles) => {
    return (req, res, next) => {
        // req.user is populated by your authMiddleware (JWT check)
        if (!req.user || !allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ 
                error: "Access Denied: You do not have the required permissions." 
            });
        }
        next();
    };
};

module.exports = authorize;