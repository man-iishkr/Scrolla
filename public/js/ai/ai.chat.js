// public/js/ai/ai.chat.js
// AI Chat functionality

let currentChatArticle = null;
let chatMessages = [];

async function showAskAI(articleId) {
  const article = findArticleById(articleId);
  if (!article) return;

  currentChatArticle = article;
  chatMessages = [];

  const modal = document.getElementById('askAiModal');
  const chatContainer = document.getElementById('chatContainer');

  chatContainer.innerHTML = `
    <div class="chat-message">
      <div class="chat-avatar">AI</div>
      <div class="chat-bubble">
        <p>Hi! I'm here to help you understand this article better. Ask me anything about it!</p>
      </div>
    </div>
  `;

  modal.classList.remove('hidden');

  // Focus on input after modal opens
  setTimeout(() => {
    const input = document.getElementById('aiQuestion');
    if (input) input.focus();
  }, 100);
}

async function askAI() {
  const questionInput = document.getElementById('aiQuestion');
  const question = questionInput.value.trim();

  if (!question || !currentChatArticle) return;

  const chatContainer = document.getElementById('chatContainer');

  // Add user message
  addChatMessage('user', question);
  questionInput.value = '';

  // Show typing indicator
  const typingIndicator = document.createElement('div');
  typingIndicator.className = 'chat-message';
  typingIndicator.innerHTML = `
    <div class="chat-avatar">AI</div>
    <div class="typing-indicator">
      <div class="typing-dot"></div>
      <div class="typing-dot"></div>
      <div class="typing-dot"></div>
    </div>
  `;
  chatContainer.appendChild(typingIndicator);
  chatContainer.scrollTop = chatContainer.scrollHeight;

  try {
    const articleContext = getArticleContext(currentChatArticle);
    const answer = await API.ai.askAI(question, articleContext);

    // Remove typing indicator
    typingIndicator.remove();

    // Add AI response
    addChatMessage('ai', answer);

    chatMessages.push(
      { role: 'user', content: question },
      { role: 'assistant', content: answer }
    );

  } catch (error) {
    console.error('Ask AI Error:', error);
    typingIndicator.remove();
    addChatMessage('ai', 'Sorry, I encountered an error. Please try again.');
  }
}

function addChatMessage(role, content) {
  const chatContainer = document.getElementById('chatContainer');
  
  const messageEl = document.createElement('div');
  messageEl.className = `chat-message ${role}`;
  
  const avatarText = role === 'user' ? 'You' : 'AI';
  const timestamp = new Date().toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
  
  messageEl.innerHTML = `
    <div class="chat-avatar">${avatarText}</div>
    <div class="chat-bubble">
      <p>${escapeHtml(content)}</p>
      <div class="chat-timestamp">${timestamp}</div>
    </div>
  `;
  
  chatContainer.appendChild(messageEl);
  chatContainer.scrollTop = chatContainer.scrollHeight;
}

function closeAskAiModal() {
  const modal = document.getElementById('askAiModal');
  modal.classList.add('hidden');
  currentChatArticle = null;
  chatMessages = [];
}

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Make globally available
window.showAskAI = showAskAI;
window.askAI = askAI;
window.closeAskAiModal = closeAskAiModal;