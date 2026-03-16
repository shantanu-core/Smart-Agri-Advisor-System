// GROQ_API_KEY is declared in dashboard.js (loaded before this script)

// Convert markdown-style text to HTML
function formatAdvice(text) {
    return text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/^#{1,3}\s(.+)$/gm, '<h4 style="margin:10px 0 4px;">$1</h4>')
        .replace(/^[\-\*]\s(.+)$/gm, '<li>$1</li>')
        .replace(/(<li>.*<\/li>)/gs, '<ul style="padding-left:20px;margin:6px 0;">$1</ul>')
        .replace(/\n{2,}/g, '</p><p style="margin:8px 0;">')
        .replace(/\n/g, '<br>');
}

document.getElementById("predictBtn").addEventListener("click", async () => {

    const temperature = document.getElementById("Temperature").value.trim();
    const humidity    = document.getElementById("Humidity").value.trim();
    const nitrogen    = document.getElementById("Nitrogen").value.trim();
    const phosphorous = document.getElementById("Phosphorous").value.trim();
    const potassium   = document.getElementById("Potassium").value.trim();
    const ph          = document.getElementById("pH").value.trim();
    const sunlight    = document.getElementById("Sunlight").value.trim();
    const moisture    = document.getElementById("Moisture").value.trim();

    const resultBox  = document.getElementById("resultBox");
    const cropResult = document.getElementById("cropResult");

    resultBox.style.display = "block";

    // Validate all fields
    if (!temperature || !humidity || !nitrogen || !phosphorous || !potassium || !ph || !sunlight || !moisture) {
        cropResult.innerHTML = '<span style="color:#f39c12;">⚠️ Please fill in all fields before getting advice.</span>';
        return;
    }

    cropResult.innerHTML = '<em style="color:#68d391;">🤖 Analyzing your soil and environment data...</em>';

    const prompt = `Act as an expert agricultural advisor. Given the following real-time soil and environment parameters, provide clear and actionable recommendations:

Temperature: ${temperature}°C
Humidity: ${humidity}%
Nitrogen (N): ${nitrogen} mg/kg
Phosphorous (P): ${phosphorous} mg/kg
Potassium (K): ${potassium} mg/kg
pH Level: ${ph}
Sunlight: ${sunlight} hours/day
Soil Moisture: ${moisture}%

Please provide:
1. **Best Crops to Plant** – top 2-3 crops suited for these conditions
2. **Crop Care Instructions** – watering frequency, sunlight needs
3. **Fertilizer Recommendations** – specific NPK adjustments if needed
4. **Irrigation Advice** – how often and how much to water
5. **Warnings** – any risks or conditions to watch out for

Keep it concise, practical, and farmer-friendly.`;

    try {
        const response = await fetch(`${API_BASE}/api/ai/chat`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                prompt: prompt,
                max_tokens: 700
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            let errorMsg = `Server Error (${response.status})`;
            try {
                const errorJson = JSON.parse(errorText);
                errorMsg = errorJson.error || errorJson.message || errorMsg;
            } catch (e) {}
            cropResult.innerHTML = `<span style="color:#d9534f;">⚠️ ${errorMsg}</span>`;
            return;
        }

        const data = await response.json();

        if (data.choices && data.choices.length > 0) {
            const advice = data.choices[0].message.content;
            cropResult.innerHTML = `<p style="margin:8px 0;">${formatAdvice(advice)}</p>`;

            if (typeof saveToHistory === 'function') {
                saveToHistory({
                    timestamp: new Date().toLocaleString(),
                    temperature, humidity, nitrogen, phosphorous,
                    potassium, ph, sunlight, moisture,
                    prediction: advice
                });
            }
        } else if (data.error) {
            const msg = data.error.message || JSON.stringify(data.error);
            cropResult.innerHTML = `<span style="color:#d9534f;">⚠️ AI Engine: ${msg}</span>`;
            console.error("AI Proxy error:", data.error);
        } else {
            cropResult.innerHTML = '<span style="color:#d9534f;">⚠️ No response from AI. Please try again.</span>';
        }

    } catch (error) {
        console.error("Error generating advice:", error);
        cropResult.innerHTML = `<span style="color:#d9534f;">⚠️ Network connection failed. Please check if your server is online and try again. (${error.message})</span>`;
    }
});
