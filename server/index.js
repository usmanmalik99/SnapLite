require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const authRoutes = require("./routes/auth");
const chatsRoutes = require("./routes/chats");
const usersRoutes = require("./routes/users");
const friendsRoutes = require("./routes/friends");
const locationRoutes = require("./routes/location");
const notificationsRoutes = require("./routes/notifications");

const app = express();

// ✅ middleware MUST be after app is created
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // ✅ needed for reset-password HTML form

app.get("/health", (req, res) => res.json({ ok: true }));

app.use("/api/auth", authRoutes);
app.use("/api/chats", chatsRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/friends", friendsRoutes);
app.use("/api/location", locationRoutes);
app.use("/api/notifications", notificationsRoutes);

async function start() {
  if (!process.env.MONGO_URI) {
    console.error("Missing MONGO_URI in .env");
    process.exit(1);
  }
  if (!process.env.JWT_SECRET) {
    console.error("Missing JWT_SECRET in .env");
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI);
  console.log("✅ Mongo connected");

  const port = process.env.PORT || 5001;
  app.listen(port, () => console.log(`✅ API running on http://localhost:${port}`));
}

start().catch((e) => {
  console.error("❌ Failed to start:", e.message);
  process.exit(1);
});
