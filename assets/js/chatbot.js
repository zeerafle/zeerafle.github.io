function toggleChatbot() {
  const container = document.getElementById('chatbotContainer');
  container.style.display = container.style.display === 'block' ? 'none' : 'block';
}

async function ask(baseUrl) {
    const input = document.getElementById('chatbot-input-text');
    const message = input.value;
    input.value = '';

    const chat = document.getElementById('chatbotMessages');
    chat.innerHTML += `<p><strong>You:</strong> ${message}</p>`;

    const response = await fetch(`${baseUrl}/chat`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            message: message,
        }),
    });

    const data = await response.json();

    chat.innerHTML += `<p><hr> ${data.message}</p>`;
}
