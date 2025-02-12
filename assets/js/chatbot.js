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

    const response = await fetch(baseUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            question: message,
        }),
    });

    const data = await response.json();
    const parsed_answer = marked.parse(data.answer);

    chat.innerHTML += `<p><hr> ${parsed_answer}</p>`;
}
