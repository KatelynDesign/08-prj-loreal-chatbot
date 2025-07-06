/* DOM elements */
const chatForm = document.getElementById("chatForm");
const userInput = document.getElementById("userInput");
const chatWindow = document.getElementById("chatWindow");

// Set initial message
chatWindow.textContent = "👋 Hello! How can I help you today?";

// Track if it's the first user message
let isFirstMessage = true;

// Store the full chat history for context awareness, including the system prompt.
// The system prompt is always included in every API call, so the chatbot follows the rules for every question.
const chatHistory = [
  {
    role: "system",
    content: `🪞💖 You are a friendly and knowledgeable L’Oréal beauty expert who loves helping people discover the perfect products across the entire L’Oréal family of brands — including L’Oréal Paris, Maybelline, Garnier, Lancôme, Kiehl’s, Redken, Matrix, and others. When users ask questions about our products, routines, or recommendations, you share thoughtful, personalized advice, suggest products that might suit their needs, and offer gentle feedback if they have concerns or issues. 💬✨

✨ Your tone should always be warm, welcoming, elegant yet approachable, confident and expert — as if the user is chatting with a real beauty advisor who cares. Add friendly emojis naturally to make replies feel human and engaging. 😊🌷

🌸 When you mention a product, describe its brand, key ingredients, benefits, textures, finishes, and why it could suit the user's needs — but keep it brief and conversational so it feels natural and friendly. Aim to offer suggestions from different L’Oréal brands where relevant, so recommendations feel balanced and tailored. 🧴💅

💄 Only answer questions related to L’Oréal products, beauty routines, and beauty-related topics. If someone asks about something unrelated, warmly and politely explain you can only help with L’Oréal beauty advice, *without answering the unrelated question*. 🙏💕

📝 For example, when asked about beauty products, you might reply like this:

Absolutely! ✨💁‍♀️ I’d love to share some favorites from across the L’Oréal family of brands — each chosen for its unique benefits and textures:

1. **L’Oréal Paris Revitalift 1.5% Hyaluronic Acid + Caffeine Eye Serum 👀✨**  
From L’Oréal Paris, known for effective skincare at accessible prices — this lightweight serum hydrates and visibly reduces puffiness, with a refreshing triple roller applicator. 💧

2. **Lancôme Advanced Génifique Youth Activating Serum 🌟🧬**  
Lancôme specializes in luxury skincare: this silky serum uses probiotics and hyaluronic acid to boost radiance and smooth fine lines, leaving skin glowing. ✨

3. **Maybelline Lash Sensational Sky High Mascara 🖤🌌**  
From Maybelline’s beloved makeup line — bamboo extract and a flexible brush give buildable, weightless length and volume that lasts. 👁️

4. **Kiehl’s Ultra Facial Cream ❄️🧴**  
Kiehl’s blends apothecary tradition with science: this lightweight daily moisturizer hydrates for 24 hours thanks to glacial glycoprotein and squalane. 💦

5. **Redken Acidic Bonding Concentrate Shampoo & Conditioner Duo 💜🧖‍♀️**  
Redken, trusted by professionals, offers this bond-repair duo to strengthen damaged or color-treated hair, protect against breakage, and keep hair shiny. ✨

Is there a specific type of product you’re curious about — skincare, makeup, or hair care? Tell me a bit about your beauty wishes, and I’ll help you find the perfect fit! 💕🌟

📌 And if someone asks something unrelated, politely decline like this:
> “I’d love to help! ✨ But I’m only able to give advice on L’Oréal beauty products and routines. If you have questions about skincare, makeup, or hair care, I’m here for you! 💕😊”
`,
  },
];

// Helper function to scroll chat to the bottom
function scrollChatToBottom() {
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

// Helper function to scroll to the last AI answer
function scrollToLastBotMsg() {
  const botMsgs = chatWindow.querySelectorAll(".bot-msg");
  if (botMsgs.length > 0) {
    botMsgs[botMsgs.length - 1].scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }
}

// Helper function to scroll so both user question and answer are visible
function scrollToUserAndBotMsg() {
  const userMsgs = chatWindow.querySelectorAll(".user-msg");
  const botMsgs = chatWindow.querySelectorAll(".bot-msg");
  if (userMsgs.length > 0 && botMsgs.length > 0) {
    userMsgs[userMsgs.length - 1].scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  } else {
    scrollToLastBotMsg();
  }
}

/* Function to get a chat completion from OpenAI */
async function getChatCompletion(userMessage) {
  // If this is the first user message, clear the initial greeting
  if (isFirstMessage) {
    chatWindow.innerHTML = ""; // Remove the greeting
    isFirstMessage = false;
  }

  // Show user's message in the chat window (append instead of replace)
  chatWindow.innerHTML += `<div class="user-msg">${userMessage}</div>`;
  scrollChatToBottom();

  // Add a space (line break) before the thinking message
  chatWindow.innerHTML += `<br>`;
  scrollChatToBottom();

  // Show a loading message while waiting for the API
  chatWindow.innerHTML += `<div class="bot-msg thinking">Thinking...</div>`;
  scrollChatToBottom();

  // Add the user's message to the chat history
  chatHistory.push({ role: "user", content: userMessage });

  // Use the Cloudflare Worker endpoint to keep your API key secure.
  // The Worker will forward the request to OpenAI and add the API key on the server side.
  const response = await fetch(
    "https://loralchatbot-worker.cq0232.workers.dev/",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // No Authorization header here; the Worker handles the API key
      },
      body: JSON.stringify({
        model: "gpt-4o", // Use the gpt-4o model
        messages: chatHistory, // This includes the system prompt and all previous messages
        temperature: 0.6,
      }),
    }
  );

  // Check if the response is OK
  if (!response.ok) {
    const error = await response.text();
    // Remove the "Thinking..." message before showing the error
    const thinkingMsg = chatWindow.querySelector(".bot-msg.thinking");
    if (thinkingMsg) {
      thinkingMsg.remove();
    }
    chatWindow.innerHTML += `<div class="bot-msg error">Sorry, there was an error: ${error}</div>`;
    scrollToUserAndBotMsg();
    throw new Error(`OpenAI API error: ${error}`);
  }

  // Parse the response data
  const data = await response.json();

  // Get the AI's reply
  const aiReply = data.choices[0].message.content;

  // Add the assistant's reply to the chat history
  chatHistory.push({ role: "assistant", content: aiReply });

  // Remove the "Thinking..." message before showing the answer
  const thinkingMsg = chatWindow.querySelector(".bot-msg.thinking");
  if (thinkingMsg) {
    thinkingMsg.remove();
  }

  // Show the AI's reply in the chat window
  chatWindow.innerHTML += `<div class="bot-msg">${aiReply}</div>`;
  scrollToUserAndBotMsg();

  // Add a space (line break) after the AI's answer for better separation
  chatWindow.innerHTML += `<br>`;
  // Do not scroll after this, so the answer stays in view
}

/* Handle form submit */
chatForm.addEventListener("submit", (e) => {
  e.preventDefault();

  // Get the user's input
  const message = userInput.value.trim();

  if (message) {
    // Call the function to get a chat completion
    getChatCompletion(message).catch(console.error);

    // Clear the input box
    userInput.value = "";
  }
});
