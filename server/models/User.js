const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    resetTokenHash: { type: String },
    resetTokenExp: { type: Date },

    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },

    // Optional but recommended for Snap-style search / add friends
    username: {
      type: String,
      unique: true,
      index: true,
      sparse: true, // ✅ prevents duplicate null usernames
      trim: true,
      lowercase: true,
    },

    passwordHash: { type: String, required: true },

    // ✅ Single-device login
    // Token includes a session id (sid). Backend validates sid matches the current
    // user sessionId; logging in again rotates sessionId, invalidating old tokens.
    sessionId: { type: String, default: null, index: true },
    sessionDeviceId: { type: String, default: null },

    friends: [{ type: mongoose.Schema.Types.ObjectId, ref: "User", default: [] }],
    friendRequestsIn: [{ type: mongoose.Schema.Types.ObjectId, ref: "User", default: [] }],
    friendRequestsOut: [{ type: mongoose.Schema.Types.ObjectId, ref: "User", default: [] }],
    // Location + sharing (Snap Map style)
    location: {
      lat: { type: Number, default: null },
      lng: { type: Number, default: null },
      updatedAt: { type: Date, default: null },
    },

    // List of friend userIds this user is sharing THEIR location with (one-way share)
    shareLocationWith: [{ type: mongoose.Schema.Types.ObjectId, ref: "User", default: [] }],

    // Users this account has blocked (one-way)
    blockedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User", default: [] }],

    // Simple in-app notifications (demo-friendly)
    // Stored on the user so we don't need a separate collection.
    notifications: {
      type: [
        {
          type: {
            type: String,
            enum: ["friend_request", "friend_accepted", "info"],
            required: true,
          },
          actorUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
          message: { type: String, default: "" },
          createdAt: { type: Date, default: Date.now },
          readAt: { type: Date, default: null },
        },
      ],
      default: [],
    },

  },
  {
    timestamps: true, // ✅ gives createdAt + updatedAt automatically
  }
);

// Helpful indexes for quick search
UserSchema.index({ firstName: 1 });
UserSchema.index({ lastName: 1 });

module.exports = mongoose.model("User", UserSchema);
