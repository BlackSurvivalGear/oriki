(function () {
  const original = window.ORIKI_DATA;
  const state = { value: original };
  const proxy = new Proxy(original || {}, { get(target, prop) { return state.value?.[prop] ?? target?.[prop]; }, set(target, prop, value) { target[prop] = value; return true; } });
  window.ORIKI_DATA = proxy;
  const escapeHtml = value => String(value ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  function buildLiveData(models) {
    const capabilities = [...new Set(models.flatMap(m => m.capabilities || []))].sort();
    const definitions = { research:['RESEARCH','Find, investigate and understand.',['reasoning','search','writing']], create:['CREATE','Write, design and generate.',['writing','multimodal']], build:['BUILD','Code, engineer and develop.',['coding','tools','reasoning']], analyse:['ANALYSE','Understand data and solve complexity.',['reasoning','tools','writing']] };
    const purposes = Object.fromEntries(Object.entries(definitions).map(([key,[title,text,wanted]]) => [key,{title,text,capabilities:wanted}]));
    const capabilityMeta = Object.fromEntries(capabilities.map(c => [c,'Live capability detected from OpenRouter or Hugging Face model metadata.']));
    const ais = models.map(m => ({...m,capabilities:m.capabilities||[],purposes:m.purposes||['research','create','build','analyse']}));
    [['chatgpt',/gpt/i],['claude',/claude/i],['gemini',/gemini/i]].forEach(([id,pattern]) => { const match=ais.find(a=>pattern.test(a.name)||pattern.test(a.sourceId||'')); if(match&&!ais.some(a=>a.id===id)) ais.push({...match,id}); });
    return {...original,ais,purposes,capabilityMeta};
  }
  function refreshVisibleUI() {
    const app=document.querySelector('#app');
    if(app&&!app.classList.contains('hidden')) { const active=document.querySelector('.side-link.active'); if(active) active.click(); return; }
    const grid=document.querySelector('#landingAiGrid'); if(!grid)return;
    grid.innerHTML=state.value.ais.slice(0,5).map(ai=>`<article class="ai-card reveal"><div class="ai-meta"><span>${escapeHtml(ai.provider)}</span><span>${escapeHtml(ai.source)}</span></div><h3 class="ai-name">${escapeHtml(ai.name)}</h3><p class="ai-desc">${escapeHtml(ai.description)}</p><div class="tags">${ai.capabilities.slice(0,4).map(x=>`<span class="tag">${escapeHtml(x)}</span>`).join('')}</div><div class="card-row"><a class="card-btn" href="${escapeHtml(ai.url)}" target="_blank" rel="noopener noreferrer">OPEN</a></div></article>`).join('');
  }
  window.addEventListener('oriki:live-ai', event => { if(event.detail?.status!=='ready'||!Array.isArray(window.ORIKI_LIVE_AI?.models))return; state.value=buildLiveData(window.ORIKI_LIVE_AI.models); refreshVisibleUI(); window.dispatchEvent(new CustomEvent('oriki:live-data-ready',{detail:{count:state.value.ais.length,sources:event.detail.sources}})); });
})();
