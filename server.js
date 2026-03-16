const path = require("path");
// Only load .env in development, not on Railway (production)
if (process.env.NODE_ENV !== "production") {
  require("dotenv").config({ path: path.join(__dirname, ".env") });
}
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const https = require("https");

const app = express();
app.use(cors());
app.use(express.json());

// ── Health Check ───────────────────────────────────────────────────────────
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", version: "2.1.2", mongo: mongoConnected });
});

// ── AI Proxy (Groq) ────────────────────────────────────────────────────────
app.post("/api/ai/chat", async (req, res) => {
  try {
    const { prompt, model, max_tokens, temperature } = req.body;
    
    if (!process.env.GROQ_API_KEY) {
      console.error("❌ GROQ_API_KEY is missing in environment variables!");
      return res.status(500).json({ error: "Server Configuration Error: API Key missing." });
    }

    const postData = JSON.stringify({
      model: model || "llama-3.3-70b-specdec",
      messages: [{ role: "user", content: prompt }],
      max_tokens: max_tokens || 700,
      temperature: temperature || 0.7
    });

    const options = {
      hostname: 'api.groq.com',
      path: '/openai/v1/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Length': Buffer.byteLength(postData)
      },
      timeout: 30000 // 30 second timeout
    };

    const groqReq = https.request(options, (groqRes) => {
      let data = '';
      groqRes.on('data', (chunk) => { data += chunk; });
      groqRes.on('end', () => {
        try {
          const parsedData = JSON.parse(data);
          res.status(groqRes.statusCode).json(parsedData);
        } catch (e) {
          console.error("Failed to parse Groq response:", data);
          res.status(500).json({ error: "Invalid response from AI engine" });
        }
      });
    });

    groqReq.on('error', (err) => {
      console.error("Groq Request Error:", err);
      res.status(500).json({ error: "Failed to connect to AI engine" });
    });

    groqReq.write(postData);
    groqReq.end();
  } catch (err) {
    console.error("AI Proxy Internal Error:", err);
    res.status(500).json({ error: "Internal Server Error during AI processing" });
  }
});

// ── MongoDB Atlas connection ────────────────────────────────────────────────
let mongoConnected = false;
const inMemoryHistory = []; // Fallback when MongoDB is unavailable
const inMemorySensor = []; // Fallback for sensor data

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    mongoConnected = true;
    console.log("✅ Connected to MongoDB Atlas");
  })
  .catch((err) => {
    mongoConnected = false;
    console.error("❌ MongoDB connection error:", err.message);
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
    if (mongoConnected) {
      const entry = new Sensor(req.body);
      await entry.save();
      return res.status(201).json(entry);
    }
    const entry = {
      _id: "mem_sensor_" + Date.now() + "_" + Math.random().toString(36).slice(2),
      ...req.body,
      createdAt: new Date(),
    };
    inMemorySensor.push(entry);
    res.status(201).json(entry);
  } catch (err) {
    res.status(500).json({ error: "Failed to save sensor data" });
  }
});

// GET latest sensor reading
app.get("/api/sensor/latest", async (req, res) => {
  try {
    if (mongoConnected) {
      const latest = await Sensor.findOne().sort({ createdAt: -1 });
      if (!latest) return res.status(404).json({ error: "No sensor data yet" });
      return res.json(latest);
    }
    if (inMemorySensor.length === 0) return res.status(404).json({ error: "No sensor data yet" });
    const latest = inMemorySensor[inMemorySensor.length - 1];
    res.json(latest);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch sensor data" });
  }
});

// GET all history entries
app.get("/api/history", async (req, res) => {
  try {
    if (mongoConnected) {
      const entries = await History.find().sort({ createdAt: -1 });
      return res.json(entries);
    }
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

// DELETE history entries
app.delete("/api/history/:id", async (req, res) => {
  try {
    if (mongoConnected) {
      const deleted = await History.findByIdAndDelete(req.params.id);
      if (!deleted) return res.status(404).json({ error: "Entry not found" });
      return res.json({ message: "Entry deleted" });
    }
    const idx = inMemoryHistory.findIndex((e) => e._id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: "Entry not found" });
    inMemoryHistory.splice(idx, 1);
    res.json({ message: "Entry deleted" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete entry" });
  }
});

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
// We serve from the subfolder where the actual files are located
const frontendPath = path.join(__dirname, "Smart-Agri-Advisor-System-main");
app.use(express.static(frontendPath));

// Fallback: serve main.html
app.get("*", (req, res) => {
  res.sendFile(path.join(frontendPath, "main.html"));
});

// ── Start server ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running → http://localhost:${PORT}`);
});
