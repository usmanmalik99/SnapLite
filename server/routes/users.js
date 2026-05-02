const express = require("express");
const { requireAuth } = require("../middleware/requireAuth");
const User = require("../models/User");
const Chat = require("../models/Chat");
const Message = require("../models/Message");

const router = express.Router();

// ✅ Current user profile
router.get("/me", requireAuth, async (req, res) => {
  try {
    const u = await User.findById(req.user.id).select("_id email firstName lastName phone username");
    if (!u) return res.status(404).json({ error: "User not found" });
    return res.json({
      id: u._id.toString(),
      email: u.email,
      firstName: u.firstName,
      lastName: u.lastName,
      phone: u.phone,
      username: u.username || "",
    });
  } catch {
    return res.status(500).json({ error: "Server error" });
  }
});

// ✅ Update profile fields
router.patch("/me", requireAuth, async (req, res) => {
  try {
    const { username, firstName, lastName, phone } = req.body || {};
    const updates = {};

    if (typeof username !== "undefined") {
      const u = username === null ? "" : String(username).trim().toLowerCase();
      // allow clearing username by sending null/""
      updates.username = u || undefined;
    }
    if (typeof firstName === "string") updates.firstName = firstName.trim();
    if (typeof lastName === "string") updates.lastName = lastName.trim();
    if (typeof phone === "string") updates.phone = phone.trim();

    const u = await User.findByIdAndUpdate(req.user.id, updates, { new: true, runValidators: true }).select(
      "_id email firstName lastName phone username"
    );
    if (!u) return res.status(404).json({ error: "User not found" });
    return res.json({
      id: u._id.toString(),
      email: u.email,
      firstName: u.firstName,
      lastName: u.lastName,
      phone: u.phone,
      username: u.username || "",
    });
  } catch (err) {
    // handle duplicate username
    if (String(err?.code) === "11000") {
      return res.status(400).json({ error: "Username already taken" });
    }
    return res.status(500).json({ error: "Server error" });
  }
});

// Find user by email (for starting a direct chat)
router.get("/by-email", requireAuth, async (req, res) => {
  try {
    const email = String(req.query.email || "").toLowerCase().trim();
    if (!email) return res.status(400).json({ error: "Missing email" });

    const user = await User.findOne({ email }).select("_id email firstName lastName username");
    if (!user) return res.status(404).json({ error: "User not found" });

    return res.json({
      id: user._id.toString(),
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      username: user.username || "",
    });
  } catch (err) {
    return res.status(500).json({ error: "Server error" });
  }
});

// ✅ Search users by username/name (Snap “Add Friends” search)
router.get("/search", requireAuth, async (req, res) => {
  try {
    const q = String(req.query.q || "").trim();
    if (!q) return res.json([]);

    const regex = new RegExp(q, "i");
    const users = await User.find({
      $or: [{ username: regex }, { firstName: regex }, { lastName: regex }],
    }).select("_id username firstName lastName email");

    return res.json(
      users.map((u) => ({
        id: u._id.toString(),
        username: u.username || "",
        firstName: u.firstName || "",
        lastName: u.lastName || "",
        email: u.email || "",
      }))
    );
  } catch (err) {
    return res.status(500).json({ error: "Server error" });
  }
});

// ✅ List users (People you may know)
router.get("/", requireAuth, async (req, res) => {
  try {
    const meId = req.user.id;
    const users = await User.find({ _id: { $ne: meId } })
      .select("_id email firstName lastName username")
      .sort({ createdAt: -1 });

    return res.json(
      users.map((u) => ({
        id: u._id.toString(),
        email: u.email || "",
        firstName: u.firstName || "",
        lastName: u.lastName || "",
        username: u.username || "",
      }))
    );
  } catch (err) {
    return res.status(500).json({ error: "Server error" });
  }
});

// ✅ Block a user (one-way). Also removes friendship/requests, stops location sharing, and deletes the direct chat.
router.post("/block", requireAuth, async (req, res) => {
  try {
    const uid = req.user.id;
    const { otherUserId } = req.body || {};
    if (!otherUserId) return res.status(400).json({ error: "Missing otherUserId" });
    if (String(otherUserId) === String(uid)) return res.status(400).json({ error: "Cannot block yourself" });

    const [me, other] = await Promise.all([
      User.findById(uid),
      User.findById(otherUserId),
    ]);
    if (!me || !other) return res.status(404).json({ error: "User not found" });

    // Add to blocked list
    me.blockedUsers = me.blockedUsers || [];
    if (!me.blockedUsers.map(String).includes(String(other._id))) me.blockedUsers.push(other._id);

    // Remove friendship + requests (both directions)
    me.friends = (me.friends || []).filter((x) => String(x) !== String(other._id));
    other.friends = (other.friends || []).filter((x) => String(x) !== String(me._id));
    me.friendRequestsIn = (me.friendRequestsIn || []).filter((x) => String(x) !== String(other._id));
    me.friendRequestsOut = (me.friendRequestsOut || []).filter((x) => String(x) !== String(other._id));
    other.friendRequestsIn = (other.friendRequestsIn || []).filter((x) => String(x) !== String(me._id));
    other.friendRequestsOut = (other.friendRequestsOut || []).filter((x) => String(x) !== String(me._id));

    // Stop location sharing between each other
    me.shareLocationWith = (me.shareLocationWith || []).filter((x) => String(x) !== String(other._id));
    other.shareLocationWith = (other.shareLocationWith || []).filter((x) => String(x) !== String(me._id));

    // Delete direct chat + messages so it disappears from Chat list
    const direct = await Chat.findOne({
      members: { $all: [uid, otherUserId] },
      $expr: { $eq: [{ $size: "$members" }, 2] },
    }).select("_id");

    if (direct?._id) {
      await Message.deleteMany({ chatId: direct._id.toString() });
      await Chat.deleteOne({ _id: direct._id });
    }

    await Promise.all([me.save(), other.save()]);
    return res.json({ ok: true });
  } catch {
    return res.status(500).json({ error: "Server error" });
  }
});

// ✅ Get a user by id (for UserProfile screen)
router.get("/:id", requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("_id email firstName lastName username");
    if (!user) return res.status(404).json({ error: "User not found" });

    return res.json({
      id: user._id.toString(),
      email: user.email || "",
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      username: user.username || "",
    });
  } catch {
    return res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
