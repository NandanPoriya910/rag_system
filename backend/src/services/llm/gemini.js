import { httpJson, l2normalize, ProviderError } from './http.js';

const base = (c) => (c.baseUrl || 'https://generativelanguage.googleapis.com/v1beta').replace(/\/+$/, '');
const headers = (c) => ({ 'x-goog-api-key': c.apiKey });
const EMBED_DIMS = 768; // gemini-embedding models support reduced output size; we normalise ourselves.

export default {
  id: 'gemini',
  name: 'Google Gemini',
  capabilities: { chat: true, embeddings: true },
  defaultBaseUrl: 'https://generativelanguage.googleapis.com/v1beta',
  keyHint: 'AIza…',
  docsUrl: 'https://aistudio.google.com/app/apikey',
  suggestedChatModels: ['gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-2.5-flash-lite','gemini-3.8-flash', 'gemini-3.8-pro', 'gemini-3.8-flash-lite'],
  suggestedEmbeddingModels: ['gemini-embedding-001'],
  
  async chat(c, { model, system, user, maxTokens = 1500, json = false }) {
    const generationConfig = { maxOutputTokens: Math.max(maxTokens, 2048) };
    if (json) generationConfig.responseMimeType = 'application/json';
    const data = await httpJson(`${base(c)}/models/${encodeURIComponent(model)}:generateContent`, {
      headers: headers(c),
      body: {
        systemInstruction: { parts: [{ text: system }] },
        contents: [{ role: 'user', parts: [{ text: user }] }],
        generationConfig,
      },
    });
    const parts = data?.candidates?.[0]?.content?.parts || [];
    const text = parts.map((p) => p.text || '').join('');
    if (!text) throw new ProviderError(`Gemini returned no text (${data?.candidates?.[0]?.finishReason || data?.promptFeedback?.blockReason || 'unknown reason'}).`);
    return text;
  },

  async embed(c, { model, texts, inputType = 'document' }) {
    const out = [];
    for (let i = 0; i < texts.length; i += 100) {
      const slice = texts.slice(i, i + 100);
      const data = await httpJson(`${base(c)}/models/${encodeURIComponent(model)}:batchEmbedContents`, {
        headers: headers(c),
        body: {
          requests: slice.map((t) => ({
            model: `models/${model}`,
            content: { parts: [{ text: t }] },
            taskType: inputType === 'query' ? 'RETRIEVAL_QUERY' : 'RETRIEVAL_DOCUMENT',
            outputDimensionality: EMBED_DIMS,
          })),
        },
      });
      const vals = (data.embeddings || []).map((e) => e.values);
      if (vals.length !== slice.length) throw new ProviderError('Embedding count mismatch from Gemini.');
      out.push(...vals.map(l2normalize));
    }
    return out;
  },

  async listModels(c) {
    const data = await httpJson(`${base(c)}/models?pageSize=200`, { method: 'GET', headers: headers(c) });
    const models = data.models || [];
    const short = (m) => m.name.replace(/^models\//, '');
    return {
      chat: models.filter((m) => (m.supportedGenerationMethods || []).includes('generateContent')).map(short),
      embedding: models.filter((m) => (m.supportedGenerationMethods || []).some((x) => /embed/i.test(x))).map(short),
    };
  },
};
