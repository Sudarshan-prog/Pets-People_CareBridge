// Quick test script to verify the chatbot API is working
const https = require('https');

async function testChatbot() {
    const testQuestion = "What services do you offer?";

    console.log('\n🧪 Testing Chatbot API...');
    console.log(`📝 Question: "${testQuestion}"\n`);

    const postData = JSON.stringify({ message: testQuestion });

    const options = {
        hostname: 'localhost',
        port: 3000,
        path: '/api/chat',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData)
        }
    };

    const req = https.request('http://localhost:3000/api/chat', options, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
            try {
                const response = JSON.parse(data);
                console.log('✅ RESPONSE RECEIVED:');
                console.log('─'.repeat(50));
                console.log(`Answer: ${response.answer}`);
                console.log(`Mode: ${response.mode}`);
                console.log('─'.repeat(50));

                if (response.mode === 'local') {
                    console.log('\n⚠️ WARNING: Chatbot is in OFFLINE MODE');
                    console.log('This means the Gemini API is not responding.');
                } else {
                    console.log('\n🎉 SUCCESS: Chatbot is using AI mode!');
                }
            } catch (e) {
                console.error('❌ Error parsing response:', e);
            }
        });
    });

    req.on('error', (e) => {
        console.error('❌ Request failed:', e.message);
    });

    req.write(postData);
    req.end();
}

// For simple http instead of https
const http = require('http');

const testQuestion = "What services do you offer?";

console.log('\n🧪 Testing Chatbot API...');
console.log(`📝 Question: "${testQuestion}"\n`);

const postData = JSON.stringify({ message: testQuestion });

const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/chat',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
    }
};

const req = http.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
        try {
            const response = JSON.parse(data);
            console.log('✅ RESPONSE RECEIVED:');
            console.log('═'.repeat(60));
            console.log(`Answer: ${response.answer}`);
            console.log(`Mode: ${response.mode.toUpperCase()}`);
            console.log('═'.repeat(60));

            if (response.mode === 'local') {
                console.log('\n⚠️ WARNING: Chatbot is in OFFLINE MODE');
                console.log('This means the Gemini API is not responding.');
            } else {
                console.log('\n🎉 SUCCESS: Chatbot is using AI mode!');
                console.log('The "Offline Mode" issue is FIXED! ✓');
            }
        } catch (e) {
            console.error('❌ Error parsing response:', e);
            console.error('Raw data:', data);
        }
    });
});

req.on('error', (e) => {
    console.error('❌ Request failed:', e.message);
});

req.write(postData);
req.end();
