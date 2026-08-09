/* ORÍKÌ Compare → AI Scoreboard integration */
(function () {
  async function loadResults() {
    try {
      const r = await fetch('./scoreboard-results.json', {cache:'no-store'});
      if (!r.ok) throw new Error('scoreboard unavailable');
      const data = await r.json();
      if (window.ORIKI_SCOREBOARD) {
        window.ORIKI_SCOREBOARD.models = data.models || [];
        window.ORIKI_SCOREBOARD.updatedAt = data.updatedAt || null;
      }
      return data;
    } catch (_) { return null; }
  }

  function addTab() {
    const intro = document.querySelector('.compare-intro');
    if (!intro || document.querySelector('.compare-tabs')) return;
    const tabs = document.createElement('div');
    tabs.className = 'compare-tabs';
    tabs.innerHTML = '<button class="compare-tab active" data-compare-tab="compare">COMPARE AI</button><button class="compare-tab" data-compare-tab="scoreboard">AI SCOREBOARD</button>';
    intro.after(tabs);

    const controls = document.querySelector('.compare-select');
    const table = document.querySelector('#compareTable');
    const panel = document.createElement('section');
    panel.className = 'scoreboard-panel hidden';
    panel.id = 'scoreboardPanel';
    panel.innerHTML = '<div class="scoreboard-loading">LOADING VERIFIED PUBLIC BENCHMARK DATA…</div>';
    (table || tabs).after(panel);

    tabs.querySelectorAll('.compare-tab').forEach(btn => btn.addEventListener('click', async () => {
      tabs.querySelectorAll('.compare-tab').forEach(x => x.classList.toggle('active', x === btn));
      const scoreboard = btn.dataset.compareTab === 'scoreboard';
      controls?.classList.toggle('hidden', scoreboard);
      table?.classList.toggle('hidden', scoreboard);
      panel.classList.toggle('hidden', !scoreboard);
      if (scoreboard && !panel.dataset.loaded) {
        const data = await loadResults();
        if (window.ORIKI_renderScoreboard) window.ORIKI_renderScoreboard(panel);
        panel.dataset.loaded = '1';
        if (data?.updatedAt) {
          const stamp = document.createElement('p');
          stamp.className = 'scoreboard-updated';
          stamp.textContent = `Last public-data sync: ${new Date(data.updatedAt).toLocaleString('en-GB')}`;
          panel.prepend(stamp);
        }
      }
    }));
  }

  const original = window.showPage;
  window.showPage = function (page, purpose) {
    original(page, purpose);
    if (page === 'compare') setTimeout(addTab, 0);
  };
})();
