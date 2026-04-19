const jwt = require("jsonwebtoken");

function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) return res.status(401).json({ error: "No token" });

  try {
    req.user = jwt.verify(token, "secretkey");
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
}

module.exports = authMiddleware;