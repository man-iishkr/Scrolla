// public/js/ai/ai.summary.js
// AI Summary functionality

let currentSummaryArticle = null;

async function showSummary(articleId) {
  const article = findArticleById(articleId);
  if (!article) return;

  currentSummaryArticle = article;

  const modal = document.getElementById('summaryModal');
  const loadingEl = modal.querySelector('.summary-loading');
  const contentEl = modal.querySelector('.summary-content');

  modal.classList.remove('hidden');
  loadingEl.classList.remove('hidden');
  contentEl.classList.add('hidden');

  try {
    const content = article.content || article.description || article.title;
    const summary = await API.ai.generateSummary(article.title, content);

    contentEl.innerHTML = `<p>${escapeHtml(summary)}</p>`;
    loadingEl.classList.add('hidden');
    contentEl.classList.remove('hidden');

  } catch (error) {
    console.error('Summary Error:', error);
    contentEl.innerHTML = `
      <p style="color: var(--danger);">
        Failed to generate summary. Please try again.
      </p>
    `;
    loadingEl.classList.add('hidden');
    contentEl.classList.remove('hidden');
  }
}

function closeSummaryModal() {
  const modal = document.getElementById('summaryModal');
  modal.classList.add('hidden');
  currentSummaryArticle = null;
}

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Make globally available
window.showSummary = showSummary;
window.closeSummaryModal = closeSummaryModal;