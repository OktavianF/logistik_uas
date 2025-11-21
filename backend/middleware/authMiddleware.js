const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.AUTH_JWT_SECRET || "change_this_secret";

module.exports = (req, res, next) => {
  // Read authorization header (case-insensitive header access)
  const authHeader = req.headers.authorization || req.headers.Authorization || null;
  if (!authHeader) {
    return res.status(401).json({ success: false, error: "Unauthorized" });
  }

  // Accept formats like:
  //  - Bearer <token>
  //  - bearer <token>
  //  - <token> (token only)
  // Also tolerate tokens wrapped in single or double quotes: 'token' or "token"
  const parts = String(authHeader).trim().split(/\s+/);
  let token = null;

  if (parts.length >= 2 && parts[0].toLowerCase() === 'bearer') {
    token = parts.slice(1).join(' ');
  } else if (parts.length === 1) {
    token = parts[0];
  } else {
    // unexpected format
    return res.status(401).json({ success: false, error: "Unauthorized" });
  }

  // Trim surrounding single/double quotes if present
  token = token.replace(/^['"]+|['"]+$/g, '');

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    next();
  } catch (err) {
    console.error('JWT verify failed:', err && err.message ? err.message : err);
    return res.status(401).json({ success: false, error: "Invalid token" });
  }
};
