/* ============================================================
   FILE: main.js - 
   ============================================================ */

let lastAction = 0;
let isFirstChat = true;

// --- FITUR MEMORY: Menyimpan konteks obrolan ---
let chatHistory = [
    // Pastikan ini sesuai dengan nama variabel di personality.js (SECURITY_PROMPT)
    { role: "system", content: SECURITY_PROMPT }
];

// Variable State
let currentVersion = "1.0";
// PERBAIKAN 1: Definisi default model di awal
let currentModel = "llama-3.1-8b-instant"; 

function toggleModelMenu() {
    const dropdown = document.getElementById('modelDropdown');
    dropdown.classList.toggle('show');
}

function selectModel(version, type) {
    currentVersion = version;
    
    // 1. Update Teks di Header
    document.getElementById('version-label').innerText = version;
    
    // 2. Update Visual Dropdown
    const items = document.querySelectorAll('.dropdown-item');
    items.forEach(item => {
        item.classList.remove('active');
    });
    
    const selectedItem = (version === "1.0") ? items[0] : items[1];
    selectedItem.classList.add('active');
    
    // 3. Set Model AI (LOGIKA SUDAH BENAR DISINI)
    if(version === "1.0") {
        currentModel = "llama-3.1-8b-instant"; // Model Cepat
    } else {
        currentModel = "llama-3.3-70b-versatile"; // Model Pintar
    }
    
    // Tutup menu
    toggleModelMenu();
}

window.onclick = function(event) {
    if (!event.target.closest('.model-menu-wrapper')) {
        document.getElementById('modelDropdown').classList.remove('show');
    }
}

// 1. FUNGSI UTAMA
async function executeProtokol() {
    const input = document.getElementById('userInput');
    const container = document.getElementById('chat-container');
    const greeting = document.getElementById('greeting');
    const query = input.value.trim();
    const now = Date.now();

    if (!query) return;
    if (now - lastAction < SECURITY_CONFIG.rateLimit) return;

    if (isFirstChat) {
        greeting.style.display = 'none';
        isFirstChat = false;
    }

    lastAction = now;
    
    appendMessage('user', query);
    chatHistory.push({ role: "user", content: query });
    
    input.value = '';
    const aiId = 'xyz-' + now;
    appendMessage('ai', `<span style="opacity:0.6;" id="loading-${aiId}">Berpikir...</span>`, aiId);
    scrollToBottom();

    // 2. LOGIKA SEARCH GAMBAR
    const imageKeywords = ["tunjukkan gambar", "cari gambar", "buatkan gambar", "tampilkan gambar"];
    if (imageKeywords.some(k => query.toLowerCase().includes(k))) {
        handleImageRequest(query, aiId);
        return; 
    }

    // 3. LOGIKA TEKS/CODING
    try {
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${getSecureKey()}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                messages: chatHistory,
                model: currentModel, // PERBAIKAN 2: Panggil variable, jangan hardcode!
                temperature: 0.7,
                max_tokens: SECURITY_CONFIG.maxToken
            })
        });

        const data = await response.json();
        const rawContent = data.choices[0].message.content;

        chatHistory.push({ role: "assistant", content: rawContent });

        if (chatHistory.length > 12) {
            chatHistory.splice(1, 2); 
        }

        const formattedText = processAIResponse(rawContent);

        document.getElementById(aiId).innerHTML = `
            ${formattedText}
            <div class="ai-actions" style="margin-top:15px; display:flex; gap:10px;">
                <button class="copy-btn" onclick="secureCopy('${aiId}')">
                    <span class="material-symbols-rounded" style="font-size:16px;">content_copy</span> Salin Jawaban
                </button>
            </div>
        `;
    } catch (e) {
        document.getElementById(aiId).innerText = "Koneksi terputus. Coba cek API Key atau kuota Groq-mu.";
    }
    scrollToBottom();
}

// 4. FIX RENDER CODE
function processAIResponse(text) {
    const escapeHTML = (str) => str.replace(/[&<>"']/g, m => ({
        '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
    }[m]));

    const codeBlockRegex = /```(?:(\w+)\n)?([\s\S]*?)```/g;
    let processed = text.replace(codeBlockRegex, (match, lang, code) => {
        return `
            <div class="code-wrapper">
                <div class="code-header">
                    <span>${lang || 'code'}</span>
                    <button class="inner-copy" onclick="copyRawCode(this)">Copy</button>
                </div>
                <pre><code>${escapeHTML(code.trim())}</code></pre>
            </div>`;
    });

    processed = processed.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');
    processed = processed.replace(/\*(.*?)\*/g, '<i style="opacity:0.9;">$1</i>');
    processed = processed.replace(/^> (.*$)/gim, '<blockquote>$1</blockquote>');
    processed = processed.replace(/^\* (.*$)/gim, '<div style="margin-bottom: 8px; display: flex; gap: 10px;"><span>•</span> <span>$1</span></div>');
    processed = processed.replace(/\n/g, '<br>');
    
    return processed;
}

// 5. FIX IMAGE SEARCH
function handleImageRequest(query, aiId) {
    let keyword = query.toLowerCase();
    ["tunjukkan gambar", "cari gambar", "buatkan gambar", "tampilkan gambar"].forEach(k => keyword = keyword.replace(k, ""));
    keyword = keyword.trim();

    const imgUrl = `https://pollinations.ai/p/${encodeURIComponent(keyword)}?width=1080&height=720&nologo=true&seed=${Date.now()}`;
    
    document.getElementById(aiId).innerHTML = `
        <p>Visualisasi untuk <b>${keyword}</b>:</p>
        <div class="image-wrapper" style="margin:10px 0; background:#111; border-radius:12px; overflow:hidden; border:1px solid #333;">
            <img src="${imgUrl}" style="width:100%; display:block;" 
                 onload="scrollToBottom()" 
                 onerror="this.src='https://via.placeholder.com/600x400?text=Gagal+Memuat+Gambar'">
        </div>
        <div style="display:flex; gap:10px;">
            <a href="https://www.google.com/search?q=${encodeURIComponent(keyword)}&tbm=isch" target="_blank" class="copy-btn" style="text-decoration:none; color:white; font-size:12px;">
                <span class="material-symbols-rounded" style="font-size:14px;">open_in_new</span> Google Images
            </a>
        </div>
    `;
}

// 6. SECURE COPY
function secureCopy(elementId) {
    const el = document.getElementById(elementId);
    const text = el.innerText.replace("content_copy Salin Jawaban", "").replace("open_in_new Google Images", "").trim();
    navigator.clipboard.writeText(text).then(() => alert("Teks berhasil disalin!"));
}

function copyRawCode(btn) {
    const code = btn.parentElement.nextElementSibling.innerText;
    navigator.clipboard.writeText(code).then(() => {
        btn.innerText = "Copied!";
        setTimeout(() => btn.innerText = "Copy", 2000);
    });
}

// 7. UI HELPERS
function appendMessage(type, content, id = '') {
    const container = document.getElementById('chat-container');
    const icon = type === 'user' ? 'U' : `<img src="https://www.gstatic.com/lamda/images/gemini_sparkle_v002_d4735304ff6292a690345.svg" width="22">`;
    
    container.innerHTML += `
        <div class="message-wrapper ${type}-msg">
            <div class="${type}-icon">${icon}</div>
            <div class="text-content" id="${id}">${content}</div>
        </div>`;
}

function fillInput(text) {
    const input = document.getElementById('userInput');
    if(input) {
        input.value = text;
        input.focus();
    }
}

function scrollToBottom() {
    const container = document.getElementById('chat-container');
    container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
}

document.getElementById('userInput').addEventListener('keypress', (e) => { if (e.key === 'Enter') executeProtokol(); });
