#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <DHT.h>

// ── WiFi Credentials ─────────────────────────────────────────────────────────
#define WIFI_SSID     "YOUR_WIFI_NAME"       // e.g. "prathmesh"
#define WIFI_PASSWORD "YOUR_WIFI_PASSWORD"   // e.g. "asdfghjkl"

// ── Backend Server ────────────────────────────────────────────────────────────
// Option A: Same WiFi network → use laptop's IPv4 (run ipconfig to find it)
// #define SERVER_URL "http://10.252.47.161:3000/api/sensor"
// Option B: Windows Mobile Hotspot → laptop IP is always 192.168.137.1
// #define SERVER_URL "http://192.168.137.1:3000/api/sensor"
// Option C: Active network IP
#define SERVER_URL "http://192.168.43.161:3000/api/sensor"

// ── Sensor Pins ───────────────────────────────────────────────────────────────
#define DHTPIN 4      // DHT11 data pin → GPIO 4
#define DHTTYPE DHT11
#define SOIL_MOISTURE_PIN 34     // Soil moisture analog pin → GPIO 34

DHT dht(DHTPIN, DHTTYPE);
unsigned long lastSendTime = 0;
const unsigned long SEND_INTERVAL = 5000; // send every 5 seconds

// ─────────────────────────────────────────────────────────────────────────────
void setup() {
  Serial.begin(115200);
  dht.begin();
  analogReadResolution(12);
  connectWiFi();
}

void loop() {
  if (WiFi.status() != WL_CONNECTED) connectWiFi();

  if (millis() - lastSendTime >= SEND_INTERVAL) {
    lastSendTime = millis();
    readAndSend();
  }
}

// ── WiFi ──────────────────────────────────────────────────────────────────────
void connectWiFi() {
  Serial.print("Connecting to WiFi");
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  for (int i = 0; i < 30 && WiFi.status() != WL_CONNECTED; i++) {
    delay(500); Serial.print(".");
  }
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\nWiFi Connected! IP: " + WiFi.localIP().toString());
  } else {
    Serial.println("\nWiFi FAILED - retrying in loop");
  }
}

// ── Read sensors & POST to MongoDB backend ────────────────────────────────────
void readAndSend() {
  float temperature  = dht.readTemperature();
  float humidity     = dht.readHumidity();
  int   soilMoisture = constrain(map(analogRead(SOIL_MOISTURE_PIN), 4095, 0, 0, 100), 0, 100);

  if (isnan(temperature) || isnan(humidity)) {
    Serial.println("DHT read error!"); return;
  }

  Serial.printf("[Sensor] Temp: %.1f°C  Humidity: %.1f%%  Soil: %d%%\n",
                temperature, humidity, soilMoisture);

  // Build JSON payload
  StaticJsonDocument<128> doc;
  doc["temperature"]  = temperature;
  doc["humidity"]     = humidity;
  doc["soilMoisture"] = soilMoisture;

  String payload;
  serializeJson(doc, payload);

  // POST to Node.js backend → MongoDB Atlas
  HTTPClient http;
  http.begin(SERVER_URL);
  http.addHeader("Content-Type", "application/json");

  int httpCode = http.POST(payload);

  if (httpCode == 201) {
    Serial.println("✓ Sent to MongoDB via backend");
  } else {
    Serial.printf("✗ POST failed. HTTP code: %d\n", httpCode);
  }

  http.end();
}
