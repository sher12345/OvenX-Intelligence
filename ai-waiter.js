/* ==========================================
   OVEN X - DEBUG ENGINE
   ========================================== */

const API_KEY = "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";

// Ensure these are global so HTML can see them
window.chatHistory = window.chatHistory || [];

window.toggleAI = function() {
    const win = document.getElementById('ai-window');
    if(win) win.style.display = (win.style.display === 'flex') ? 'none' : 'flex';
};

function appendMsg(role, text, isError = false) {
    const box = document.getElementById('ai-messages');
    if(!box) return;
    const div = document.createElement('div');
    div.className = isError ? "msg-error" : `msg msg-${role}`;
    
    // Applying styles manually to ensure they show up
    div.style.padding = "12px";
    div.style.borderRadius = "15px";
    div.style.marginBottom = "10px";
    div.style.fontSize = "14px";
    
    if(role === 'user') {
        div.style.background = "#f37021";
        div.style.color = "white";
        div.style.alignSelf = "flex-end";
    } else if(isError) {
        div.style.background = "#ffcccc";
        div.style.color = "red";
        div.style.border = "1px solid red";
    } else {
        div.style.background = "#eeeeee";
        div.style.color = "#333";
        div.style.alignSelf = "flex-start";
    }

    div.innerText = text;
    box.appendChild(div);
    box.scrollTop = box.scrollHeight;
    return div;
}

window.sendToAI = async function() {
    const input = document.getElementById('ai-input');
    if(!input) return;
    const val = input.value.trim();
    if(!val) return;

    appendMsg('user', val);
    input.value = "";
    const thinking = appendMsg('bot', "Thinking...");

    // Grab Menu from HTML window
    const menuData = window.MENU ? JSON.stringify(window.MENU) : "[]";

    try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${API_KEY}`,
                "Content-Type": "application/json",
                "HTTP-Referer": window.location.origin, 
                "X-Title": "Oven X AI"
            },
            body: JSON.stringify({
                "model": "google/gemini-2.0-flash-001",
                "messages": [
                    { "role": "system", "content": `You are Oven X Waiter. Menu: ${menuData}. If ordering, return JSON: {"reply":"..","action":"add","item":"..","price":0}. Else return JSON: {"reply":"..","action":"none"}.` },
                    ...window.chatHistory,
                    { "role": "user", "content": val }
                ]
            })
        });

        const data = await response.json();
        thinking.remove();

        if (data.error) {
            // THIS WILL TELL US THE REAL ERROR
            appendMsg('bot', "API ERROR: " + data.error.message, true);
            console.error("Full Error:", data.error);
            return;
        }

        const aiRaw = data.choices[0].message.content;
        
        try {
            const clean = aiRaw.replace(/```json|```/g, "").trim();
            const result = JSON.parse(clean);
            appendMsg('bot', result.reply);
            
            if(result.action === "add" && typeof window.add === "function") {
                window.add(result.item, result.price);
            }
            
            window.chatHistory.push({ "role": "user", "content": val }, { "role": "assistant", "content": aiRaw });
        } catch (e) {
            appendMsg('bot', aiRaw);
        }

    } catch(err) {
        thinking.innerText = "Network Error: " + err.message;
        console.error("Fetch Error:", err);
    }
};
