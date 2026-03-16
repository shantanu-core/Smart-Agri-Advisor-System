// Real-time sensor monitoring and suggestions
// NOTE: This file runs in the browser — API keys are now handled securely by the backend proxy.
const GROQ_API_KEY = "SECRET_HANDLED_BY_BACKEND";

// If no new reading arrives within this many ms, sensor is considered offline
const SENSOR_TIMEOUT_MS = 30000; // 30 seconds (ESP32 sends every 5s)
// Minimum time between AI suggestion regenerations (ms)
const SUGGESTION_COOLDOWN_MS = 60000; // 1 minute

let currentSensorData = {
  temperature: null,
  humidity: null,
  soilMoisture: null
};
let lastSuggestionTime = 0;
let sensorConnected = false;

// Poll MongoDB backend for latest sensor data every 5 seconds
function initializeSensorListener() {
  fetchLatestSensor();
  setInterval(fetchLatestSensor, 5000);
}
// API base — uses global API_BASE from history.js or defaults to current origin
const DASHBOARD_API_BASE = (typeof API_BASE !== "undefined") ? API_BASE : window.location.origin;

async function fetchLatestSensor() {
  try {
    const res = await fetch(`${DASHBOARD_API_BASE}/api/sensor/latest`);
    if (!res.ok) {
      setSensorOffline("No sensor data yet");
      return;
    }
    const data = await res.json();

    // Check how old the last reading is
    const lastUpdated = new Date(data.createdAt).getTime();
    const ageMs = Date.now() - lastUpdated;

    if (ageMs > SENSOR_TIMEOUT_MS) {
      // Reading is stale → sensor disconnected
      setSensorOffline(`Disconnected (last seen ${Math.round(ageMs / 1000)}s ago)`);
      return;
    }

    // Fresh reading → sensor is live
    currentSensorData.temperature  = data.temperature  ?? 0;
    currentSensorData.humidity     = data.humidity     ?? 0;
    currentSensorData.soilMoisture = data.soilMoisture ?? 0;
    sensorConnected = true;
    updateSensorDisplay(data);

    // Only regenerate AI suggestions if cooldown has passed
    const now = Date.now();
    if (now - lastSuggestionTime > SUGGESTION_COOLDOWN_MS) {
      lastSuggestionTime = now;
      generateRealtimeSuggestions();
    }
  } catch (err) {
    console.error("Sensor fetch error:", err);
    setSensorOffline("Server Unreachable");
  }
}

// Called when sensor goes offline — clears values and stops stale display
function setSensorOffline(reason) {
  sensorConnected = false;
  currentSensorData.temperature  = null;
  currentSensorData.humidity     = null;
  currentSensorData.soilMoisture = null;

  document.getElementById("sensorTemp").textContent     = "--";
  document.getElementById("sensorHumidity").textContent = "--";
  document.getElementById("sensorMoisture").textContent = "--";
  updateSensorStatus("Disconnected ✗", "offline");

  const container = document.getElementById("suggestionsContainer");
  if (container) {
    container.innerHTML = `<p style="text-align:center;color:#f39c12;">⚠️ Sensor offline — ${reason}.<br><small style="color:#999;">Suggestions will resume when sensor reconnects.</small></p>`;
  }
}

// Update sensor display on dashboard
function updateSensorDisplay(data) {
  document.getElementById("sensorTemp").textContent     = (data.temperature  ?? 0).toFixed(1);
  document.getElementById("sensorHumidity").textContent = (data.humidity     ?? 0).toFixed(1);
  document.getElementById("sensorMoisture").textContent = (data.soilMoisture ?? 0).toFixed(1);
  updateSensorStatus("Connected ✓", "online");
}

// Update system status with optional state styling
function updateSensorStatus(status, state) {
  const statusElement = document.getElementById("sensorStatus");
  if (!statusElement) return;
  statusElement.textContent = status;
  statusElement.style.color = state === "offline" ? "#ff4c4c"
                            : state === "online"  ? "#68d391"
                            : "#999";
}

// Generate real-time suggestions using Server-side AI Proxy
async function generateRealtimeSuggestions() {
  const container = document.getElementById("suggestionsContainer");

  // Don't run if sensor is offline or data not ready
  if (!sensorConnected || currentSensorData.temperature === null) {
    container.innerHTML = '<p style="text-align: center; color: #999;">Waiting for sensor data...</p>';
    return;
  }
  
  // Show loading state
  container.innerHTML = '<p style="text-align: center; color: #999;">🤖 Analyzing sensor data...</p>';
  container.classList.add("loading");
  
  // Build prompt with current sensor data
  const prompt = `You are an expert agricultural advisor. Based on the following real-time sensor readings from a farm, provide SHORT and specific crop recommendations and immediate care instructions.

SENSOR READINGS:
- Temperature: ${currentSensorData.temperature}°C
- Humidity: ${currentSensorData.humidity}%
- Soil Moisture: ${currentSensorData.soilMoisture}%

Provide:
1. Best crop to plant NOW given these conditions
2. Immediate care instructions (irrigation, shade, etc)
3. 1-2 sentences on fertilizer needs

Keep response concise (3-4 bullet points), farmer-friendly language.`;

  try {
    // Call our internal backend proxy instead of Groq directly
    const response = await fetch(`${DASHBOARD_API_BASE}/api/ai/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        prompt: prompt,
        max_tokens: 300
      })
    });

    const result = await response.json();

    if (result.choices && result.choices.length > 0) {
      const suggestion = result.choices[0].message.content;
      container.innerHTML = `<p>${suggestion.replace(/\n/g, '<br>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}</p>`;
      container.classList.remove("loading");
    } else if (result.error) {
      container.innerHTML = `<p style="color:#d9534f;">⚠️ ${result.error.message || result.error}</p>`;
    } else {
      container.innerHTML = '<p style="color: #999;">Unable to generate suggestions. Try again.</p>';
    }

  } catch (error) {
    console.error("AI Error:", error);
    container.innerHTML = '<p style="color: #d9534f;">Error generating suggestions. Check connection.</p>';
  }
}

// Initialize when page loads or immediately if already loaded
if (document.readyState === "complete" || document.readyState === "interactive") {
  initializeSensorListener();
} else {
  document.addEventListener("DOMContentLoaded", initializeSensorListener);
}