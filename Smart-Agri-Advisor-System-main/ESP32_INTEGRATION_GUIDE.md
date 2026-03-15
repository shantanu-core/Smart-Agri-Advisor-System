# ESP32 + Firebase + Smart Agri Advisor System Integration Guide

## Overview
Your ESP32 reads sensor data (Temperature, Humidity, Soil Moisture) and sends it directly to Firebase Realtime Database, where your website receives and displays it.

---

## Step 1: Get Your Firebase Credentials

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project: **smart-agri-advisor-786e3**
3. Go to **Settings** → **Project Settings**
4. Find your **Web API Key** under "Web API Key"
5. Copy this key

---

## Step 2: Install Arduino Libraries

In Arduino IDE:
- **Sketch** → **Include Library** → **Manage Libraries**

Install these libraries:
1. **Firebase ESP32 Client** by Mobizt
   - Search: `firebase esp32`
   - Version: Latest (2.4.x or higher)

2. **DHT sensor library** by Adafruit
   - Already installed (verify in your current code)

3. **ArduinoJson** by Benoit Blanchon
   - Search: `ArduinoJson`

---

## Step 3: Configure Your ESP32 Code

Update your `esp32_firebase_integration.ino` with your credentials:

```cpp
// Line 8-9: Update WiFi credentials
#define WIFI_SSID "prathmesh"
#define WIFI_PASSWORD "asdfghjkl"

// Line 12: Add your Firebase API Key (from Step 1)
#define API_KEY "paste-your-web-api-key-here"

// Line 13: Keep this URL (it's correct for your project)
#define DATABASE_URL "https://smart-agri-advisor-786e3-default-rtdb.firebaseio.com"
```

---

## Step 4: Firebase Realtime Database Rules

Set proper security rules to allow sensor data writes.

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select **smart-agri-advisor-786e3**
3. **Realtime Database** → **Rules** tab
4. Replace with:

```json
{
  "rules": {
    "sensor": {
      ".read": true,
      ".write": true
    },
    ".read": false,
    ".write": false
  }
}
```

5. Click **Publish**

---

## Step 5: Upload to ESP32

1. Connect ESP32 to your computer via USB
2. Select **Tools** → **Board** → **ESP32** → **ESP32 Dev Module**
3. Select correct **COM Port** under **Tools** → **Port**
4. Click **Upload** (Ctrl+U)
5. Open **Serial Monitor** (Ctrl+Shift+M) - Set baud rate to **115200**

You should see:
```
ESP32 Firebase Sensor Integration
Connecting to WiFi: prathmesh
...........
WiFi Connected!
IP Address: 192.168.x.x
Firebase initialized!

=== Sensor Readings ===
Temperature: 25.5 °C
Humidity: 60.2 %
Soil Moisture: 45 %
=======================
✓ Data sent to Firebase successfully!
```

---

## Step 6: Verify Website Integration

Your website (`main.html`) already has Firebase listening code. It will automatically:

1. **Listen** to `/sensor` path in Firebase
2. **Auto-fill** Temperature & Humidity inputs in Advisory form
3. **Update** every 5 seconds (or your ESP32's interval)

### Testing in Browser Console:
```javascript
// Check if Firebase is connected
firebase.database().ref('sensor').once('value', (snapshot) => {
  console.log("Sensor Data:", snapshot.val());
});
```

---

## Step 7: Data Flow Diagram

```
ESP32 (DHT11 + Soil Sensor)
        ↓
    WiFi Network
        ↓
Firebase Realtime Database (/sensor)
        ↓
Website (main.html)
        ↓
Advisory Form (Auto-filled)
        ↓
Gemini API (Get Crop Advice)
```

---

## Step 8: Troubleshooting

### ESP32 not connecting to Firebase?
- Check WiFi is connected first (Serial Monitor will show)
- Verify API Key is copied correctly
- Check Firebase Rules are published

### Temperature/Humidity not appearing in website?
- Open browser **Console** (F12) and check for errors
- Verify `/sensor` path exists in Firebase Database
- Check that both files are using same Firebase credentials

### DHT11 showing NaN errors?
- Verify sensor is connected to GPIO 4
- Check sensor pins: VCC, GND, DATA (middle pin to GPIO4)
- Add 10kΩ pull-up resistor between DATA and VCC

### Soil Moisture reading 0%?
- Check sensor plugged into GPIO 34 (Analog pin)
- Verify sensor is reading analog values (not digital)
- Test with: `analogRead(34)` in Serial Monitor

---

## Important Firebase URLs (Updated)

| Service | URL |
|---------|-----|
| Database | `https://smart-agri-advisor-786e3-default-rtdb.firebaseio.com` |
| Sensor Path | `/sensor` |
| Fields | `temperature`, `humidity`, `soilMoisture` |

---

## Next Steps

1. ✅ Upload ESP32 code
2. ✅ Set Firebase rules
3. ✅ Test sensor readings in Serial Monitor
4. ✅ Check website receives data
5. ✅ Add Gemini API key to `predict.js` for full functionality

---

## Quick Reference: Pin Configuration

```
ESP32 Pin | Component | Connection
----------|-----------|------------
GPIO 4    | DHT11     | DATA pin
VCC (3.3V)| DHT11     | VCC pin
GND       | DHT11     | GND pin
GPIO 34   | Soil      | Analog output
VCC (3.3V)| Soil      | VCC pin
GND       | Soil      | GND pin
```

---

**Author**: Integration Guide for Smart Agri Advisor System
**Date**: March 2026
