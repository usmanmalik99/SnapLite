const express = require("express");
const { requireAuth } = require("../middleware/requireAuth");
const User = require("../models/User");

const router = express.Router();

// List notifications (most recent first)
router.get("/", requireAuth, async (req, res) => {
  try {
    const me = await User.findById(req.user.id).populate(
      "notifications.actorUserId",
      "_id email firstName lastName username"
    );
    if (!me) return res.status(404).json({ error: "User not found" });

    const items = (me.notifications || [])
      .slice()
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 50)
      .map((n) => ({
        id: String(n._id),
        type: n.type,
        message: n.message,
        createdAt: n.createdAt,
        readAt: n.readAt,
        actor: n.actorUserId
          ? {
              id: String(n.actorUserId._id),
              email: n.actorUserId.email,
              firstName: n.actorUserId.firstName,
              lastName: n.actorUserId.lastName,
              username: n.actorUserId.username || "",
            }
          : null,
      }));

    return res.json(items);
  } catch {
    return res.status(500).json({ error: "Server error" });
  }
});

// Mark all notifications as read
router.post("/mark-all-read", requireAuth, async (req, res) => {
  try {
    const me = await User.findById(req.user.id);
    if (!me) return res.status(404).json({ error: "User not found" });
    const now = new Date();
    (me.notifications || []).forEach((n) => {
      if (!n.readAt) n.readAt = now;
    });
    await me.save();
    return res.json({ ok: true });
  } catch {
    return res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
