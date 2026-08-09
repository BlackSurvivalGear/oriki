// ORÍKÌ navigation and discovery layer
// Keeps automatically scanned candidates visible as a review queue, separate from the approved AI directory.
(() => {
  const AUTO = () => (window.ORIKI_AUTO_INTELLIGENCE || []).filter(x => x && x.status === 'AUTO-DETECTED');
  const isAuto = ai => ai && (ai.status === 'AUTO-DETECTED' || String(ai.id || '').startsWith('auto-'));
  const originalShowPage = window.showPage;

  function discoveryCard(ai) {
    const esc = window.escapeHtml || (v => String(v));
    return `<article class="ai-card reveal discovery-card">
      <div class="ai-meta"><span>${esc(ai.provider || 'Unknown source')}</span><span>NEW DISCOVERY</span></div>
      <h3 class="ai-name">${esc(ai.name || 'Untitled discovery')}</h3>
      <p class="ai-desc">${esc(ai.description || 'Automatically detected from a public intelligence source and awaiting review.')}</p>
      <div class="tags"><span class="tag discovery-tag">AUTO-DETECTED</span>${(ai.capabilities || []).slice(0,3).map(x => `<span class="tag">${esc(x)}</span>`).join('')}</div>
      <div class="discovery-meta"><span>Detected ${esc(ai.detectedDate || 'recently')}</span><span>Source: ${esc(ai.source || ai.url || '')}</span></div>
      <div class="card-row">
        <button class="card-btn primary" data-discovery-open="${esc(ai.id)}">VIEW SOURCE</button>
        <button class="card-btn" data-discovery-copy="${esc(ai.id)}">COPY DETAILS</button>
      </div>
    </article>`;
  }

  function discoveriesPage() {
    const items = AUTO().sort((a,b) => String(b.detectedDate || '').localeCompare(String(a.detectedDate || '')));
    return `<div class="discoveries-hero">
      <div>
        <p class="eyebrow">ORÍKÌ SCANNER</p>
        <h2>NEW<br><span>DISCOVERIES.</span></h2>
        <p class="muted">These are new AI systems, models, platforms and AI developments detected from ORÍKÌ's public intelligence sources. They remain separate from the approved AI Directory until reviewed.</p>
      </div>
      <div class="discovery-status"><strong>${items.length}</strong><span>NEW ITEMS AWAITING REVIEW</span><small>Public-source scan results</small></div>
    </div>
    <div class="library-summary discovery-summary"><span><b>${items.length}</b> NEW DISCOVERIES</span><span>REVIEW SOURCE → VERIFY → APPROVE INTO AI DIRECTORY</span></div>
    <div class="library-grid" id="discoveriesGrid">${items.length ? items.map(discoveryCard).join('') : '<div class="empty">No new discoveries are waiting for review.</div>'}</div>`;
  }

  function bindDiscoveries() {
    document.querySelectorAll('[data-discovery-open]').forEach(btn => btn.onclick = () => {
      const item = AUTO().find(x => x.id === btn.dataset.discoveryOpen);
      if (item && item.url) window.open(item.url, '_blank', 'noopener,noreferrer');
    });
    document.querySelectorAll('[data-discovery-copy]').forEach(btn => btn.onclick = async () => {
      const item = AUTO().find(x => x.id === btn.dataset.discoveryCopy);
      if (!item) return;
      const text = `${item.name}\nProvider: ${item.provider || ''}\nDetected: ${item.detectedDate || ''}\nSource: ${item.source || item.url || ''}`;
      try { await navigator.clipboard.writeText(text); btn.textContent = 'COPIED'; setTimeout(() => btn.textContent = 'COPY DETAILS', 1400); } catch (_) { btn.textContent = 'COPY UNAVAILABLE'; }
    });
  }

  // Replace the catalogue renderer so auto-detected items are reviewed separately.
  window.library = function(filter = '') {
    const catalogue = (window.ORIKI_DATA?.ais || []).filter(ai => !isAuto(ai));
    const purposeFilter = window.ORIKI_DATA?.purposes?.[filter] ? filter : '';
    const capFilter = !purposeFilter && window.ORIKI_DATA?.capabilityMeta?.[filter] ? filter : '';
    const D = window.ORIKI_DATA;
    return `<div class="library-toolbar"><input id="librarySearch" placeholder="Search AI, provider, type or capability..." aria-label="Search AI directory"><select class="library-filter" id="typeFilter" aria-label="Filter by type"><option value="">ALL TYPES</option>${[...new Set(catalogue.map(a=>a.type))].sort().map(x=>`<option value="${window.escapeHtml(x)}">${window.escapeHtml(x).toUpperCase()}</option>`).join('')}</select><select class="library-filter" id="capFilter" aria-label="Filter by capability"><option value="">ALL CAPABILITIES</option>${Object.keys(D.capabilityMeta).sort().map(x=>`<option value="${x}" ${capFilter===x?'selected':''}>${x.toUpperCase()}</option>`).join('')}</select><select class="library-filter" id="purposeFilter" aria-label="Filter by purpose"><option value="">ALL PURPOSES</option>${Object.keys(D.purposes).map(x=>`<option value="${x}" ${purposeFilter===x?'selected':''}>${x.toUpperCase()}</option>`).join('')}</select></div><div class="library-summary"><span><b id="libraryCount">${catalogue.length}</b> AI SYSTEMS IN DIRECTORY</span><span>APPROVED CATALOGUE · FILTER BY TYPE, CAPABILITY OR PURPOSE</span></div><div class="library-grid" id="libraryGrid">${catalogue.map(window.aiCard).join('')}</div>`;
  };

  window.filterLibrary = function() {
    const q = (document.querySelector('#librarySearch')?.value || '').toLowerCase().trim();
    const type = document.querySelector('#typeFilter')?.value || '';
    const cap = document.querySelector('#capFilter')?.value || '';
    const purpose = document.querySelector('#purposeFilter')?.value || '';
    const D = window.ORIKI_DATA;
    const ais = (D.ais || []).filter(a => !isAuto(a)).filter(a => {
      const text = (a.name+' '+a.provider+' '+a.type+' '+a.category+' '+a.description+' '+(a.capabilities||[]).join(' ')).toLowerCase();
      return (!q || text.includes(q)) && (!type || a.type === type) && (!cap || (a.capabilities||[]).includes(cap)) && (!purpose || (a.purposes||[]).includes(purpose));
    });
    const grid = document.querySelector('#libraryGrid'); if (!grid) return;
    document.querySelector('#libraryCount').textContent = ais.length;
    grid.innerHTML = ais.length ? ais.map(window.aiCard).join('') : '<div class="empty">No AI systems matched those filters.</div>';
    if (window.bindDynamic) window.bindDynamic();
  };

  window.showPage = function(page = 'dashboard', purpose = '') {
    if (page !== 'discoveries') return originalShowPage(page, purpose);
    document.querySelectorAll('.side-link').forEach(b => b.classList.toggle('active', b.dataset.page === page));
    const title = document.querySelector('#pageTitle');
    const subtitle = document.querySelector('#pageSubtitle');
    if (title) title.textContent = 'NEW DISCOVERIES.';
    if (subtitle) subtitle.textContent = 'Fresh intelligence detected by the ORÍKÌ scanner.';
    document.querySelector('.sidebar')?.classList.remove('open');
    const content = document.querySelector('#pageContent');
    if (content) content.innerHTML = discoveriesPage();
    bindDiscoveries();
    window.scrollTo(0,0);
  };

  window.addEventListener('DOMContentLoaded', () => {
    const badge = document.querySelector('[data-discoveries-badge]');
    if (badge) { badge.textContent = AUTO().length; badge.hidden = AUTO().length === 0; }
  });
})();
