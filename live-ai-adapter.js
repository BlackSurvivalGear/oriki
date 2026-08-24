(function () {
  const original = window.ORIKI_DATA;
  const state = { value: original };
  const proxy = new Proxy(original || {}, {
    get(target, prop) { return state.value?.[prop] ?? target?.[prop]; },
    set(target, prop, value) { target[prop] = value; return true; }
  });
  window.ORIKI_DATA = proxy;

  function buildLiveData(models) {
    const capabilities = [...new Set(models.flatMap(m => m.capabilities || []))].sort();
    const purposes = ['research', 'create', 'build', 'analyse'].reduce((out, key) => {
      const labels = { research: ['RESEARCH', 'Find, investigate and understand.', ['reasoning', 'search', 'writing']], create: ['CREATE', 'Write, design and generate.', ['writing', 'multimodal']], build: ['BUILD', 'Code, engineer and develop.', ['coding', 'tools', 'reasoning']], analyse: ['ANALYSE', 'Understand data and solve complexity.', ['reasoning', 'tools', 'writing']] };
      const [title, text, wanted] = labels[key];
      out[key] = { title, text, capabilities: wanted };
      return out;
    }, {});
    const capabilityMeta = Object.fromEntries(capabilities.map(c => [c, `Live capability detected from OpenRouter or Hugging Face model metadata.`]));
    let ais = models.map(m => ({ ...m, capabilities: m.capabilities || [], purposes: m.purposes || ['research', 'create', 'build', 'analyse'] }));

    const aliases = [
      ['chatgpt', /gpt/i],
      ['claude', /claude/i],
      ['gemini', /gemini/i]
    ];
    aliases.forEach(([id, pattern]) => {
      const match = ais.find(a => pattern.test(a.name) || pattern.test(a.sourceId || ''));
      if (match && !ais.some(a => a.id === id)) ais.push({ ...match, id });
    });

    return { ...original, ais, purposes, capabilityMeta };
  }

  window.addEventListener('oriki:live-ai', event => {
    if (event.detail?.status !== 'ready' || !Array.isArray(window.ORIKI_LIVE_AI?.models)) return;
    state.value = buildLiveData(window.ORIKI_LIVE_AI.models);
    window.dispatchEvent(new CustomEvent('oriki:live-data-ready', { detail: { count: state.value.ais.length, sources: event.detail.sources } }));
  });
})();
