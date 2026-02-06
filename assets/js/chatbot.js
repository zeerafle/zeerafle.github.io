function toggleChatbot() {
  const container = document.getElementById("chatbotContainer");
  container.style.display =
    container.style.display === "block" ? "none" : "block";
}

async function ask(baseUrl) {
  const input = document.getElementById("chatbot-input-text");
  const message = input.value;
  input.value = "";

  const chat = document.getElementById("chatbotMessages");
  chat.innerHTML += `<p><strong>You:</strong> ${message}</p>`;

  try {
    const response = await fetch(`${baseUrl}/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: message,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        chat.innerHTML += `<p><hr> <strong>Error:</strong> Sorry rate limit exceeded, I use free tier 😛. Please try again later.</p>`;
        return;
      }

      let detail = "Sorry, something went wrong";
      try {
        const errorData = await response.json();
        if (errorData?.detail) {
          detail = errorData.detail;
        }
      } catch {
        // Ignore JSON parsing errors and use the default message
      }
      chat.innerHTML += `<p><hr> <strong>Error:</strong> ${detail}</p>`;
      return;
    }

    const data = await response.json();
    chat.innerHTML += `<p><hr> ${marked.parse(data.message)}</p>`;
  } catch {
    chat.innerHTML += `<p><hr> <strong>Error:</strong> Network error. Please try again.</p>`;
  }
}
