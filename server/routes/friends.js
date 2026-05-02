const express = require("express");
const { requireAuth } = require("../middleware/requireAuth");
const User = require("../models/User");
const Chat = require("../models/Chat");
const Message = require("../models/Message");

const router = express.Router();

function pushNotification(userDoc, notif) {
  if (!userDoc) return;
  userDoc.notifications = userDoc.notifications || [];
  userDoc.notifications.push({
    type: notif.type,
    actorUserId: notif.actorUserId || null,
    message: notif.message || "",
    createdAt: new Date(),
    readAt: null,
  });
  // keep list small
  if (userDoc.notifications.length > 75) {
    userDoc.notifications = userDoc.notifications.slice(-75);
  }
}

// Send friend request
router.post("/request", requireAuth, async (req, res) => {
  try {
    const uid = req.user.id;
    const { toUserId } = req.body || {};
    if (!toUserId) return res.status(400).json({ error: "Missing toUserId" });
    if (String(toUserId) === String(uid)) return res.status(400).json({ error: "Cannot add yourself" });

    const [me, other] = await Promise.all([
      User.findById(uid),
      User.findById(toUserId),
    ]);
    if (!me || !other) return res.status(404).json({ error: "User not found" });

    const alreadyFriends = me.friends.map(String).includes(String(other._id));
    if (alreadyFriends) return res.json({ ok: true, status: "already_friends" });

    const alreadyOut = me.friendRequestsOut.map(String).includes(String(other._id));
    if (alreadyOut) return res.json({ ok: true, status: "already_requested" });

    // add to outgoing/incoming
    me.friendRequestsOut.push(other._id);
    other.friendRequestsIn.push(me._id);

    // 🔔 notify receiver
    pushNotification(other, {
      type: "friend_request",
      actorUserId: me._id,
      message: "sent you a friend request",
    });

    await Promise.all([me.save(), other.save()]);

    return res.json({ ok: true, status: "sent" });
  } catch (err) {
    return res.status(500).json({ error: "Server error" });
  }
});

// List incoming requests
router.get("/requests", requireAuth, async (req, res) => {
  try {
    const me = await User.findById(req.user.id).populate("friendRequestsIn", "_id email firstName lastName username");
    if (!me) return res.status(404).json({ error: "User not found" });

    return res.json(
      (me.friendRequestsIn || []).map((u) => ({
        id: u._id.toString(),
        email: u.email,
        firstName: u.firstName,
        lastName: u.lastName,
        username: u.username || "",
      }))
    );
  } catch {
    return res.status(500).json({ error: "Server error" });
  }
});

// Accept request
router.post("/accept", requireAuth, async (req, res) => {
  try {
    const uid = req.user.id;
    const { fromUserId } = req.body || {};
    if (!fromUserId) return res.status(400).json({ error: "Missing fromUserId" });

    const [me, other] = await Promise.all([
      User.findById(uid),
      User.findById(fromUserId),
    ]);
    if (!me || !other) return res.status(404).json({ error: "User not found" });

    // remove requests
    me.friendRequestsIn = (me.friendRequestsIn || []).filter((x) => String(x) !== String(other._id));
    other.friendRequestsOut = (other.friendRequestsOut || []).filter((x) => String(x) !== String(me._id));

    // add friends
    if (!me.friends.map(String).includes(String(other._id))) me.friends.push(other._id);
    if (!other.friends.map(String).includes(String(me._id))) other.friends.push(me._id);

    // 🔔 notify requester that it was accepted
    pushNotification(other, {
      type: "friend_accepted",
      actorUserId: me._id,
      message: "accepted your friend request",
    });

    await Promise.all([me.save(), other.save()]);

    return res.json({ ok: true, status: "accepted" });
  } catch {
    return res.status(500).json({ error: "Server error" });
  }
});

// List friends
router.get("/list", requireAuth, async (req, res) => {
  try {
    const me = await User.findById(req.user.id).populate("friends", "_id email firstName lastName username");
    if (!me) return res.status(404).json({ error: "User not found" });

    return res.json(
      (me.friends || []).map((u) => ({
        id: u._id.toString(),
        email: u.email,
        firstName: u.firstName,
        lastName: u.lastName,
        username: u.username || "",
      }))
    );
  } catch {
    return res.status(500).json({ error: "Server error" });
  }
});

// Friend relationship / request status (for UI)
router.get("/status/:otherId", requireAuth, async (req, res) => {
  try {
    const uid = req.user.id;
    const otherId = req.params.otherId;
    if (!otherId) return res.status(400).json({ error: "Missing otherId" });

    const me = await User.findById(uid).select("friends friendRequestsOut friendRequestsIn");
    if (!me) return res.status(404).json({ error: "User not found" });

    const isFriend = (me.friends || []).map(String).includes(String(otherId));
    const requestedOut = (me.friendRequestsOut || []).map(String).includes(String(otherId));
    const requestedIn = (me.friendRequestsIn || []).map(String).includes(String(otherId));

    return res.json({ isFriend, requestedOut, requestedIn });
  } catch {
    return res.status(500).json({ error: "Server error" });
  }
});

// Remove friend (also clears any pending requests + location sharing + direct chat)
router.post("/remove", requireAuth, async (req, res) => {
  try {
    const uid = req.user.id;
    const { otherUserId } = req.body || {};
    if (!otherUserId) return res.status(400).json({ error: "Missing otherUserId" });

    const [me, other] = await Promise.all([
      User.findById(uid),
      User.findById(otherUserId),
    ]);
    if (!me || !other) return res.status(404).json({ error: "User not found" });

    // Remove from friends
    me.friends = (me.friends || []).filter((x) => String(x) !== String(other._id));
    other.friends = (other.friends || []).filter((x) => String(x) !== String(me._id));

    // Clear pending requests (both directions)
    me.friendRequestsIn = (me.friendRequestsIn || []).filter((x) => String(x) !== String(other._id));
    me.friendRequestsOut = (me.friendRequestsOut || []).filter((x) => String(x) !== String(other._id));
    other.friendRequestsIn = (other.friendRequestsIn || []).filter((x) => String(x) !== String(me._id));
    other.friendRequestsOut = (other.friendRequestsOut || []).filter((x) => String(x) !== String(me._id));

    // Stop sharing live location between each other
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

module.exports = router;
