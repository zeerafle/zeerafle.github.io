function toggleChatbot() {
  const container = document.getElementById("chatbotContainer");
  container.style.display =
    container.style.display === "block" ? "none" : "block";
}

async function ask(baseUrl) {
  const input = document.getElementById("chatbot-input-text");
  const sendButton = document.querySelector(".chatbot-input button");
  const message = input.value;

  // Disable input and button while waiting
  input.disabled = true;
  sendButton.disabled = true;
  input.value = "";

  const chat = document.getElementById("chatbotMessages");
  chat.innerHTML += `<p><strong>You:</strong> ${message}</p>`;

  // Add loading indicator
  const loadingId = "loading-" + Date.now();
  chat.innerHTML += `<p id="${loadingId}"><span class="loading-dots"><span>.</span><span>.</span><span>.</span></span></p>`;
  chat.scrollTop = chat.scrollHeight;

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

    // Remove loading indicator
    const loadingEl = document.getElementById(loadingId);
    if (loadingEl) loadingEl.remove();

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
    chat.scrollTop = chat.scrollHeight;
  } catch {
    // Remove loading indicator on error
    const loadingEl = document.getElementById(loadingId);
    if (loadingEl) loadingEl.remove();

    chat.innerHTML += `<p><hr> <strong>Error:</strong> Network error. Please try again.</p>`;
  } finally {
    // Re-enable input and button after response
    input.disabled = false;
    sendButton.disabled = false;
    input.focus();
  }
}
