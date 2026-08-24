const ORIKI_OPENROUTER = {
  endpoint: 'https://openrouter.ai/api/v1/models',
  cacheKey: 'oriki-openrouter-models',
  cacheTtlMs: 5 * 60 * 1000,
  models: [],
  lastUpdated: null,
  status: 'idle',

  async fetchModels({ force = false } = {}) {
    this.status = 'loading';
    this.emit();

    if (!force) {
      const cached = this.readCache();
      if (cached) {
        this.models = cached.models;
        this.lastUpdated = cached.lastUpdated;
        this.status = 'ready';
        this.emit();
        return this.models;
      }
    }

    try {
      const response = await fetch(this.endpoint, {
        method: 'GET',
        headers: { Accept: 'application/json' }
      });

      if (!response.ok) {
        throw new Error(`OpenRouter returned HTTP ${response.status}`);
      }

      const payload = await response.json();
      if (!payload || !Array.isArray(payload.data)) {
        throw new Error('OpenRouter returned an invalid models response');
      }

      this.models = payload.data.map(normalizeOpenRouterModel).filter(Boolean);
      this.lastUpdated = new Date().toISOString();
      this.status = 'ready';
      this.writeCache();
      this.emit();
      return this.models;
    } catch (error) {
      this.status = 'error';
      this.error = error instanceof Error ? error.message : String(error);
      this.emit();
      console.error('[ORÍKÌ] OpenRouter model retrieval failed:', error);
      return [];
    }
  },

  readCache() {
    try {
      const raw = localStorage.getItem(this.cacheKey);
      if (!raw) return null;
      const cached = JSON.parse(raw);
      if (!cached?.lastUpdated || !Array.isArray(cached.models)) return null;
      if (Date.now() - new Date(cached.lastUpdated).getTime() > this.cacheTtlMs) return null;
      return cached;
    } catch {
      return null;
    }
  },

  writeCache() {
    try {
      localStorage.setItem(this.cacheKey, JSON.stringify({
        lastUpdated: this.lastUpdated,
        models: this.models
      }));
    } catch {
      // Caching is optional; retrieval must still work without localStorage.
    }
  },

  emit() {
    window.dispatchEvent(new CustomEvent('oriki:openrouter', {
      detail: {
        status: this.status,
        count: this.models.length,
        lastUpdated: this.lastUpdated,
        error: this.error || null
      }
    }));
  }
};

function normalizeOpenRouterModel(model) {
  if (!model || !model.id || !model.name) return null;

  const architecture = model.architecture || {};
  const inputModalities = architecture.input_modalities || [];
  const outputModalities = architecture.output_modalities || [];
  const parameters = model.supported_parameters || [];
  const provider = model.id.includes('/') ? model.id.split('/')[0] : 'OpenRouter';

  const capabilities = new Set();
  if (inputModalities.includes('text') || outputModalities.includes('text')) capabilities.add('writing');
  if (inputModalities.some(x => ['image', 'video', 'audio', 'file'].includes(x))) capabilities.add('multimodal');
  if (parameters.includes('tools') || parameters.includes('tool_choice')) capabilities.add('tools');
  if (parameters.includes('reasoning') || parameters.includes('reasoning_effort') || model.reasoning) capabilities.add('reasoning');
  if (parameters.includes('structured_outputs') || parameters.includes('response_format')) capabilities.add('structured-output');
  if (parameters.includes('web_search')) capabilities.add('search');

  return {
    id: `openrouter:${model.id}`,
    openrouterId: model.id,
    canonicalSlug: model.canonical_slug || null,
    name: model.name,
    provider,
    type: 'OpenRouter Model',
    category: 'OpenRouter',
    capabilities: [...capabilities],
    purposes: capabilities.has('reasoning') ? ['research', 'analyse'] : ['research', 'create'],
    description: model.description || 'Model available through OpenRouter.',
    contextLength: model.context_length || null,
    pricing: model.pricing || {},
    inputModalities,
    outputModalities,
    supportedParameters: parameters,
    huggingFaceId: model.hugging_face_id || null,
    url: `https://openrouter.ai/${encodeURIComponent(model.id)}`,
    status: 'OpenRouter',
    source: 'OpenRouter'
  };
}

window.ORIKI_OPENROUTER = ORIKI_OPENROUTER;
window.ORIKI_OPENROUTER_NORMALIZE = normalizeOpenRouterModel;

// Retrieve the live catalogue when the ORÍKÌ application loads.
window.addEventListener('DOMContentLoaded', () => {
  ORIKI_OPENROUTER.fetchModels();
});
