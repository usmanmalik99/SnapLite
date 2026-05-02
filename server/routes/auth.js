const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const User = require("../models/User");

const router = express.Router();


router.post("/signup", async (req, res) => {
  try {
    const { firstName, lastName, phone, email, password } = req.body;

    if (!firstName || !lastName || !phone || !email || !password) {
      return res.status(400).json({ error: "Missing fields" });
    }

    const emailLower = email.toLowerCase().trim();
    const existing = await User.findOne({ email: emailLower });
    if (existing) return res.status(409).json({ error: "Email already in use" });

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await User.create({
      firstName,
      lastName,
      phone,
      email: emailLower,
      passwordHash,
    });

    
    const sid = crypto.randomUUID();
    user.sessionId = sid;
    user.sessionDeviceId = req.headers["x-device-id"] || null;
    await user.save();

    const token = jwt.sign(
      { id: user._id.toString(), email: user.email, sid },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.json({
      token,
      user: {
        id: user._id.toString(),
        firstName,
        lastName,
        phone,
        email: user.email,
      },
    });
  } catch (err) {
    console.error("signup error:", err);
    return res.status(500).json({ error: "Server error" });
  }
});


router.post("/login", async (req, res) => {
  try {
    const { email, password, force } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Missing fields" });

    const emailLower = email.toLowerCase().trim();
    const user = await User.findOne({ email: emailLower });
    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: "Invalid credentials" });

    const deviceId = req.headers["x-device-id"] || null;

    
    if (
      user.sessionId &&
      user.sessionDeviceId &&
      deviceId &&
      user.sessionDeviceId !== deviceId &&
      !force
    ) {
      return res.status(409).json({
        error: "Already logged in on another device",
        code: "SESSION_EXISTS",
      });
    }

    
    const sid = crypto.randomUUID();
    user.sessionId = sid;
    user.sessionDeviceId = deviceId;
    await user.save();

    const token = jwt.sign(
      { id: user._id.toString(), email: user.email, sid },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.json({
      token,
      user: {
        id: user._id.toString(),
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        email: user.email,
      },
    });
  } catch (err) {
    console.error("login error:", err);
    return res.status(500).json({ error: "Server error" });
  }
});


router.post("/request-password-reset", async (req, res) => {
  try {
    const email = (req.body.email || "").trim().toLowerCase();
    if (!email) return res.status(400).json({ error: "Email is required" });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: "User not found" });

    const token = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    user.resetTokenHash = tokenHash;
    user.resetTokenExp = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
    await user.save();

    
    const link = `http://localhost:${process.env.PORT || 5001}/api/auth/reset-password?email=${encodeURIComponent(
      email
    )}&token=${token}`;

    console.log("🔐 Password reset link:", link);

    return res.json({
      ok: true,
      message: "Account found. Reset token generated for local/dev reset flow.",
      resetToken: token,
    });
  } catch (err) {
    console.error("request-password-reset error:", err);
    return res.status(500).json({ error: "Could not request password reset" });
  }
});


router.get("/reset-password", (req, res) => {
  const email = (req.query.email || "").toString();
  const token = (req.query.token || "").toString();

  res.setHeader("Content-Type", "text/html");
  res.end(`
    <html>
      <body style="font-family: Arial; max-width: 420px; margin: 40px auto;">
        <h2>Reset Password</h2>
        <p style="opacity:.8">Email: <b>${email}</b></p>
        <form method="POST" action="/api/auth/reset-password">
          <input type="hidden" name="email" value="${email}" />
          <input type="hidden" name="token" value="${token}" />
          <label>New Password</label><br/>
          <input name="newPassword" type="password" style="width:100%; padding:10px; margin:10px 0;" />
          <button style="padding:10px 14px;">Reset</button>
        </form>
      </body>
    </html>
  `);
});


router.post("/reset-password", async (req, res) => {
  try {
    const email = (req.body.email || "").trim().toLowerCase();
    const token = (req.body.token || "").trim();
    const newPassword = (req.body.newPassword || "").toString();

    if (!email || !token || newPassword.length < 6) {
      return res.status(400).json({ message: "Invalid reset request" });
    }

    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      email,
      resetTokenHash: tokenHash,
      resetTokenExp: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({ message: "Reset link expired or invalid" });
    }

    user.passwordHash = await bcrypt.hash(newPassword, 10);

    user.resetTokenHash = undefined;
    user.resetTokenExp = undefined;

    user.sessionId = crypto.randomUUID();
    user.sessionDeviceId = "";

    await user.save();

    return res.json({ ok: true });
  } catch (err) {
    console.error("reset-password error:", err);
    return res.status(500).json({ message: "Reset failed" });
  }
});

module.exports = router;
