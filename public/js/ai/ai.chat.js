// public/js/ai/ai.chat.js

let currentItem = null;

export function openAskAiForItem(item) {
  currentItem = item;

  const modal = document.getElementById("ai-chat-modal");
  const box = document.getElementById("ai-chat-history");

  if (!modal || !box) return;

  box.innerHTML = `
    <div class="ai-msg">
      Ask anything about:<br>
      <strong>${item.title}</strong>
    </div>
  `;

  modal.classList.remove("hidden");
}
document.addEventListener("click", async (e) => {
  if (e.target.id !== "ai-send") return;

  const input = document.getElementById("ai-input");
  const history = document.getElementById("ai-chat-history");

  const question = input.value.trim();
  if (!question) return;

  history.innerHTML += `<div class="ai-user">${question}</div>`;
  input.value = "";

  const res = await fetch("/api/ai/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question })
  });

  const data = await res.json();

  history.innerHTML += `<div class="ai-bot">${data.answer || "No response"}</div>`;
});
