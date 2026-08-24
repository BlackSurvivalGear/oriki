(function () {
  const CACHE_KEY = 'oriki-live-ai-v2';
  const CACHE_TTL = 10 * 60 * 1000;
  const OPENROUTER_ENDPOINT = 'https://openrouter.ai/api/v1/models';
  const HF_ENDPOINTS = [
    'https://huggingface.co/api/models?pipeline_tag=text-generation&sort=downloads&direction=-1&limit=150',
    'https://huggingface.co/api/models?pipeline_tag=text-to-image&sort=downloads&direction=-1&limit=75',
    'https://huggingface.co/api/models?pipeline_tag=automatic-speech-recognition&sort=downloads&direction=-1&limit=50'
  ];

  const state = {
    models: [],
    sources: { openrouter: 'loading', huggingface: 'loading' },
    status: 'loading',
    lastUpdated: null,
    errors: {}
  };

  function emit() {
    window.ORIKI_LIVE_AI = state;
    window.dispatchEvent(new CustomEvent('oriki:live-ai', {
      detail: {
        status: state.status,
        count: state.models.length,
        sources: { ...state.sources },
        lastUpdated: state.lastUpdated,
        errors: { ...state.errors }
      }
    }));
  }

  function readCache() {
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (!raw) return null;
      const cached = JSON.parse(raw);
      if (!cached?.lastUpdated || !Array.isArray(cached.models)) return null;
      if (Date.now() - new Date(cached.lastUpdated).getTime() > CACHE_TTL) return null;
      return cached;
    } catch {
      return null;
    }
  }

  function writeCache() {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({
        lastUpdated: state.lastUpdated,
        models: state.models
      }));
    } catch {
      // Cache is optional.
    }
  }

  function capabilitySet() {
    return new Set();
  }

  function normalizeOpenRouter(model) {
    if (!model?.id || !model?.name) return null;
    const architecture = model.architecture || {};
    const input = architecture.input_modalities || [];
    const output = architecture.output_modalities || [];
    const params = model.supported_parameters || [];
    const caps = capabilitySet();
    const textIO = input.includes('text') || output.includes('text');

    if (textIO) caps.add('writing');
    if (input.some(x => ['image', 'video', 'audio', 'file'].includes(x)) || output.some(x => ['image', 'video', 'audio'].includes(x))) caps.add('multimodal');
    if (params.includes('tools') || params.includes('tool_choice')) caps.add('tools');
    if (params.includes('reasoning') || params.includes('reasoning_effort') || model.reasoning) caps.add('reasoning');
    if (params.includes('structured_outputs') || params.includes('response_format')) caps.add('structured-output');
    if (params.includes('web_search')) caps.add('search');
    if (input.includes('image')) caps.add('vision');
    if (output.includes('image')) caps.add('image-generation');
    if (output.includes('audio')) caps.add('audio');
    if (output.includes('video')) caps.add('video');
    if (params.some(p => /code|computer|program/i.test(p)) || /code|coder|coding/i.test(model.name + ' ' + (model.description || ''))) caps.add('coding');

    return {
      id: `openrouter:${model.id}`,
      sourceId: model.id,
      canonicalSlug: model.canonical_slug || null,
      name: model.name,
      provider: model.id.includes('/') ? model.id.split('/')[0] : 'OpenRouter',
      type: 'AI Model',
      category: 'OpenRouter',
      source: 'OpenRouter',
      capabilities: [...caps],
      purposes: caps.has('coding') ? ['build', 'analyse'] : caps.has('reasoning') ? ['research', 'analyse'] : ['research', 'create'],
      description: model.description || 'Model available through OpenRouter.',
      contextLength: model.context_length || null,
      pricing: model.pricing || {},
      inputModalities: input,
      outputModalities: output,
      supportedParameters: params,
      huggingFaceId: model.hugging_face_id || null,
      url: `https://openrouter.ai/${encodeURIComponent(model.id)}`
    };
  }

  function normalizeHuggingFace(model) {
    if (!model?.id) return null;
    const tags = Array.isArray(model.tags) ? model.tags : [];
    const pipeline = model.pipeline_tag || '';
    const caps = capabilitySet();
    const tagText = tags.join(' ').toLowerCase();

    if (/text-generation|text2text-generation|chat|causal-lm/i.test(pipeline + ' ' + tagText)) {
      caps.add('writing');
      caps.add('reasoning');
    }
    if (/text-to-image|image-generation/i.test(pipeline + ' ' + tagText)) caps.add('image-generation');
    if (/automatic-speech-recognition|audio|speech/i.test(pipeline + ' ' + tagText)) caps.add('audio');
    if (/image|vision|visual/i.test(pipeline + ' ' + tagText)) caps.add('vision');
    if (/code|coder|programming/i.test(model.id + ' ' + tagText)) caps.add('coding');
    if (/agent|tool/i.test(tagText)) caps.add('tools');
    if (!caps.size) caps.add('research');

    return {
      id: `huggingface:${model.id}`,
      sourceId: model.id,
      name: model.id.split('/').pop() || model.id,
      provider: model.id.includes('/') ? model.id.split('/')[0] : 'Hugging Face',
      type: 'Open Model',
      category: 'Hugging Face',
      source: 'Hugging Face',
      capabilities: [...caps],
      purposes: caps.has('coding') ? ['build', 'analyse'] : ['research', 'create'],
      description: `Open model${pipeline ? ` for ${pipeline}` : ''} on Hugging Face.`,
      pipeline,
      downloads: Number(model.downloads || 0),
      likes: Number(model.likes || 0),
      tags: tags.slice(0, 30),
      url: `https://huggingface.co/${encodeURI(model.id)}`,
      huggingFaceId: model.id,
      openSource: true
    };
  }

  async function fetchJson(url) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        signal: controller.signal
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } finally {
      clearTimeout(timeout);
    }
  }

  async function fetchOpenRouter() {
    try {
      const payload = await fetchJson(OPENROUTER_ENDPOINT);
      if (!Array.isArray(payload?.data)) throw new Error('Invalid OpenRouter response');
      state.sources.openrouter = 'ready';
      return payload.data.map(normalizeOpenRouter).filter(Boolean);
    } catch (error) {
      state.sources.openrouter = 'error';
      state.errors.openrouter = error instanceof Error ? error.message : String(error);
      console.error('[ORÍKÌ] OpenRouter model retrieval failed:', error);
      return [];
    }
  }

  async function fetchHuggingFace() {
    try {
      const payloads = await Promise.all(HF_ENDPOINTS.map(fetchJson));
      const byId = new Map();
      payloads.flat().forEach(model => {
        const normalized = normalizeHuggingFace(model);
        if (normalized && !byId.has(normalized.id)) byId.set(normalized.id, normalized);
      });
      state.sources.huggingface = 'ready';
      return [...byId.values()];
    } catch (error) {
      state.sources.huggingface = 'error';
      state.errors.huggingface = error instanceof Error ? error.message : String(error);
      console.error('[ORÍKÌ] Hugging Face model retrieval failed:', error);
      return [];
    }
  }

  async function load({ force = false } = {}) {
    const cached = !force && readCache();
    if (cached) {
      state.models = cached.models;
      state.lastUpdated = cached.lastUpdated;
      state.sources = { openrouter: 'cached', huggingface: 'cached' };
      state.status = 'ready';
      emit();
      return state.models;
    }

    state.status = 'loading';
    state.sources = { openrouter: 'loading', huggingface: 'loading' };
    state.errors = {};
    emit();

    const [openrouter, huggingface] = await Promise.all([
      fetchOpenRouter(),
      fetchHuggingFace()
    ]);

    const byId = new Map();
    [...openrouter, ...huggingface].forEach(model => {
      if (!byId.has(model.id)) byId.set(model.id, model);
    });

    state.models = [...byId.values()];
    state.lastUpdated = new Date().toISOString();
    state.status = state.models.length ? 'ready' : 'error';
    writeCache();
    emit();
    return state.models;
  }

  window.ORIKI_LIVE_AI = state;
  window.ORIKI_LIVE_AI.refresh = () => load({ force: true });

  window.addEventListener('DOMContentLoaded', () => load());
})();
