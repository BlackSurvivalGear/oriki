/* ORÍKÌ AI — Scoreboard UI
 * Renders only benchmark values supplied by the scoreboard dataset. It does
 * not invent rankings where public result data is unavailable.
 */
(function () {
  function sourceLinks(ids) {
    return (ids || []).map(id => window.ORIKI_SCOREBOARD.methodology.sources.find(s => s.id === id)).filter(Boolean)
      .map(s => `<a href="${s.url}" target="_blank" rel="noopener noreferrer">${s.name}</a>`).join(' · ');
  }

  function renderScoreboard(container) {
    if (!container) return;
    const board = window.ORIKI_SCOREBOARD;
    const models = (board.models || []).filter(m => m.orikiScore !== null);
    const all = board.models || [];
    const countries = [...new Set(all.map(m => m.country).filter(Boolean))].sort();
    container.innerHTML = `
      <div class="scoreboard-wrap">
        <div class="scoreboard-hero">
          <div><p class="eyebrow">INDEPENDENT AI EVALUATION</p><h2>ORÍKÌ <span>SCOREBOARD</span></h2><p class="muted">A transparent view built from freely available public benchmarks and evaluation sources.</p></div>
          <div class="scoreboard-source-note">NO PAID API REQUIRED</div>
        </div>
        <div class="score-controls">
          <select id="scoreCountry"><option value="">ALL COUNTRIES</option>${countries.map(c=>`<option>${c}</option>`).join('')}</select>
          <select id="scoreMetric"><option value="orikiScore">ORÍKÌ SCORE</option><option value="reasoning">REASONING</option><option value="coding">CODING</option><option value="math">MATHEMATICS</option><option value="knowledge">KNOWLEDGE</option><option value="instruction">INSTRUCTION FOLLOWING</option><option value="softwareEngineering">SOFTWARE ENGINEERING</option></select>
        </div>
        <div id="scoreTable"></div>
        <details class="score-method"><summary>HOW ORÍKÌ SCORES WORK</summary><p>${board.methodology.note}</p><p><strong>Public sources:</strong> ${board.methodology.sources.map(s=>`<a href="${s.url}" target="_blank" rel="noopener noreferrer">${s.name}</a>`).join(' · ')}</p><p>ORÍKÌ will not reproduce restricted commercial leaderboard data. A model is ranked only when there is sufficient public evidence for the selected metric.</p></details>
      </div>`;

    const renderRows = () => {
      const country = document.getElementById('scoreCountry').value;
      const metric = document.getElementById('scoreMetric').value;
      let rows = all.filter(m => !country || m.country === country).filter(m => Number.isFinite(m.scores?.[metric]) || (metric === 'orikiScore' && Number.isFinite(m.orikiScore)));
      rows.sort((a,b) => (b[metric] ?? b.scores?.[metric] ?? -1) - (a[metric] ?? a.scores?.[metric] ?? -1));
      document.getElementById('scoreTable').innerHTML = rows.length ? `<div class="score-table">${rows.map((m,i)=>{const value=metric==='orikiScore'?m.orikiScore:m.scores[metric];return `<article class="score-row"><span class="rank">${String(i+1).padStart(2,'0')}</span><div class="model-id"><strong>${m.name}</strong><span>${m.provider} · ${m.country}</span></div><strong class="score-value">${value}<small>/100</small></strong><div class="score-evidence">${sourceLinks(m.sources)}</div></article>`}).join('')}</div>` : `<div class="empty-state"><strong>No public score available yet.</strong><span>ORÍKÌ will not manufacture a value. This model/metric will appear when a verified public result is available.</span></div>`;
    };
    document.getElementById('scoreCountry').addEventListener('change', renderRows);
    document.getElementById('scoreMetric').addEventListener('change', renderRows);
    renderRows();
  }
  window.ORIKI_renderScoreboard = renderScoreboard;
})();
