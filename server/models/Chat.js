const mongoose = require("mongoose");

const ChatSchema = new mongoose.Schema({
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }],
  lastMessage: { type: String, default: "" },
  lastMessageAt: { type: Date, default: null },
  createdAt: { type: Date, default: () => new Date() },
});

module.exports = mongoose.model("Chat", ChatSchema);
