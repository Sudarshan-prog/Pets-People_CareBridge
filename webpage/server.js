const express = require('express');
const cors = require('cors');
const https = require('https');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname)); // Serve static files

// Load knowledge base
let knowledgeBase = [];
try {
    const data = fs.readFileSync(path.join(__dirname, 'knowledge-base.json'), 'utf8');
    knowledgeBase = JSON.parse(data);
    console.log(`✅ Knowledge base loaded: ${knowledgeBase.length} entries`);
} catch (err) {
    console.error('❌ Error loading knowledge base:', err);
}

// Get API Key from environment (simplified, like Python getpass approach)
const GEMINI_API_KEY = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
    console.error('⚠️ WARNING: No GOOGLE_API_KEY or GEMINI_API_KEY found in .env file');
    console.error('⚠️ Chatbot will run in OFFLINE MODE only');
}

// Simple local fallback function
const findBestMatchLocal = (userMsg) => {
    const normalizedMsg = userMsg.toLowerCase();
    let bestMatch = null;
    let maxOverlap = 0;
    const userKeywords = normalizedMsg.split(/\s+/).filter(w => w.length > 3);

    knowledgeBase.forEach(qa => {
        let overlap = 0;
        if (normalizedMsg.includes(qa.q.toLowerCase())) overlap += 100;
        userKeywords.forEach(uk => {
            if (qa.q.toLowerCase().includes(uk)) overlap++;
        });
        if (overlap > maxOverlap) {
            maxOverlap = overlap;
            bestMatch = qa;
        }
    });

    if (bestMatch && maxOverlap > 0) return bestMatch.a;
    return "I'm sorry, I don't have a specific answer for that. Please contact our support team.";
};

// Simple Gemini API call (like Python model.invoke pattern)
const invokeGemini = (userMessage) => {
    return new Promise((resolve, reject) => {
        // Build context from knowledge base
        const contextData = knowledgeBase.map(qa => `Q: ${qa.q}\nA: ${qa.a}`).join('\n\n');

        const prompt = {
            contents: [{
                parts: [{
                    text: `You are CareBridge AI, a helpful assistant for a pet care platform.

Here is your knowledge base:
${contextData}

User Question: ${userMessage}

Provide a helpful, concise answer based on the knowledge base above. Be friendly and professional. If the question is not in your knowledge base, politely say you don't have that information and suggest contacting support.`
                }]
            }]
        };

        const postData = JSON.stringify(prompt);
        // Using gemini-2.5-flash (available until June 2026, matches Python chatbot gemini-2.5-flash)
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            },
            timeout: 10000 // 10 second timeout
        };

        const req = https.request(apiUrl, options, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                if (res.statusCode === 200) {
                    try {
                        const jsonResponse = JSON.parse(data);
                        const answer = jsonResponse.candidates[0].content.parts[0].text;
                        resolve(answer);
                    } catch (e) {
                        reject(new Error('Failed to parse API response'));
                    }
                } else {
                    try {
                        const errorData = JSON.parse(data);
                        reject(new Error(errorData.error?.message || `API Error: ${res.statusCode}`));
                    } catch (e) {
                        reject(new Error(`API Error: ${res.statusCode}`));
                    }
                }
            });
        });

        req.on('error', (e) => reject(e));
        req.on('timeout', () => {
            req.destroy();
            reject(new Error('Request timeout'));
        });

        req.write(postData);
        req.end();
    });
};

// Main chat endpoint (simplified)
app.post('/api/chat', async (req, res) => {
    const { message } = req.body;

    if (!message || typeof message !== 'string') {
        return res.status(400).json({ error: 'Invalid message format' });
    }

    console.log(`📩 User: ${message}`);

    // If no API key, use local fallback immediately
    if (!GEMINI_API_KEY) {
        console.log('⚠️ No API key - using local fallback');
        const localAnswer = findBestMatchLocal(message);
        return res.json({ answer: localAnswer, mode: 'local' });
    }

    // Try Gemini API (like Python model.invoke)
    try {
        const answer = await invokeGemini(message);
        console.log(`✅ Gemini Response: ${answer.substring(0, 50)}...`);
        res.json({ answer, mode: 'ai' });
    } catch (error) {
        console.log(`⚠️ Gemini API failed: ${error.message}`);
        console.log('⚠️ Falling back to local knowledge base');

        // Fallback to local matching
        const localAnswer = findBestMatchLocal(message);
        res.json({ answer: localAnswer, mode: 'local' });
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        knowledgeBase: knowledgeBase.length,
        apiKeyConfigured: !!GEMINI_API_KEY,
        mode: GEMINI_API_KEY ? 'AI Ready' : 'Offline Only'
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`\n🚀 CareBridge Chatbot Server running on http://localhost:${PORT}`);
    console.log(`📚 Knowledge Base: ${knowledgeBase.length} entries`);
    console.log(`🔑 API Key: ${GEMINI_API_KEY ? '✅ Configured' : '❌ Not Found'}`);
    console.log(`🤖 Mode: ${GEMINI_API_KEY ? 'AI + Local Fallback' : 'Local Only'}\n`);
});
