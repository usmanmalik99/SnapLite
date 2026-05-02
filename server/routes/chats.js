const express = require("express");
const { requireAuth } = require("../middleware/requireAuth");
const Chat = require("../models/Chat");
const Message = require("../models/Message");
const User = require("../models/User");

const router = express.Router();

// In-memory typing indicator store (demo). Not persistent.
// Map<chatId, Map<userId, lastSeenMs>>
const TYPING = new Map();

function setTyping(chatId, userId, isTyping) {
  if (!chatId || !userId) return;
  if (!TYPING.has(chatId)) TYPING.set(chatId, new Map());
  const m = TYPING.get(chatId);
  if (!m) return;
  if (isTyping) m.set(String(userId), Date.now());
  else m.delete(String(userId));
}

function getTyping(chatId, exceptUserId) {
  const m = TYPING.get(chatId);
  if (!m) return [];
  const now = Date.now();
  const out = [];
  for (const [uid, ts] of m.entries()) {
    if (String(uid) === String(exceptUserId)) continue;
    if (now - ts < 3500) out.push(uid); // consider "typing" for 3.5s
  }
  return out;
}

router.get("/", requireAuth, async (req, res) => {
  const uid = req.user.id;
  // Populate members so the client can display a real title instead of "Chat"
  const chats = await Chat.find({ members: uid })
    .sort({ lastMessageAt: -1, createdAt: -1 })
    .populate("members", "_id firstName lastName username email");

  const me = await User.findById(uid).select("blockedUsers");
  const blocked = new Set((me?.blockedUsers || []).map(String));

  const out = chats
    .filter((c) => {
      // Hide chats with users I have blocked
      const memberIds = (c.members || []).map((m) => String(m?._id || m));
      return !memberIds.some((id) => id !== String(uid) && blocked.has(String(id)));
    })
    .map((c) => {
      // Better chat title: show the other person's name for direct chats
      let title = "Chat";
      const memberObjs = Array.isArray(c.members) ? c.members : [];
      if (memberObjs.length === 2) {
        const other = memberObjs.find((m) => String(m._id) !== String(uid));
        if (other) {
          title =
            other.username ||
            [other.firstName, other.lastName].filter(Boolean).join(" ").trim() ||
            other.email ||
            "Chat";
        }
      }

      // Make lastMessage more user-friendly
      const lm = String(c.lastMessage || "");
      const lastMessage =
        lm === "[location]" ? "📍 Location" :
        lm === "[image]" ? "📷 Photo" :
        lm === "[audio]" ? "🎙️ Voice note" :
        lm === "[file]" ? "📎 Attachment" :
        lm === "[screenshot]" ? "📸 Screenshot" :
        lm;

      return {
        _id: c._id.toString(),
        title,
        members: memberObjs.map((m) => String(m?._id || m)),
        lastMessage,
        lastMessageAt: c.lastMessageAt || null,
        createdAt: c.createdAt,
      };
    });

  res.json(out);
});

router.post("/direct", requireAuth, async (req, res) => {
  const uid = req.user.id;
  const { otherUserId } = req.body;
  if (!otherUserId) return res.status(400).json({ error: "Missing otherUserId" });

  // Block checks
  const [me, other] = await Promise.all([
    User.findById(uid).select("blockedUsers"),
    User.findById(otherUserId).select("blockedUsers"),
  ]);
  if (!other) return res.status(404).json({ error: "User not found" });
  if ((me?.blockedUsers || []).map(String).includes(String(otherUserId))) {
    return res.status(403).json({ error: "You have blocked this user" });
  }
  if ((other?.blockedUsers || []).map(String).includes(String(uid))) {
    return res.status(403).json({ error: "You are blocked by this user" });
  }

  let chat = await Chat.findOne({
    members: { $all: [uid, otherUserId] },
    $expr: { $eq: [{ $size: "$members" }, 2] },
  });

  if (!chat) {
    chat = await Chat.create({ members: [uid, otherUserId], lastMessage: "", lastMessageAt: null });
  }

  res.json(chat);
});


router.get("/:chatId", requireAuth, async (req, res) => {
  const uid = req.user.id;
  const { chatId } = req.params;

  const chat = await Chat.findById(chatId).populate("members", "_id firstName lastName username email");
  if (!chat) return res.status(404).json({ error: "Chat not found" });

  const memberIds = (chat.members || []).map((m) => String(m?._id || m));
  if (!memberIds.includes(String(uid))) return res.status(403).json({ error: "Forbidden" });

  let title = "Chat";
  const memberObjs = Array.isArray(chat.members) ? chat.members : [];
  if (memberObjs.length === 2) {
    const other = memberObjs.find((m) => String(m._id) !== String(uid));
    if (other) {
      title =
        other.username ||
        [other.firstName, other.lastName].filter(Boolean).join(" ").trim() ||
        other.email ||
        "Chat";
    }
  }

  res.json({
    _id: chat._id.toString(),
    title,
    members: memberObjs.map((m) => String(m?._id || m)),
    lastMessage: chat.lastMessage || "",
    lastMessageAt: chat.lastMessageAt,
    createdAt: chat.createdAt,
  });
});

// Typing indicator (demo)
router.post("/:chatId/typing", requireAuth, async (req, res) => {
  const uid = req.user.id;
  const { chatId } = req.params;
  const { isTyping } = req.body || {};

  const chat = await Chat.findById(chatId);
  if (!chat) return res.status(404).json({ error: "Chat not found" });
  if (!chat.members.map(String).includes(String(uid))) return res.status(403).json({ error: "Forbidden" });

  setTyping(chatId, uid, !!isTyping);
  return res.json({ ok: true });
});

router.get("/:chatId/typing", requireAuth, async (req, res) => {
  const uid = req.user.id;
  const { chatId } = req.params;

  const chat = await Chat.findById(chatId);
  if (!chat) return res.status(404).json({ error: "Chat not found" });
  if (!chat.members.map(String).includes(String(uid))) return res.status(403).json({ error: "Forbidden" });

  const typingIds = getTyping(chatId, uid);
  return res.json({ typingUserIds: typingIds });
});

router.get("/:chatId/messages", requireAuth, async (req, res) => {
  const uid = req.user.id;
  const { chatId } = req.params;

  const chat = await Chat.findById(chatId);
  if (!chat) return res.status(404).json({ error: "Chat not found" });
  if (!chat.members.map(String).includes(String(uid))) return res.status(403).json({ error: "Forbidden" });

  const now = new Date();
  const msgs = await Message.find({
    chatId,
    $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }],
  })
    .sort({ createdAt: 1 })
    .populate("senderId", "_id email firstName lastName username");

  res.json(
    msgs.map((m) => ({
      ...m.toObject(),
      sender: m.senderId
        ? {
            id: m.senderId._id.toString(),
            email: m.senderId.email,
            firstName: m.senderId.firstName,
            lastName: m.senderId.lastName,
            username: m.senderId.username || "",
          }
        : null,
      senderId: m.senderId?._id ? m.senderId._id.toString() : m.senderId,
    }))
  );
});

router.post("/:chatId/messages", requireAuth, async (req, res) => {
  const uid = req.user.id;
  const { chatId } = req.params;
  const { type, text, expiresAt, mediaUrl, fileName, location } = req.body;

  const chat = await Chat.findById(chatId);
  if (!chat) return res.status(404).json({ error: "Chat not found" });
  if (!chat.members.map(String).includes(String(uid))) return res.status(403).json({ error: "Forbidden" });

  const msg = await Message.create({
    chatId,
    senderId: uid,
    type: type || "text",
    text: text || "",
    mediaUrl: mediaUrl || "",
    fileName: fileName || "",
    location: location && typeof location === "object"
      ? { lat: location.lat ?? null, lng: location.lng ?? null }
      : { lat: null, lng: null },
    createdAt: new Date(),
    expiresAt: expiresAt ? new Date(expiresAt) : null,
  });

  // Make chat list preview look more natural (avoid "[location]" rows)
  if (msg.type === "text") chat.lastMessage = msg.text;
  else if (msg.type === "image") chat.lastMessage = "📷 Photo";
  else if (msg.type === "audio") chat.lastMessage = "🎙️ Voice note";
  else if (msg.type === "file") chat.lastMessage = `📎 ${msg.fileName || "Attachment"}`;
  else if (msg.type === "location") chat.lastMessage = "📍 Location";
  else if (msg.type === "screenshot") chat.lastMessage = "📸 Screenshot";
  else chat.lastMessage = "[message]";
  chat.lastMessageAt = msg.createdAt;
  await chat.save();

  res.json(msg);
});

module.exports = router;
