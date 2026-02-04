// Test the Gemini API key directly
const https = require('https');
require('dotenv').config();

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

console.log('🔑 Testing API Key:', GOOGLE_API_KEY ? GOOGLE_API_KEY.substring(0, 15) + '...' : 'NOT FOUND');

if (!GOOGLE_API_KEY) {
    console.error('❌ No API key found in .env file!');
    process.exit(1);
}

// Test with a simple prompt
const prompt = {
    contents: [{
        parts: [{
            text: "Say 'Hello! I'm working!' if you can read this."
        }]
    }]
};

const postData = JSON.stringify(prompt);
const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GOOGLE_API_KEY}`;

const options = {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
    }
};

console.log('\n📡 Sending test request to Gemini API...\n');

const req = https.request(apiUrl, options, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
        console.log(`Status Code: ${res.statusCode}\n`);

        if (res.statusCode === 200) {
            try {
                const jsonResponse = JSON.parse(data);
                const answer = jsonResponse.candidates[0].content.parts[0].text;
                console.log('✅ SUCCESS! API is working!');
                console.log('Response:', answer);
            } catch (e) {
                console.error('❌ Error parsing response:', e.message);
                console.log('Raw response:', data);
            }
        } else {
            console.error('❌ API Error:');
            try {
                const errorData = JSON.parse(data);
                console.error(JSON.stringify(errorData, null, 2));
            } catch (e) {
                console.error(data);
            }
        }
    });
});

req.on('error', (e) => {
    console.error('❌ Request failed:', e.message);
});

req.write(postData);
req.end();
