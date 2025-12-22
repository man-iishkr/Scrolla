// public/js/ai/ai.summary.js

export function openSummaryForItem(item) {
  const modal = document.getElementById("summary-modal");
  const box = document.getElementById("summary-content");

  if (!modal || !box) return;

  box.textContent = "Generating summary...";
  modal.classList.remove("hidden");

  // backend hook already exists
  fetch("/api/ai/summary", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: item.title,
      content: item.description || ""
    })
  })
    .then(r => r.json())
    .then(d => {
      box.textContent = d.summary || "Summary unavailable.";
    })
    .catch(() => {
      box.textContent = "Summary failed.";
    });
}
