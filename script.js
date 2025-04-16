// Constants
const ENDPOINT =
  "https://paul--m9jqcefo-australiaeast.cognitiveservices.azure.com";
const API_KEY =
  "4KCL07WJqRj3akmVECEjeXG5XIRSjAIqK4sIx6Kp5LKUVkOD6hXVJQQJ99BDACL93NaXJ3w3AAAAACOGhWno";
const API_VERSION = "2024-05-01-preview";
const ASSISTANT_ID = "asst_jIyUqQWjKHmiDjHBcntfBE3U";

// API functions
async function startNewConversation() {
  try {
    const response = await fetch(
      `${ENDPOINT}/openai/threads?api-version=${API_VERSION}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "api-key": API_KEY,
        },
      }
    );

    return response.json();
  } catch (error) {
    console.error("Error calling Azure Assistant:", error);
  }
}

async function sendMessage({ message, threadId }) {
  try {
    const response = await fetch(
      `${ENDPOINT}/openai/threads/${threadId}/messages?api-version=${API_VERSION}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "api-key": API_KEY,
        },
        body: JSON.stringify({
          role: "user",
          content: message,
        }),
      }
    );

    return response.json();
  } catch (error) {
    console.error("Error calling Azure Assistant:", error);
  }
}

async function getConversation(threadId) {
  try {
    const response = await fetch(
      `${ENDPOINT}/openai/threads/${threadId}/messages?api-version=${API_VERSION}`,
      {
        headers: {
          "Content-Type": "application/json",
          "api-key": API_KEY,
        },
      }
    );

    return response.json();
  } catch (error) {
    console.error("Error calling Azure Assistant:", error);
  }
}

async function runThread(threadId) {
  try {
    const response = await fetch(
      `${ENDPOINT}/openai/threads/${threadId}/runs?api-version=${API_VERSION}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "api-key": API_KEY,
        },
        body: JSON.stringify({
          assistant_id: ASSISTANT_ID,
        }),
      }
    );

    return response.json();
  } catch (error) {
    console.error("Error calling Azure Assistant:", error);
  }
}

async function getRunStatus({ threadId, runId }) {
  try {
    const response = await fetch(
      `${ENDPOINT}/openai/threads/${threadId}/runs/${runId}?api-version=${API_VERSION}`,
      {
        headers: {
          "Content-Type": "application/json",
          "api-key": API_KEY,
        },
      }
    );

    return response.json();
  } catch (error) {
    console.error("Error calling Azure Assistant:", error);
  }
}

// DOM manipulation
let currentThreadId = null;
let isResponsePending = false;

const chatInput = document.getElementById("chat-input");
const submitBtn = document.getElementById("send-btn");
const chatContainer = document.getElementById("chat-container");

function createUserMessageBubble(message) {
  return `<div class="message user-message">
            <div class="message-avatar user-avatar-chat">U</div>
            <div class="message-wrapper">
              <div class="message-content">
                <p>${message}</p>
              </div>
            </div>
          </div>`;
}

function createPendingMessageBubble() {
  return `<div class="message assistant-message message-pending">
            <div class="message-avatar assistant-avatar">E</div>
            <div class="message-wrapper">
              <div class="message-content">
                <p>
                  Génération en cours...
                </p>
              </div>
            </div>
          </div>`;
}

function createAssistantMessageBubble(message) {
  return `<div class="message assistant-message">
            <div class="message-avatar assistant-avatar">E</div>
            <div class="message-wrapper">
              <div class="message-content">
                <p>${message}</p>
              </div>
            </div>
          </div>`;
}

submitBtn.onclick = async () => {
  const message = chatInput.value?.trim();

  if (!message) return;

  submitBtn.disabled = true;
  submitBtn.classList.add("disabled");
  chatInput.disabled = true;
  chatInput.classList.add("disabled");

  if (!currentThreadId) {
    const newThread = await startNewConversation();
    currentThreadId = newThread.id;
  }

  chatContainer.innerHTML += createUserMessageBubble(message);
  chatContainer.scrollTop = chatContainer.scrollHeight; // Scroll to bottom
  chatInput.value = "";

  await sendMessage({ message, threadId: currentThreadId });
  const run = await runThread(currentThreadId);

  const pollInterval = setInterval(async () => {
    const runStatus = await getRunStatus({
      threadId: currentThreadId,
      runId: run.id,
    });

    if (!isResponsePending && runStatus.status === "in_progress") {
      isResponsePending = true;
      chatContainer.innerHTML += createPendingMessageBubble();
      chatContainer.scrollTop = chatContainer.scrollHeight; // Scroll to bottom
    }

    if (runStatus.status === "completed") {
      clearInterval(pollInterval);

      if (isResponsePending) {
        chatContainer.lastChild.remove(); // Remove pending message
        isResponsePending = false;
      }

      const conv = await getConversation(currentThreadId);
      const lastMessage = conv.data[0].content[0].text.value;
      console.log(lastMessage);
      chatContainer.innerHTML += createAssistantMessageBubble(lastMessage);
      chatContainer.scrollTop = chatContainer.scrollHeight; // Scroll to bottom

      //Reactivate user input
      submitBtn.disabled = false;
      submitBtn.classList.remove("disabled");
      chatInput.disabled = false;
      chatInput.classList.remove("disabled");
    }
  }, 700);
};
