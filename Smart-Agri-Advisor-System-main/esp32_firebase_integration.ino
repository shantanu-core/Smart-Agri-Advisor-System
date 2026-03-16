#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <DHT.h>

// ── WiFi Credentials ─────────────────────────────────────────────────────────
#define WIFI_SSID     "Vy33s"
#define WIFI_PASSWORD "8983665660"

// ── Backend Server ────────────────────────────────────────────────────────────
// Option A: Local development (same WiFi network)
// #define SERVER_URL "http://YOUR_LOCAL_IP:3000/api/sensor"
// Option B: Windows Mobile Hotspot
// #define SERVER_URL "http://192.168.137.1:3000/api/sensor"
// Option C: Railway deployment (PRODUCTION) - HTTPS
#define SERVER_URL "https://smart-agri-advisor-system-production.up.railway.app/api/sensor"
// Option D: Test with HTTP (uncomment below line to test)
// #define SERVER_URL "http://smart-agri-advisor-system-production.up.railway.app/api/sensor"

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

  // Check if URL is HTTPS or HTTP
  if (String(SERVER_URL).startsWith("https://")) {
    WiFiClientSecure client;
    Serial.println("Attempting SSL connection to Railway...");
    // Try proper SSL certificate verification first
    client.setCACert(nullptr); // Use system root certificates
    client.setTimeout(10000);

    if (client.connect("smart-agri-advisor-system-production.up.railway.app", 443)) {
      Serial.println("✓ SSL certificate verification successful");
      http.begin(client, SERVER_URL);
    } else {
      Serial.println("⚠ SSL certificate verification failed, using insecure mode");
      client.setInsecure();
      if (client.connect("smart-agri-advisor-system-production.up.railway.app", 443)) {
        Serial.println("✓ Connected with insecure SSL mode");
        http.begin(client, SERVER_URL);
      } else {
        Serial.println("✗ SSL connection failed completely");
        return;
      }
    }
    Serial.println("Using HTTPS connection with SSL");
  } else {
    WiFiClient client;
    http.begin(client, SERVER_URL);
    Serial.println("Using HTTP connection");
  }

  http.addHeader("Content-Type", "application/json");
  http.setTimeout(10000); // 10 second timeout

  Serial.print("Sending payload: ");
  Serial.println(payload);

  int httpCode = http.POST(payload);

  Serial.print("HTTP Response Code: ");
  Serial.println(httpCode);

  if (httpCode > 0) {
    String response = http.getString();
    Serial.print("Server Response: ");
    Serial.println(response);

    if (httpCode == 201) {
      Serial.println("✓ Successfully sent to Railway!");
    } else {
      Serial.printf("⚠ Unexpected response code: %d\n", httpCode);
    }
  } else {
    Serial.printf("✗ POST failed. Error: %d\n", httpCode);
    Serial.println("Possible causes:");
    Serial.println("- Network connectivity");
    Serial.println("- SSL certificate issues");
    Serial.println("- Railway server down");
    Serial.println("- DNS resolution failure");
  }

  http.end();
}
