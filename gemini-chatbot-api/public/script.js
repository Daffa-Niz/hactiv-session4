const form = document.getElementById('chat-form');
const input = document.getElementById('user-input');
const chatBox = document.getElementById('chat-box');

form.addEventListener('submit', async function (e) {
  e.preventDefault();

  const userMessage = input.value.trim();
  if (!userMessage) return;

  appendMessage('user', userMessage, 'user-message');
  input.value = '';

  // Show a thinking indicator
  const thinkingMessage = appendMessage('bot', 'Gemini is thinking...', 'bot-message');

  try {
    // Send the user's message to the backend
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message: userMessage }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.reply || 'An error occurred');
    }

    const data = await response.json();
    // Update the thinking message with the actual reply
    thinkingMessage.textContent = data.reply;
  } catch (error) {
    thinkingMessage.textContent = `Error: ${error.message}`;
    thinkingMessage.style.color = 'red';
  }
});

function appendMessage(sender, text, className) {
  const msg = document.createElement('div');
  msg.classList.add('message', className || `${sender}-message`);
  msg.textContent = text;
  chatBox.appendChild(msg);
  chatBox.scrollTop = chatBox.scrollHeight;
  return msg;
}
