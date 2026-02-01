/* ==========================================
   OVEN X - MASTER AI ENGINE (GEMINI 2.0)
   ========================================== */

const API_KEY = "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";

// These variables will connect to the ones in your index.html
let chatHistory = [];

function toggleAI() {
    const win = document.getElementById('ai-window');
    if(win) {
        win.style.display = (win.style.display === 'flex') ? 'none' : 'flex';
    }
}

function appendMsg(role, text, isError = false) {
    const box = document.getElementById('ai-messages');
    if(!box) return;
    const div = document.createElement('div');
    div.className = isError ? "msg-error" : `msg msg-${role}`;
    div.innerText = text;
    box.appendChild(div);
    box.scrollTop = box.scrollHeight;
    return div;
}

async function sendToAI() {
    const input = document.getElementById('ai-input');
    const val = input.value.trim();
    if(!val) return;

    appendMsg('user', val);
    input.value = "";
    const thinking = appendMsg('bot', "Thinking...");

    // Accessing MENU from the global window (index.html)
    const currentMenu = window.MENU ? JSON.stringify(window.MENU) : "[]";

    const systemPrompt = `You are a Master AI Waiter for Oven X. Brain: Gemini 2.0.
    Menu: ${currentMenu}. 
    - You are highly intelligent. Answer ANY general human question (math, physics, code, history) as the priority.
    - If the user wants to order, return ONLY JSON: {"reply": "...", "action": "add", "item": "Exact Name", "price": 0}.
    - For normal chat, return JSON: {"reply": "...", "action": "none"}.
    - Speak the user's language (Urdu, English, etc).`;

    try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${API_KEY}`,
                "Content-Type": "application/json",
                "HTTP-Referer": window.location.href, 
                "X-Title": "Oven X Official"
            },
            body: JSON.stringify({
                "model": "google/gemini-2.0-flash-001",
                "messages": [
                    { "role": "system", "content": systemPrompt },
                    ...chatHistory,
                    { "role": "user", "content": val }
                ]
            })
        });

        const data = await response.json();
        thinking.remove();

        if (data.error) {
            appendMsg('bot', "Error: " + data.error.message, true);
            return;
        }

        const aiRaw = data.choices[0].message.content;
        
        try {
            // This part handles the JSON cleaning logic you had
            const clean = aiRaw.replace(/```json|```/g, "").trim();
            const result = JSON.parse(clean);
            appendMsg('bot', result.reply);
            
            // This calls the 'add' function located in your index.html
            if(result.action === "add" && typeof window.add === "function") {
                window.add(result.item, result.price);
            }
            
            chatHistory.push({ "role": "user", "content": val }, { "role": "assistant", "content": aiRaw });
        } catch (e) {
            appendMsg('bot', aiRaw);
            chatHistory.push({ "role": "user", "content": val }, { "role": "assistant", "content": aiRaw });
        }

    } catch(e) {
        thinking.innerText = "Check your internet or API balance.";
    }
}
