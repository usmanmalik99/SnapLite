const express = require("express");
const { requireAuth } = require("../middleware/requireAuth");
const User = require("../models/User");

const router = express.Router();

/**
 * Save my latest location.
 * body: { lat: number, lng: number }
 */
router.post("/update", requireAuth, async (req, res) => {
  const uid = req.user.id;
  const { lat, lng } = req.body || {};
  if (typeof lat !== "number" || typeof lng !== "number") {
    return res.status(400).json({ error: "lat and lng are required numbers" });
  }

  await User.findByIdAndUpdate(uid, {
    $set: {
      "location.lat": lat,
      "location.lng": lng,
      "location.updatedAt": new Date(),
    },
  });

  res.json({ ok: true });
});

/**
 * Toggle sharing my location with a friend (one-way).
 * body: { friendId: string, enabled: boolean }
 */
router.post("/share", requireAuth, async (req, res) => {
  const uid = req.user.id;
  const { friendId, enabled } = req.body || {};
  if (!friendId) return res.status(400).json({ error: "Missing friendId" });

  const me = await User.findById(uid).select("friends shareLocationWith");
  if (!me) return res.status(404).json({ error: "User not found" });

  const isFriend = (me.friends || []).map(String).includes(String(friendId));
  if (!isFriend) return res.status(403).json({ error: "You can only share location with friends" });

  const already = (me.shareLocationWith || []).map(String).includes(String(friendId));
  const shouldEnable = enabled !== false;

  if (shouldEnable && !already) {
    await User.findByIdAndUpdate(uid, { $addToSet: { shareLocationWith: friendId } });
  } else if (!shouldEnable && already) {
    await User.findByIdAndUpdate(uid, { $pull: { shareLocationWith: friendId } });
  }

  res.json({ ok: true, enabled: shouldEnable });
});

/**
 * Check if I'm sharing my location with a friend.
 */
router.get("/share-status/:friendId", requireAuth, async (req, res) => {
  const uid = req.user.id;
  const { friendId } = req.params;

  const me = await User.findById(uid).select("shareLocationWith");
  if (!me) return res.status(404).json({ error: "User not found" });

  const enabled = (me.shareLocationWith || []).map(String).includes(String(friendId));
  res.json({ enabled });
});

/**
 * Return friends that are sharing their location with me (i.e., I'm included in THEIR shareLocationWith).
 */
router.get("/friends", requireAuth, async (req, res) => {
  const uid = req.user.id;

  const me = await User.findById(uid).select("friends");
  if (!me) return res.status(404).json({ error: "User not found" });

  const friendIds = (me.friends || []).map((x) => x.toString());
  if (friendIds.length === 0) return res.json([]);

  const friendsSharing = await User.find({
    _id: { $in: friendIds },
    shareLocationWith: uid,
    "location.lat": { $ne: null },
    "location.lng": { $ne: null },
  }).select("_id firstName lastName username email location");

  res.json(
    friendsSharing.map((u) => ({
      id: u._id.toString(),
      firstName: u.firstName,
      lastName: u.lastName,
      username: u.username || "",
      email: u.email,
      location: u.location || null,
    }))
  );
});

module.exports = router;
