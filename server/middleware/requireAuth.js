const jwt = require("jsonwebtoken");
const User = require("../models/User");

async function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Missing token" });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    // ✅ Single-device login enforcement
    // Token must contain sid that matches the user's current sessionId.
    const user = await User.findById(payload.id).select("_id email sessionId");
    if (!user) return res.status(401).json({ error: "Invalid token", code: "SESSION_INVALID" });

    if (payload.sid && user.sessionId && payload.sid !== user.sessionId) {
      return res.status(401).json({ error: "Session expired", code: "SESSION_EXPIRED" });
    }

    req.user = { id: payload.id, email: payload.email };
    next();
  } catch {
    return res.status(401).json({ error: "Invalid token", code: "SESSION_INVALID" });
  }
}

module.exports = { requireAuth };
