const chatbotToggler = document.querySelector(".chatbot-toggler");
const closeBtn = document.querySelector(".close-btn");
const chatbox = document.querySelector(".chatbox");
const chatInput = document.querySelector(".chat-input textarea");
const sendChatBtn = document.querySelector(".chat-input span");

let userMessage = null;
const inputInitHeight = chatInput.scrollHeight;

// Backend API endpoint
const API_ENDPOINT = 'http://localhost:3000/api/chat';

const createChatLi = (message, className) => {
    const chatLi = document.createElement("li");
    chatLi.classList.add("chat", className);
    let chatContent = className === "outgoing" ? `<p></p>` : `<span>🤖</span><p></p>`;
    chatLi.innerHTML = chatContent;
    chatLi.querySelector("p").textContent = message;
    return chatLi;
}

const generateResponse = async (userMsg, responseElement) => {
    try {
        const response = await fetch(API_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ message: userMsg })
        });

        if (!response.ok) {
            throw new Error(`Server error: ${response.status}`);
        }

        const data = await response.json();

        // Display the answer
        let displayText = data.answer;

        // Add mode indicator
        if (data.mode === 'local') {
            displayText += ' <br><br><small style="color:#9333ea; opacity:0.7;">(Offline Mode)</small>';
            responseElement.innerHTML = displayText;
        } else if (data.cached) {
            displayText += ' <br><br><small style="color:#059669; opacity:0.7;">(Cached)</small>';
            responseElement.innerHTML = displayText;
        } else {
            responseElement.textContent = displayText;
        }

    } catch (error) {
        console.error("Connection Error:", error);
        responseElement.innerHTML = `❌ Unable to connect to server. Please make sure the backend is running on port 3000.<br><br><small>Run: <code>npm start</code> in terminal</small>`;
    } finally {
        chatbox.scrollTo(0, chatbox.scrollHeight);
    }
}

const handleChat = () => {
    userMessage = chatInput.value.trim();
    if (!userMessage) return;

    chatInput.value = "";
    chatInput.style.height = `${inputInitHeight}px`;

    chatbox.appendChild(createChatLi(userMessage, "outgoing"));
    chatbox.scrollTo(0, chatbox.scrollHeight);

    const incomingChatLi = createChatLi("Thinking...", "incoming");
    chatbox.appendChild(incomingChatLi);
    chatbox.scrollTo(0, chatbox.scrollHeight);

    generateResponse(userMessage, incomingChatLi.querySelector("p"));
}

chatInput.addEventListener("input", () => {
    chatInput.style.height = `${inputInitHeight}px`;
    chatInput.style.height = `${chatInput.scrollHeight}px`;
});

chatInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey && window.innerWidth > 800) {
        e.preventDefault();
        handleChat();
    }
});

sendChatBtn.addEventListener("click", handleChat);
closeBtn.addEventListener("click", () => document.body.classList.remove("show-chatbot"));
chatbotToggler.addEventListener("click", () => document.body.classList.toggle("show-chatbot"));
