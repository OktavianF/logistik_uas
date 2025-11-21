const authService = require("../services/authService");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.AUTH_JWT_SECRET || "change_this_secret";
const TOKEN_EXPIRY = process.env.AUTH_TOKEN_EXPIRY || "7d";

exports.signup = async (req, res) => {
  try {
    const { email, password, fullName } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, error: "Email and password are required" });
    }

    const existing = await authService.getUserByEmail(email);
    if (existing) {
      return res.status(409).json({ success: false, error: "Email already registered" });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await authService.createUser({ email, passwordHash, fullName: fullName || null });

    const token = jwt.sign({ user_id: user.user_id, email: user.email }, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });

    res.status(201).json({ success: true, data: { user, token } });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, error: "Email and password are required" });
    }

    const user = await authService.getUserByEmail(email);
    if (!user) {
      return res.status(401).json({ success: false, error: "Invalid credentials" });
    }

    const ok = await bcrypt.compare(password, user.PASSWORD_HASH ?? user.password_hash);
    if (!ok) {
      return res.status(401).json({ success: false, error: "Invalid credentials" });
    }

    const payload = { user_id: user.USER_ID ?? user.user_id, email: user.EMAIL ?? user.email };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });

    // Return minimal user info
    res.json({ success: true, data: { user: { user_id: payload.user_id, email: payload.email, full_name: user.FULL_NAME ?? user.full_name }, token } });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.me = async (req, res) => {
  try {
    // authMiddleware sets req.user
    const u = req.user;
    if (!u) return res.status(401).json({ success: false, error: "Unauthorized" });

    const user = await authService.getUserByEmail(u.email);
    if (!user) return res.status(404).json({ success: false, error: "User not found" });

    res.json({ success: true, data: { user_id: user.USER_ID ?? user.user_id, email: user.EMAIL ?? user.email, full_name: user.FULL_NAME ?? user.full_name } });
  } catch (err) {
    console.error("Me error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};
