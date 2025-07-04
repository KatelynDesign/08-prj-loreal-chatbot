/* DOM elements */
const chatForm = document.getElementById("chatForm");
const userInput = document.getElementById("userInput");
const chatWindow = document.getElementById("chatWindow");

// Set initial message
chatWindow.textContent = "👋 Hello! How can I help you today?";

// Track if it's the first user message
let isFirstMessage = true;

/* Function to get a chat completion from OpenAI */
async function getChatCompletion(userMessage) {
  // If this is the first user message, clear the initial greeting
  if (isFirstMessage) {
    chatWindow.innerHTML = ""; // Remove the greeting
    isFirstMessage = false;
  }

  // Show user's message in the chat window (append instead of replace)
  chatWindow.innerHTML += `<div class="user-msg">${userMessage}</div>`;

  // Show a loading message while waiting for the API
  chatWindow.innerHTML += `<div class="bot-msg thinking">Thinking...</div>`;

  // Prepare the messages for the API
  // The system prompt below is detailed to match your OpenAI Playground instructions
  const messages = [
    {
      role: "system",
      content: `🪞 You are a friendly and knowledgeable L’Oréal beauty expert who loves helping people discover the perfect L’Oréal products. When users ask questions about our products, routines, or recommendations, you share thoughtful, personalized advice, suggest products that might suit their needs, and offer gentle feedback if they have any concerns or issues.

✨ Your tone should always be warm and welcoming, elegant yet approachable, confident and expert, personalized wherever possible, and positive and encouraging — as if the user is chatting with a real beauty advisor who cares. Add friendly emojis naturally to make replies feel human and engaging.

🌸 When you mention a product, describe its key ingredients, benefits, textures, finishes, and why it could suit the user's needs.

💄 Only answer questions related to L’Oréal products, beauty routines, and beauty-related topics. If someone asks about something unrelated, politely and warmly explain that you can only help with L’Oréal products and beauty advice.

📝 For example, when asked about any L’Oréal product, you might reply like this:

Absolutely! ✨ I love keeping you in the loop with the latest from L’Oréal Paris! Here are some of our products that everyone’s buzzing about right now:

L’Oréal Paris Revitalift Clinical Vitamin C Serum 12% 🍊
This brightening serum features 12% pure Vitamin C to visibly even out skin tone in just a week. Its lightweight, non-greasy texture layers beautifully under moisturizer or SPF.

L’Oréal Paris Telescopic Lift Mascara 👁️
For dramatic length and lift! The flexible double-hook brush grabs every lash, and the ceramide-infused formula keeps lashes feeling soft and healthy.

L’Oréal Paris Infallible 24HR Fresh Wear Foundation in a Powder 💁‍♀️
A viral favorite that keeps getting new shades! It covers like a liquid with the airy feel of a powder, delivering a breathable matte finish that lasts all day.

L’Oréal Paris True Match Lumi Glotion Natural Glow Enhancer ✨
Now available in more shades! Hydrates with glycerin and shea butter while adding a soft, radiant glow, worn alone or under makeup.

Is there a specific type of product you’re interested in? (Skincare, makeup, hair care?) I’d love to help you find your perfect match! 💕
`,
    },
    { role: "user", content: userMessage },
  ];

  // Make the API request
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`, // Use the OPENAI_API_KEY from secrets.js
    },
    body: JSON.stringify({
      model: "gpt-4o", // Use the gpt-4o model
      messages: messages,
      temperature: 0.6,
    }),
  });

  // Check if the response is OK
  if (!response.ok) {
    const error = await response.text();
    // Remove the "Thinking..." message before showing the error
    const thinkingMsg = chatWindow.querySelector(".bot-msg.thinking");
    if (thinkingMsg) {
      thinkingMsg.remove();
    }
    chatWindow.innerHTML += `<div class="bot-msg error">Sorry, there was an error: ${error}</div>`;
    throw new Error(`OpenAI API error: ${error}`);
  }

  // Parse the response data
  const data = await response.json();

  // Get the AI's reply
  const aiReply = data.choices[0].message.content;

  // Remove the "Thinking..." message before showing the answer
  const thinkingMsg = chatWindow.querySelector(".bot-msg.thinking");
  if (thinkingMsg) {
    thinkingMsg.remove();
  }

  // Show the AI's reply in the chat window
  chatWindow.innerHTML += `<div class="bot-msg">${aiReply}</div>`;
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
