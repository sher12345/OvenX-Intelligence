/* ==========================================
   OVEN X - MASTER AI WAITER ENGINE (GEMINI 2.0)
   ========================================== */

const AI_CONFIG = {
    key: "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",
    model: "google/gemini-2.0-flash-001"
};

// Toggle Chat Window
function toggleAIChat() {
    const win = document.getElementById('ai-chat-window');
    if(win) {
        win.style.display = (win.style.display === 'flex' ? 'none' : 'flex');
        if(typeof playClick === "function") playClick('pop');
    }
}

// Add messages to bubble
function appendAIMsg(role, text) {
    const box = document.getElementById('ai-msg-container');
    if(!box) return;
    const div = document.createElement('div');
    div.className = `ai-msg ai-msg-${role}`;
    // Applying Multan Theme Styles directly via JS to ensure UI consistency
    div.style.cssText = role === 'user' 
        ? "background: var(--orange); color: white; align-self: flex-end; padding: 12px 16px; border-radius: 20px; border-bottom-right-radius: 2px; max-width: 85%; font-size: 14px; font-weight: 600; margin-bottom: 8px;" 
        : "background: #f0f0f0; color: #333; align-self: flex-start; padding: 12px 16px; border-radius: 20px; border-bottom-left-radius: 2px; max-width: 85%; font-size: 14px; font-weight: 600; margin-bottom: 8px;";
    div.innerText = text;
    box.appendChild(div);
    box.scrollTop = box.scrollHeight;
}

// The Brain Function
async function sendToAI() {
    const input = document.getElementById('ai-input-box');
    const userVal = input.value.trim();
    if(!userVal) return;

    appendAIMsg('user', userVal);
    input.value = "";

    // System instructions for the AI
    const systemPrompt = `You are the human Waiter for Oven X Multan. 
    MENU: ${JSON.stringify(window.menuData || {})}. 
    CURRENT CART: ${JSON.stringify(window.cart || [])}.
    
    RULES:
    1. Speak like a friendly Multani waiter (mix Urdu/English).
    2. NEVER show JSON or code brackets [[ ]] to the customer.
    3. To ADD item: End your reply with hidden tag [[{"action":"add","item":"Name","price":0}]]
    4. To CHECKOUT/WHATSAPP: End with [[{"action":"checkout"}]]
    5. DUPLICATES: Only add if not already in CURRENT CART.
    6. DELIVERY: Explain that location access is needed to calculate the real fee (no fixed charge).`;

    try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: { 
                "Authorization": `Bearer ${AI_CONFIG.key}`,
                "Content-Type": "application/json" 
            },
            body: JSON.stringify({
                "model": AI_CONFIG.model,
                "messages": [
                    { "role": "system", "content": systemPrompt },
                    ...(window.aiChatHistory || []),
                    { "role": "user", "content": userVal }
                ]
            })
        });

        const data = await response.json();
        const aiRaw = data.choices[0].message.content;

        // Cleaning the response for the user
        const parts = aiRaw.split('[[');
        const humanText = parts[0].trim();
        appendAIMsg('bot', humanText);

        // Execute hidden instructions
        if(parts[1]) {
            try {
                const actionData = JSON.parse(parts[1].split(']]')[0]);
                
                if(actionData.action === "add") {
                    // This calls your ORIGINAL function in index.html
                    if(typeof window.updateCartBar === "function") {
                        window.cart.push({ name: actionData.item, price: actionData.price, qty: 1, note: "AI Order" });
                        window.updateCartBar();
                    }
                } else if(actionData.action === "checkout") {
                    toggleAIChat();
                    // This opens your ORIGINAL summary screen and WhatsApp link
                    if(typeof window.startCheckout === "function") window.startCheckout();
                }
            } catch(e) { console.error("Action error", e); }
        }

        if(!window.aiChatHistory) window.aiChatHistory = [];
        window.aiChatHistory.push({ "role": "user", "content": userVal }, { "role": "assistant", "content": aiRaw });

    } catch(err) {
        appendAIMsg('bot', "Bhai, connection slow hai. Please try again.");
    }
}
