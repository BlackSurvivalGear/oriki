// ORÍKÌ AI Directory — country visibility and filtering layer
// Keeps the curated directory data unchanged while making the Country field visible and searchable.
(() => {
  const D = window.ORIKI_DATA;
  if (!D) return;

  const esc = window.escapeHtml || (value = '') => String(value).replace(/[&<>'\"]/g, c => ({
    '&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','\"':'&quot;'
  }[c]));

  const isAuto = ai => ai && (ai.status === 'AUTO-DETECTED' || String(ai.id || '').startsWith('auto-'));
  const catalogue = () => (D.ais || []).filter(ai => !isAuto(ai));

  // Country is deliberately shown in the card metadata, not hidden in the detail view.
  window.aiCard = function(ai, landing = false) {
    const country = ai.country || 'Unknown';
    const type = ai.type || ai.category || 'AI System';
    const capabilities = (ai.capabilities || []).slice(0, 4);
    return `<article class="ai-card reveal">
      <div class="ai-meta">
        <span>${esc(ai.provider || 'Unknown company')}</span>
        <span>${esc(country)}</span>
      </div>
      <div class="directory-type">${esc(type)}</div>
      <h3 class="ai-name">${esc(ai.name || 'Unnamed AI')}</h3>
      <p class="ai-desc">${esc(ai.description || '')}</p>
      <div class="tags">${capabilities.map(x => `<span class="tag">${esc(x)}</span>`).join('')}</div>
      <div class="card-row">
        <button class="card-btn primary open-ai" data-id="${esc(ai.id)}">VIEW</button>
        ${landing ? `<a class="card-btn" href="${esc(ai.url || '#')}" target="_blank" rel="noopener noreferrer">OPEN</a>` : `<button class="card-btn fav" data-id="${esc(ai.id)}">${window.favourites?.includes(ai.id) ? '★ FAVOURITED' : '☆ FAVOURITE'}</button>`}
      </div>
    </article>`;
  };

  const countryOptions = () => [...new Set(catalogue().map(ai => ai.country || 'Unknown'))]
    .sort((a,b) => a.localeCompare(b))
    .map(country => `<option value="${esc(country)}">${esc(country).toUpperCase()}</option>`)
    .join('');

  window.library = function(filter = '') {
    const items = catalogue();
    const purposeFilter = D.purposes?.[filter] ? filter : '';
    const capFilter = !purposeFilter && D.capabilityMeta?.[filter] ? filter : '';
    return `<div class="library-toolbar">
      <input id="librarySearch" placeholder="Search AI, company, country, type or capability..." aria-label="Search AI directory">
      <select class="library-filter" id="typeFilter" aria-label="Filter by type">
        <option value="">ALL TYPES</option>
        ${[...new Set(items.map(a => a.type || a.category || 'AI System'))].sort().map(x => `<option value="${esc(x)}">${esc(x).toUpperCase()}</option>`).join('')}
      </select>
      <select class="library-filter" id="countryFilter" aria-label="Filter by country">
        <option value="">ALL COUNTRIES</option>${countryOptions()}
      </select>
      <select class="library-filter" id="capFilter" aria-label="Filter by capability">
        <option value="">ALL CAPABILITIES</option>
        ${Object.keys(D.capabilityMeta || {}).sort().map(x => `<option value="${esc(x)}" ${capFilter === x ? 'selected' : ''}>${esc(x).toUpperCase()}</option>`).join('')}
      </select>
      <select class="library-filter" id="purposeFilter" aria-label="Filter by purpose">
        <option value="">ALL PURPOSES</option>
        ${Object.keys(D.purposes || {}).map(x => `<option value="${esc(x)}" ${purposeFilter === x ? 'selected' : ''}>${esc(x).toUpperCase()}</option>`).join('')}
      </select>
    </div>
    <div class="library-summary">
      <span><b id="libraryCount">${items.length}</b> AI SYSTEMS IN DIRECTORY</span>
      <span>APPROVED CATALOGUE · FILTER BY TYPE, COUNTRY, CAPABILITY OR PURPOSE</span>
    </div>
    <div class="library-grid" id="libraryGrid">${items.map(aiCard).join('')}</div>`;
  };

  window.filterLibrary = function() {
    const q = (document.querySelector('#librarySearch')?.value || '').toLowerCase().trim();
    const type = document.querySelector('#typeFilter')?.value || '';
    const country = document.querySelector('#countryFilter')?.value || '';
    const cap = document.querySelector('#capFilter')?.value || '';
    const purpose = document.querySelector('#purposeFilter')?.value || '';

    const items = catalogue().filter(ai => {
      const text = [
        ai.name, ai.provider, ai.country, ai.type, ai.category, ai.bestFor,
        ai.description, ai.pricing, ...(ai.platforms || []), ...(ai.capabilities || [])
      ].filter(Boolean).join(' ').toLowerCase();
      return (!q || text.includes(q))
        && (!type || (ai.type || ai.category) === type)
        && (!country || (ai.country || 'Unknown') === country)
        && (!cap || (ai.capabilities || []).includes(cap))
        && (!purpose || (ai.purposes || []).includes(purpose));
    });

    const count = document.querySelector('#libraryCount');
    const grid = document.querySelector('#libraryGrid');
    if (!grid) return;
    if (count) count.textContent = items.length;
    grid.innerHTML = items.length
      ? items.map(aiCard).join('')
      : '<div class="empty">No AI systems matched those filters.</div>';
    if (window.bindDynamic) window.bindDynamic();
  };

  // Country styling is kept local to this enhancement so the existing visual system is preserved.
  const style = document.createElement('style');
  style.textContent = `
    .directory-type{margin:10px 0 2px;color:#c7a52a;font-size:.68rem;letter-spacing:.16em;text-transform:uppercase;font-weight:600}
    .ai-meta span:last-child{color:#d6b53a}
    #countryFilter{min-width:170px}
    @media (max-width:1100px){#countryFilter{min-width:140px}}
  `;
  document.head.appendChild(style);
})();
