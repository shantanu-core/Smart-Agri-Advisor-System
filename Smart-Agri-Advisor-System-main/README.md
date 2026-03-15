🌱 Smart Agri Advisor System

An AI-powered agriculture advisory platform that helps farmers make data-driven crop decisions using environmental parameters and machine learning.

The system analyzes soil nutrients, temperature, humidity, rainfall, and pH levels to recommend the most suitable crops and provide real-time agricultural insights.

🚀 Project Overview

Agriculture plays a critical role in global food production. Farmers often struggle with selecting the right crops due to changing climate conditions and soil variations.

The Smart Agri Advisor System solves this problem by combining:

📊 Data analysis

🤖 Machine learning

☁ Cloud integration

📡 IoT sensor data (ESP32 support)

This system helps farmers optimize crop selection and improve yield through intelligent recommendations.

🧠 Key Features

✅ Crop Recommendation System
Predicts the best crop using soil and weather parameters.

✅ Real-Time Dashboard
Displays environmental data and recommendations.

✅ IoT Integration (ESP32)
Supports sensor-based data collection.

✅ Dataset Analysis Module
Allows viewing and analyzing the agricultural dataset.

✅ Historical Insights
Tracks previous predictions and farming insights.

✅ Responsive Web Interface
Modern UI built using HTML, CSS, and JavaScript.

🏗 System Architecture
User Input / IoT Sensors
        │
        ▼
Backend Server (Node.js)
        │
        ▼
Machine Learning Model
        │
        ▼
Prediction Engine
        │
        ▼
Dashboard & Advisory Interface
🛠 Technologies Used
Frontend

HTML5

CSS3

JavaScript

Backend

Node.js

Express.js

Machine Learning

Crop Recommendation Dataset

Predictive analytics

IoT Integration

ESP32 Microcontroller

API / AI Integration

Groq API

📂 Project Structure
Smart-Agri-Advisor-System
│
├── Dataset/
│   └── Crop_recommendation_dataset.csv
│
├── images/
│
├── dashboard.js
├── predict.js
├── server.js
├── dataset.js
│
├── main.html
├── dashboard.css
├── advisory.css
│
├── package.json
└── README.md
⚙️ Installation & Setup
1️⃣ Clone the repository
git clone https://github.com/shantanu-core/Smart-Agri-Advisor-System.git
2️⃣ Navigate to the project folder
cd Smart-Agri-Advisor-System
3️⃣ Install dependencies
npm install
4️⃣ Create .env file
GROQ_API_KEY=your_api_key_here
5️⃣ Run the server
node server.js

Open in browser:

http://localhost:3000
📊 Dataset Used

Crop recommendation dataset containing:

Nitrogen (N)

Phosphorus (P)

Potassium (K)

Temperature

Humidity

pH value

Rainfall

Used to train the recommendation logic for crop prediction.

🔮 Future Improvements

🌦 Weather API integration

📱 Mobile app version

🌍 Satellite soil analysis integration

🤖 Advanced ML model training

☁ Cloud deployment

👨‍💻 Author

Shantanu

GitHub:
https://github.com/shantanu-core


⭐ If you like this project

Give it a star on GitHub to support the project!