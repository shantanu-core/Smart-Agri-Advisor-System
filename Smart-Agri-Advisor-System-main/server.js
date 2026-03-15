const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// ── MongoDB Atlas connection ────────────────────────────────────────────────
let mongoConnected = false;
const inMemoryHistory = []; // Fallback when MongoDB is unavailable

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    mongoConnected = true;
    console.log("✅ Connected to MongoDB Atlas");
  })
  .catch((err) => {
    mongoConnected = false;
    console.error("❌ MongoDB connection error:", err.message);
    console.error("   → Using in-memory history (Request History will work; data resets when server restarts)");
  });

// ── Schema & Model ──────────────────────────────────────────────────────────
const historySchema = new mongoose.Schema(
  {
    temperature: String,
    humidity: String,
    nitrogen: String,
    phosphorous: String,
    potassium: String,
    ph: String,
    sunlight: String,
    moisture: String,
    prediction: String,
    timestamp: String,
  },
  { timestamps: true }
);

const History = mongoose.model("History", historySchema);

// ── Sensor Schema & Model ────────────────────────────────────────────────────
const sensorSchema = new mongoose.Schema(
  {
    temperature: Number,
    humidity: Number,
    soilMoisture: Number,
  },
  { timestamps: true }
);

const Sensor = mongoose.model("Sensor", sensorSchema);

// ── Routes ──────────────────────────────────────────────────────────────────

// POST sensor data from ESP32
app.post("/api/sensor", async (req, res) => {
  try {
    const entry = new Sensor(req.body);
    await entry.save();
    res.status(201).json(entry);
  } catch (err) {
    res.status(500).json({ error: "Failed to save sensor data" });
  }
});

// GET latest sensor reading (for dashboard polling)
app.get("/api/sensor/latest", async (req, res) => {
  try {
    const latest = await Sensor.findOne().sort({ createdAt: -1 });
    if (!latest) return res.status(404).json({ error: "No sensor data yet" });
    res.json(latest);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch sensor data" });
  }
});

// GET all history entries (newest first)
app.get("/api/history", async (req, res) => {
  try {
    if (mongoConnected) {
      const entries = await History.find().sort({ createdAt: -1 });
      return res.json(entries);
    }
    // In-memory fallback: newest first
    const sorted = [...inMemoryHistory].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    res.json(sorted);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch history" });
  }
});

// POST a new history entry
app.post("/api/history", async (req, res) => {
  try {
    if (mongoConnected) {
      const entry = new History(req.body);
      await entry.save();
      return res.status(201).json(entry);
    }
    // In-memory fallback
    const entry = {
      _id: "mem_" + Date.now() + "_" + Math.random().toString(36).slice(2),
      ...req.body,
      createdAt: Date.now(),
    };
    inMemoryHistory.push(entry);
    res.status(201).json(entry);
  } catch (err) {
    res.status(500).json({ error: "Failed to save history entry" });
  }
});

// DELETE a single history entry by MongoDB _id
app.delete("/api/history/:id", async (req, res) => {
  try {
    if (mongoConnected) {
      const deleted = await History.findByIdAndDelete(req.params.id);
      if (!deleted) return res.status(404).json({ error: "Entry not found" });
      return res.json({ message: "Entry deleted" });
    }
    // In-memory fallback
    const idx = inMemoryHistory.findIndex((e) => e._id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: "Entry not found" });
    inMemoryHistory.splice(idx, 1);
    res.json({ message: "Entry deleted" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete entry" });
  }
});

// DELETE all history entries
app.delete("/api/history", async (req, res) => {
  try {
    if (mongoConnected) {
      await History.deleteMany({});
      return res.json({ message: "All history cleared" });
    }
    inMemoryHistory.length = 0;
    res.json({ message: "All history cleared" });
  } catch (err) {
    res.status(500).json({ error: "Failed to clear history" });
  }
});

// ── Serve frontend static files ───────────────────────────────────────────────
app.use(express.static(path.join(__dirname)));

// Fallback: serve main.html for any unknown routes
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "main.html"));
});

// ── Start server ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  console.log(`🚀 Server running → http://localhost:${PORT}`);
  console.log(`🌐 Open app      → http://localhost:${PORT}/main.html`);
});

server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.log(`\n⚠️  Port ${PORT} is already in use — server is already running.`);
    console.log(`🌐 Open app → http://localhost:${PORT}/main.html\n`);
    process.exit(0);
  } else {
    throw err;
  }
});
