(function () {
    // ===== CONTEXT =====
    // Each lesson page can set window.LESSON_CONTEXT before loading this script
    // If not set, defaults to general tutor mode
    const context = window.LESSON_CONTEXT || null;

    const systemPrompt = context
        ? `You are a friendly and encouraging AI tutor on a gamified programming learning platform. The student is currently on: ${context}. 
           Help them understand this specific topic. Keep answers concise and beginner-friendly. 
           If they ask about something unrelated to programming or this lesson, gently redirect them.
           Never give full solutions to coding problems — give hints and guidance instead.
           Use simple language. The student is a teenager learning to code.`
        : `You are a friendly and encouraging AI tutor on a gamified programming learning platform that teaches HTML, CSS and Python.
           Help students with programming questions. Keep answers concise and beginner-friendly.
           Never give full solutions to coding problems — give hints and guidance instead.
           Use simple language. The student is a teenager learning to code.`;

    // ===== STATE =====
    let isOpen = false;
    let isLoading = false;
    let conversationHistory = [];

    // ===== INJECT HTML =====
    const bubble = document.createElement('button');
    bubble.className = 'chat-bubble';
    bubble.innerHTML = `
        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/>
        </svg>
        <span class="notif-dot" id="chatNotifDot"></span>
    `;

    const panel = document.createElement('div');
    panel.className = 'chat-panel';
    panel.innerHTML = `
        <div class="chat-panel-header">
            <div>
                <div class="chat-title">AI Tutor</div>
                <div class="chat-context-tag" id="chatContextTag">${context ? context.split('—')[0].trim() : 'General Help'}</div>
            </div>
            <button class="chat-close-btn" id="chatCloseBtn">✕</button>
        </div>
        <div class="chat-messages" id="chatMessages">
            <div class="chat-msg ai">
                <span class="msg-label">Tutor</span>
                <div class="bubble">${context
            ? `Hey! I can see you're working on <strong>${context.split('—')[0].trim()}</strong>. Ask me anything about this lesson and I'll help you out!`
            : `Hey! I'm your AI tutor. Ask me anything about HTML, CSS or Python and I'll help you out!`
        }</div>
            </div>
        </div>
        <div class="chat-input-area">
            <textarea id="chatInput" placeholder="Ask a question..." rows="1"></textarea>
            <button class="chat-send-btn" id="chatSendBtn">
                <svg viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
            </button>
        </div>
    `;

    document.body.appendChild(bubble);
    document.body.appendChild(panel);

    // ===== TOGGLE =====
    bubble.addEventListener('click', () => {
        isOpen = !isOpen;
        panel.classList.toggle('open', isOpen);
        document.body.classList.toggle('chat-open', isOpen);
        document.getElementById('chatNotifDot').style.display = 'none';
        if (isOpen) {
            setTimeout(() => document.getElementById('chatInput').focus(), 300);
        }
    });

    document.getElementById('chatCloseBtn').addEventListener('click', () => {
        isOpen = false;
        panel.classList.remove('open');
        document.body.classList.remove('chat-open');
    });

    // ===== SEND MESSAGE =====
    async function sendMessage() {
        if (isLoading) return;
        const input = document.getElementById('chatInput');
        const text = input.value.trim();
        if (!text) return;

        input.value = '';
        input.style.height = '40px';
        addMessage('user', text);
        conversationHistory.push({ role: 'user', content: text });

        isLoading = true;
        document.getElementById('chatSendBtn').disabled = true;

        const typingEl = addTyping();

        try {
            const callApi = firebase.functions().httpsCallable('api');
            const result = await callApi({
                model: 'claude-haiku-4-5-20251001',
                max_tokens: 1000,
                system: systemPrompt,
                messages: conversationHistory
            });

            const reply = result.data.content[0].text;
            typingEl.remove();
            addMessage('ai', reply);
            conversationHistory.push({ role: 'assistant', content: reply });

        } catch (err) {
            typingEl.remove();
            addMessage('ai', 'Sorry, I could not connect right now. Check your internet and try again.');
        }

        isLoading = false;
        document.getElementById('chatSendBtn').disabled = false;
    }

    // ===== ADD MESSAGE TO UI =====
    function addMessage(role, text) {
        const messages = document.getElementById('chatMessages');
        const msg = document.createElement('div');
        msg.className = `chat-msg ${role}`;

        // Escape HTML pentru ca tag-urile să apară ca text
        const escaped = text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/\n/g, '<br>');

        msg.innerHTML = `
        <span class="msg-label">${role === 'user' ? 'You' : 'Tutor'}</span>
        <div class="bubble">${escaped}</div>
    `;
        messages.appendChild(msg);
        messages.scrollTop = messages.scrollHeight;
        return msg;
    }

    function addTyping() {
        const messages = document.getElementById('chatMessages');
        const wrapper = document.createElement('div');
        wrapper.className = 'chat-msg ai';
        wrapper.innerHTML = `
            <span class="msg-label">Tutor</span>
            <div class="typing-indicator">
                <span></span><span></span><span></span>
            </div>
        `;
        messages.appendChild(wrapper);
        messages.scrollTop = messages.scrollHeight;
        return wrapper;
    }

    // ===== INPUT EVENTS =====
    document.getElementById('chatSendBtn').addEventListener('click', sendMessage);

    document.getElementById('chatInput').addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    // Auto resize textarea
    document.getElementById('chatInput').addEventListener('input', function () {
        this.style.height = '40px';
        this.style.height = Math.min(this.scrollHeight, 100) + 'px';
    });

    // Show notif dot after 3 seconds if panel never opened
    setTimeout(() => {
        if (!isOpen) {
            document.getElementById('chatNotifDot').style.display = 'block';
        }
    }, 3000);

})();
