const mongoose = require("mongoose");

const MessageSchema = new mongoose.Schema(
  {
    chatId: { type: mongoose.Schema.Types.ObjectId, ref: "Chat", required: true, index: true },
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    type: { type: String, enum: ["text", "image", "audio", "file", "location", "screenshot"], default: "text" },
    text: { type: String, default: "" },
    mediaUrl: { type: String, default: "" },
    fileName: { type: String, default: "" },
    location: {
      lat: { type: Number, default: null },
      lng: { type: Number, default: null },
    },
    createdAt: { type: Date, default: () => new Date(), index: true },
    expiresAt: { type: Date, default: null, index: true },
  },
  { versionKey: false }
);

module.exports = mongoose.model("Message", MessageSchema);
