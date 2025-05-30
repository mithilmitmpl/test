/**
 * ESOM Chatbot Showcase
 * 
 * This script creates a floating chatbot interface for the ESOM Finance website,
 * allowing users to ask economics and finance questions.
 */

(function() {
    // Configuration
    const config = {
        apiUrl: 'http://localhost:5001/api/chat',
        botName: 'ESOM Finance AI',
        botAvatarUrl: 'assets/esom_logo_nobyline.png', // Path to the bot avatar
        userAvatarUrl: null, // Path to user avatar (null for default icon)
        welcomeMessage: 'Hello! I\'m the ESOM Economics & Finance Assistant. Ask me about economics, finance, or market data!',
        placeholderText: 'Ask something about economics or finance...',
        chatbotPosition: 'right', // 'right' or 'left'
        primaryColor: '#000000', // ESOM's primary color (black)
        accentColor: '#f0ad4e', // Gold accent color
        fontSize: '14px',
        showSources: true, // Whether to display source information
        maxHistoryItems: 20 // Maximum number of chat history items to store
    };

    // State management
    const state = {
        isOpen: false,
        chatHistory: [],
        isLoading: false,
        userId: generateUserId()
    };

    // Create DOM elements
    let chatContainer, chatButton, chatWindow, chatMessages, chatInput, sendButton;

    // Main initialization function
    function init() {
        createChatbotElements();
        attachEventListeners();
        loadChatHistory();
    }

    // Generate a unique user ID
    function generateUserId() {
        const timestamp = new Date().getTime();
        const random = Math.floor(Math.random() * 1000000);
        return `user_${timestamp}_${random}`;
    }

    // Create all the HTML elements for the chatbot
    function createChatbotElements() {
        // Create container
        chatContainer = document.createElement('div');
        chatContainer.className = 'esom-chatbot-container';
        chatContainer.id = 'esom-chatbot-container';
        
        // Create chat button
        chatButton = document.createElement('div');
        chatButton.className = 'esom-chat-button';
        
        const buttonIcon = document.createElement('div');
        buttonIcon.className = 'esom-chat-button-icon';
        buttonIcon.innerHTML = `
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 2H4C2.9 2 2 2.9 2 4V22L6 18H20C21.1 18 22 17.1 22 16V4C22 2.9 21.1 2 20 2Z" fill="white"/>
            </svg>
        `;
        
        chatButton.appendChild(buttonIcon);
        chatContainer.appendChild(chatButton);
        
        // Create chat window
        chatWindow = document.createElement('div');
        chatWindow.className = 'esom-chat-window';
        
        // Chat window header
        const chatHeader = document.createElement('div');
        chatHeader.className = 'esom-chat-header';
        
        const headerLogo = document.createElement('div');
        headerLogo.className = 'esom-chat-header-logo';
        if (config.botAvatarUrl) {
            headerLogo.innerHTML = `<img src="${config.botAvatarUrl}" alt="${config.botName}">`;
        } else {
            headerLogo.innerHTML = `<div class="esom-chat-default-avatar">${config.botName.charAt(0)}</div>`;
        }
        
        const headerTitle = document.createElement('div');
        headerTitle.className = 'esom-chat-header-title';
        headerTitle.textContent = config.botName;
        
        const headerClose = document.createElement('div');
        headerClose.className = 'esom-chat-header-close';
        headerClose.innerHTML = '&times;';
        
        chatHeader.appendChild(headerLogo);
        chatHeader.appendChild(headerTitle);
        chatHeader.appendChild(headerClose);
        chatWindow.appendChild(chatHeader);
        
        // Chat messages container
        chatMessages = document.createElement('div');
        chatMessages.className = 'esom-chat-messages';
        chatWindow.appendChild(chatMessages);
        
        // Chat input area
        const chatInputArea = document.createElement('div');
        chatInputArea.className = 'esom-chat-input-area';
        
        chatInput = document.createElement('input');
        chatInput.type = 'text';
        chatInput.className = 'esom-chat-input';
        chatInput.placeholder = config.placeholderText;
        
        sendButton = document.createElement('button');
        sendButton.className = 'esom-chat-send-button';
        sendButton.innerHTML = `
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M2.01 21L23 12L2.01 3L2 10L17 12L2 14L2.01 21Z" fill="white"/>
            </svg>
        `;
        
        chatInputArea.appendChild(chatInput);
        chatInputArea.appendChild(sendButton);
        chatWindow.appendChild(chatInputArea);
        
        chatContainer.appendChild(chatWindow);
        
        // Add styles
        addStyles();
        
        // Append to body
        document.body.appendChild(chatContainer);
    }

    // Add CSS styles for the chatbot
    function addStyles() {
        const styleElement = document.createElement('style');
        styleElement.textContent = `
            .esom-chatbot-container {
                position: fixed;
                bottom: 20px;
                ${config.chatbotPosition}: 20px;
                z-index: 1000;
                font-family: 'Montserrat', 'Outfit', Arial, sans-serif;
                font-size: ${config.fontSize};
                line-height: 1.5;
            }
            
            .esom-chat-button {
                width: 60px;
                height: 60px;
                border-radius: 50%;
                background-color: ${config.primaryColor};
                color: white;
                display: flex;
                justify-content: center;
                align-items: center;
                cursor: pointer;
                box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
                transition: all 0.3s ease;
            }
            
            .esom-chat-button:hover {
                transform: scale(1.05);
            }
            
            .esom-chat-window {
                position: absolute;
                bottom: 80px;
                ${config.chatbotPosition}: 0;
                width: 350px;
                height: 500px;
                background-color: white;
                border-radius: 10px;
                box-shadow: 0 5px 20px rgba(0, 0, 0, 0.15);
                display: flex;
                flex-direction: column;
                overflow: hidden;
                transform-origin: bottom ${config.chatbotPosition};
                transform: scale(0);
                opacity: 0;
                transition: transform 0.3s ease, opacity 0.3s ease;
            }
            
            .esom-chat-window.open {
                transform: scale(1);
                opacity: 1;
            }
            
            .esom-chat-header {
                display: flex;
                align-items: center;
                padding: 15px;
                background-color: ${config.primaryColor};
                color: white;
                font-weight: bold;
            }
            
            .esom-chat-header-logo {
                width: 30px;
                height: 30px;
                margin-right: 10px;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            .esom-chat-header-logo img {
                width: 100%;
                height: 100%;
                object-fit: contain;
            }
            
            .esom-chat-default-avatar {
                width: 30px;
                height: 30px;
                border-radius: 50%;
                background-color: ${config.accentColor};
                color: white;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: bold;
            }
            
            .esom-chat-header-title {
                flex: 1;
                font-size: 16px;
            }
            
            .esom-chat-header-close {
                font-size: 24px;
                cursor: pointer;
                height: 24px;
                line-height: 24px;
            }
            
            .esom-chat-messages {
                flex: 1;
                overflow-y: auto;
                padding: 15px;
                display: flex;
                flex-direction: column;
            }
            
            .esom-chat-message {
                margin-bottom: 15px;
                display: flex;
                align-items: flex-start;
                animation: fadeIn 0.5s;
            }
            
            @keyframes fadeIn {
                from { opacity: 0; transform: translateY(10px); }
                to { opacity: 1; transform: translateY(0); }
            }
            
            .esom-chat-message-avatar {
                width: 30px;
                height: 30px;
                border-radius: 50%;
                margin-right: 10px;
                display: flex;
                align-items: center;
                justify-content: center;
                flex-shrink: 0;
            }
            
            .esom-chat-message-avatar img {
                width: 100%;
                height: 100%;
                object-fit: cover;
                border-radius: 50%;
            }
            
            .esom-chat-message.bot .esom-chat-message-avatar {
                background-color: ${config.primaryColor};
                color: white;
            }
            
            .esom-chat-message.user .esom-chat-message-avatar {
                background-color: #e0e0e0;
                color: #333;
            }
            
            .esom-chat-message-content {
                padding: 12px 15px;
                border-radius: 18px;
                max-width: 80%;
                word-wrap: break-word;
            }
            
            .esom-chat-message.bot .esom-chat-message-content {
                background-color: #f0f0f0;
                color: #333;
                border-bottom-left-radius: 5px;
            }
            
            .esom-chat-message.user .esom-chat-message-content {
                background-color: ${config.primaryColor};
                color: white;
                margin-left: auto;
                border-bottom-right-radius: 5px;
            }
            
            .esom-chat-message.user {
                flex-direction: row-reverse;
            }
            
            .esom-chat-message.user .esom-chat-message-avatar {
                margin-right: 0;
                margin-left: 10px;
            }
            
            .esom-chat-input-area {
                padding: 15px;
                display: flex;
                background-color: #f9f9f9;
                border-top: 1px solid #eee;
            }
            
            .esom-chat-input {
                flex: 1;
                padding: 12px 15px;
                border: 1px solid #ddd;
                border-radius: 20px;
                font-size: 14px;
                outline: none;
            }
            
            .esom-chat-send-button {
                width: 40px;
                height: 40px;
                margin-left: 10px;
                background-color: ${config.primaryColor};
                color: white;
                border: none;
                border-radius: 50%;
                cursor: pointer;
                display: flex;
                justify-content: center;
                align-items: center;
                transition: background-color 0.3s;
            }
            
            .esom-chat-send-button:hover {
                background-color: ${config.accentColor};
            }
            
            .esom-chat-typing {
                display: flex;
                padding: 10px;
                background-color: #f0f0f0;
                border-radius: 18px;
                margin-bottom: 15px;
                align-items: center;
                animation: fadeIn 0.5s;
            }
            
            .esom-chat-typing-dot {
                width: 8px;
                height: 8px;
                background-color: #666;
                border-radius: 50%;
                margin: 0 2px;
                opacity: 0.6;
                animation: typing 1.2s infinite;
            }
            
            .esom-chat-typing-dot:nth-child(1) {
                animation-delay: 0s;
            }
            
            .esom-chat-typing-dot:nth-child(2) {
                animation-delay: 0.2s;
            }
            
            .esom-chat-typing-dot:nth-child(3) {
                animation-delay: 0.4s;
            }
            
            @keyframes typing {
                0%, 100% {
                    transform: translateY(0);
                }
                50% {
                    transform: translateY(-5px);
                }
            }
            
            .esom-chat-sources {
                font-size: 12px;
                color: #666;
                margin-top: 5px;
                font-style: italic;
            }
            
            .esom-chat-glossary-term {
                font-weight: bold;
                margin-top: 10px;
            }
            
            .esom-chat-market-data {
                font-size: 13px;
                background-color: rgba(240, 173, 78, 0.1);
                padding: 8px 12px;
                border-radius: 8px;
                margin-top: 10px;
                border-left: 3px solid ${config.accentColor};
            }
            
            @media (max-width: 480px) {
                .esom-chat-window {
                    width: calc(100vw - 40px);
                    height: 60vh;
                    bottom: 80px;
                    ${config.chatbotPosition}: 20px;
                }
                
                .esom-chat-message-content {
                    max-width: 85%;
                }
            }
        `;
        document.head.appendChild(styleElement);
    }

    // Attach event listeners for chatbot interactions
    function attachEventListeners() {
        // Toggle chat window when button is clicked
        chatButton.addEventListener('click', toggleChatWindow);
        
        // Close chat window when close button is clicked
        document.querySelector('.esom-chat-header-close').addEventListener('click', closeChatWindow);
        
        // Send message when send button is clicked
        sendButton.addEventListener('click', sendMessage);
        
        // Send message when Enter key is pressed in the input field
        chatInput.addEventListener('keypress', function(event) {
            if (event.key === 'Enter') {
                sendMessage();
            }
        });
    }

    // Toggle chat window open/closed
    function toggleChatWindow() {
        if (state.isOpen) {
            closeChatWindow();
        } else {
            openChatWindow();
        }
    }

    // Open the chat window
    function openChatWindow() {
        chatWindow.classList.add('open');
        state.isOpen = true;
        
        // Add welcome message if chat is empty
        if (chatMessages.children.length === 0) {
            addBotMessage(config.welcomeMessage);
        }
        
        // Focus on input
        setTimeout(() => {
            chatInput.focus();
        }, 300);
    }

    // Close the chat window
    function closeChatWindow() {
        chatWindow.classList.remove('open');
        state.isOpen = false;
    }

    // Send a message to the chatbot API
    function sendMessage() {
        const message = chatInput.value.trim();
        if (!message || state.isLoading) {
            return;
        }
        
        // Add user message to chat
        addUserMessage(message);
        
        // Clear input
        chatInput.value = '';
        
        // Show typing indicator
        showTypingIndicator();
        
        // Set loading state
        state.isLoading = true;
        
        // Prepare the request data
        const requestData = {
            message: message,
            user_id: state.userId,
            chat_history: state.chatHistory
        };
        
        // Send request to API
        fetch(config.apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestData)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            // Remove typing indicator
            removeTypingIndicator();
            
            // Add bot response to chat
            addBotMessage(data.response, data.sources, data.glossary_terms, data.market_data);
            
            // Update chat history
            updateChatHistory({
                role: 'user',
                content: message,
                timestamp: new Date().toISOString()
            }, {
                role: 'bot',
                content: data.response,
                timestamp: data.timestamp || new Date().toISOString()
            });
            
            // Clear loading state
            state.isLoading = false;
        })
        .catch(error => {
            console.error('Error:', error);
            
            // Remove typing indicator
            removeTypingIndicator();
            
            // Add error message
            addBotMessage("I'm sorry, I couldn't process your request at this time. Please try again later.");
            
            // Clear loading state
            state.isLoading = false;
        });
    }

    // Add a user message to the chat
    function addUserMessage(messageText) {
        const messageElement = document.createElement('div');
        messageElement.className = 'esom-chat-message user';
        
        const avatar = document.createElement('div');
        avatar.className = 'esom-chat-message-avatar';
        
        if (config.userAvatarUrl) {
            const img = document.createElement('img');
            img.src = config.userAvatarUrl;
            img.alt = 'User';
            avatar.appendChild(img);
        } else {
            avatar.textContent = '👤';
        }
        
        const content = document.createElement('div');
        content.className = 'esom-chat-message-content';
        content.textContent = messageText;
        
        messageElement.appendChild(avatar);
        messageElement.appendChild(content);
        
        chatMessages.appendChild(messageElement);
        
        // Scroll to bottom
        scrollToBottom();
    }

    // Add a bot message to the chat
    function addBotMessage(messageText, sources = [], glossaryTerms = {}, marketData = {}) {
        const messageElement = document.createElement('div');
        messageElement.className = 'esom-chat-message bot';
        
        const avatar = document.createElement('div');
        avatar.className = 'esom-chat-message-avatar';
        
        if (config.botAvatarUrl) {
            const img = document.createElement('img');
            img.src = config.botAvatarUrl;
            img.alt = config.botName;
            avatar.appendChild(img);
        } else {
            avatar.textContent = config.botName.charAt(0);
        }
        
        const content = document.createElement('div');
        content.className = 'esom-chat-message-content';
        
        // Main message text
        const messageTextElement = document.createElement('div');
        messageTextElement.innerHTML = formatMessage(messageText);
        content.appendChild(messageTextElement);
        
        // Add glossary terms if any
        if (Object.keys(glossaryTerms).length > 0) {
            const glossaryElement = document.createElement('div');
            glossaryElement.className = 'esom-chat-glossary';
            
            for (const [term, definition] of Object.entries(glossaryTerms)) {
                const termElement = document.createElement('div');
                termElement.className = 'esom-chat-glossary-term';
                termElement.textContent = `${term.charAt(0).toUpperCase() + term.slice(1)}:`;
                
                const definitionElement = document.createElement('div');
                definitionElement.textContent = definition;
                
                glossaryElement.appendChild(termElement);
                glossaryElement.appendChild(definitionElement);
            }
            
            content.appendChild(glossaryElement);
        }
        
        // Add market data if any
        if (Object.keys(marketData).length > 0) {
            const marketElement = document.createElement('div');
            marketElement.className = 'esom-chat-market-data';
            
            const marketList = document.createElement('div');
            
            for (const [key, value] of Object.entries(marketData)) {
                const item = document.createElement('div');
                item.innerHTML = `<strong>${key}:</strong> ${value}`;
                marketList.appendChild(item);
            }
            
            marketElement.appendChild(marketList);
            content.appendChild(marketElement);
        }
        
        // Add sources if enabled and available
        if (config.showSources && sources && sources.length > 0) {
            const sourcesElement = document.createElement('div');
            sourcesElement.className = 'esom-chat-sources';
            sourcesElement.textContent = 'Sources: ' + sources.map(s => s.title || s.type).join(', ');
            content.appendChild(sourcesElement);
        }
        
        messageElement.appendChild(avatar);
        messageElement.appendChild(content);
        
        chatMessages.appendChild(messageElement);
        
        // Scroll to bottom
        scrollToBottom();
    }

    // Show typing indicator
    function showTypingIndicator() {
        const typingElement = document.createElement('div');
        typingElement.className = 'esom-chat-typing';
        typingElement.id = 'esom-chat-typing';
        
        // Create dot elements
        for (let i = 0; i < 3; i++) {
            const dot = document.createElement('div');
            dot.className = 'esom-chat-typing-dot';
            typingElement.appendChild(dot);
        }
        
        chatMessages.appendChild(typingElement);
        
        // Scroll to bottom
        scrollToBottom();
    }

    // Remove typing indicator
    function removeTypingIndicator() {
        const typingElement = document.getElementById('esom-chat-typing');
        if (typingElement) {
            typingElement.remove();
        }
    }

    // Format message text with basic Markdown-like formatting
    function formatMessage(text) {
        // Replace URLs with links
        text = text.replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>');
        
        // Replace **bold** with <strong>bold</strong>
        text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        
        // Replace *italic* with <em>italic</em>
        text = text.replace(/\*(.*?)\*/g, '<em>$1</em>');
        
        // Replace line breaks with <br>
        text = text.replace(/\n/g, '<br>');
        
        return text;
    }

    // Scroll chat messages to the bottom
    function scrollToBottom() {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // Update chat history
    function updateChatHistory(userMessage, botMessage) {
        // Add messages to history
        state.chatHistory.push(userMessage, botMessage);
        
        // Limit history size
        if (state.chatHistory.length > config.maxHistoryItems) {
            state.chatHistory = state.chatHistory.slice(-config.maxHistoryItems);
        }
        
        // Save to localStorage
        saveChatHistory();
    }

    // Save chat history to localStorage
    function saveChatHistory() {
        try {
            localStorage.setItem('esom_chat_history', JSON.stringify(state.chatHistory));
        } catch (error) {
            console.error('Could not save chat history:', error);
        }
    }

    // Load chat history from localStorage
    function loadChatHistory() {
        try {
            const savedHistory = localStorage.getItem('esom_chat_history');
            if (savedHistory) {
                state.chatHistory = JSON.parse(savedHistory);
            }
        } catch (error) {
            console.error('Could not load chat history:', error);
        }
    }

    // Initialize when DOM is fully loaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();