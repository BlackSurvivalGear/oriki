(function () {
  const state = { models: [], status: 'idle' };
  const escapeHtml = (value = '') => String(value).replace(/[&<>'"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[c]);
  const formatContext = value => {
    const n = Number(value);
    if (!Number.isFinite(n)) return 'Context n/a';
    if (n >= 1000000) return `${(n / 1000000).toFixed(n % 1000000 ? 1 : 0)}M context`;
    if (n >= 1000) return `${Math.round(n / 1000)}K context`;
    return `${n} context`;
  };
  function modelCard(model) {
    const tags = (model.capabilities || []).slice(0, 4).map(cap => `<span class="tag">${escapeHtml(cap.replace(/-/g, ' '))}</span>`).join('');
    return `<article class="ai-card openrouter-card"><div class="ai-meta"><span>${escapeHtml(model.provider || 'OpenRouter')}</span><span>LIVE</span></div><h3 class="ai-name">${escapeHtml(model.name)}</h3><p class="ai-desc">${escapeHtml(model.description || 'Model available through OpenRouter.')}</p><div class="tags">${tags || '<span class="tag">AI MODEL</span>'}</div><div class="card-row openrouter-card-meta"><span>${escapeHtml(formatContext(model.contextLength))}</span><a class="card-btn" href="${escapeHtml(model.url)}" target="_blank" rel="noopener noreferrer">OPEN</a></div></article>`;
  }
  function render() {
    const content = document.querySelector('#pageContent');
    if (!content || !state.models.length) return;
    const title = document.querySelector('#pageTitle')?.textContent?.trim() || '';
    const isFinder = title.startsWith('DISCOVER');
    const isDirectory = title.startsWith('INTELLIGENCE');
    if (!isFinder && !isDirectory) return;
    content.querySelector('.openrouter-live-section')?.remove();
    const visible = state.models.slice(0, isFinder ? 12 : 24);
    const section = document.createElement('section');
    section.className = 'openrouter-live-section reveal';
    section.innerHTML = `<div class="section-mini openrouter-section-head"><div><p class="eyebrow">LIVE MODEL CATALOGUE</p><h3>OPENROUTER INTELLIGENCE</h3><span>${state.models.length.toLocaleString()} live models available</span></div><div class="openrouter-status"><span class="openrouter-dot"></span> LIVE</div></div><div class="library-grid">${visible.map(modelCard).join('')}</div>`;
    content.appendChild(section);
  }
  function scheduleRender() { window.setTimeout(render, 0); }
  window.addEventListener('oriki:openrouter', event => {
    state.status = event.detail?.status || 'idle';
    state.models = Array.isArray(window.ORIKI_OPENROUTER?.models) ? window.ORIKI_OPENROUTER.models : [];
    if (state.status === 'ready') scheduleRender();
  });
  document.addEventListener('click', event => {
    if (event.target.closest('.side-link[data-page="discover"], .side-link[data-page="library"]')) scheduleRender();
  });
  window.addEventListener('DOMContentLoaded', () => {
    state.models = Array.isArray(window.ORIKI_OPENROUTER?.models) ? window.ORIKI_OPENROUTER.models : [];
    const target = document.querySelector('#pageContent');
    if (target) new MutationObserver(scheduleRender).observe(target, { childList: true });
    scheduleRender();
  });
})();
