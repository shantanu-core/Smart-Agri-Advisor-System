# Quick Setup Checklist

## ✅ ESP32 Configuration
- [ ] Install **Firebase ESP32 Client** library in Arduino IDE
- [ ] Install **DHT sensor library** (Adafruit)
- [ ] Install **ArduinoJson** library
- [ ] Update WiFi SSID: `prathmesh`
- [ ] Update WiFi Password: `asdfghjkl`
- [ ] Add Firebase API Key (from Firebase Console > Settings)
- [ ] Keep Database URL: `https://smart-agri-advisor-786e3-default-rtdb.firebaseio.com`
- [ ] Verify GPIO pins:
  - [ ] GPIO 4 → DHT11 DATA
  - [ ] GPIO 34 → Soil Moisture Sensor
- [ ] Upload code to ESP32
- [ ] Monitor Serial output (115200 baud)

## ✅ Firebase Setup
- [ ] Go to [Firebase Console](https://console.firebase.google.com)
- [ ] Select project: `smart-agri-advisor-786e3`
- [ ] Go to **Realtime Database**
- [ ] Update **Rules** with:
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
- [ ] Click **Publish**
- [ ] Verify `/sensor` node is created

## ✅ Website Configuration
- [ ] Open `main.html` in browser
- [ ] Go to **AI Advisory** page
- [ ] Temperature & Humidity should auto-fill (will update every 5 seconds)
- [ ] Check browser console for any Firebase errors
- [ ] Add Gemini API key to `predict.js` for full functionality

## ✅ Testing

### Phase 1: ESP32
```bash
# Serial Monitor should show:
ESP32 Firebase Sensor Integration
Connecting to WiFi: prathmesh
WiFi Connected!
Firebase initialized!
✓ Data sent to Firebase successfully!
```

### Phase 2: Firebase
- [ ] Go to Firebase Console > Realtime Database
- [ ] Look for `/sensor` node
- [ ] Should contain: `temperature`, `humidity`, `soilMoisture`, `timestamp`

### Phase 3: Website
- [ ] Open main.html in browser
- [ ] Click "AI Advisory" tab
- [ ] Temperature and Humidity inputs should be filled automatically
- [ ] Values should update every 5 seconds

## 📋 Files Added/Modified

### New Files:
- ✅ `esp32_firebase_integration.ino` - Complete ESP32 code
- ✅ `ESP32_INTEGRATION_GUIDE.md` - Full integration guide

### Existing Files (No changes needed):
- ✅ `main.html` - Already has Firebase listener configured
- Need to update: `predict.js` - Add Gemini API key

## 🔧 Next: Add Gemini API Key

Edit `predict.js` line 1:
```javascript
// OLD:
const GEMINI_API_KEY = "YOUR_API_KEY_HERE";

// NEW:
const GEMINI_API_KEY = "your-actual-gemini-api-key";
```

Get key from: [Google AI Studio](https://aistudio.google.com/app/apikey)

## 📞 Support

If you need help:
1. Check Serial Monitor output on ESP32
2. Check browser Console (F12) for errors
3. Verify Firebase Rules are published
4. Confirm WiFi connection
5. Check pin connections with multimeter

---

**Status**: Ready to configure → Ready to upload → Ready to test → Full integration complete
