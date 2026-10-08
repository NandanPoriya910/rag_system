// Retrieval = embed the query → FAISS search UNDER THE USER'S PRINCIPAL → load passages.
// Authorization happens inside vectorStore.search(); we re-check each loaded chunk against the
// ACL stored in MongoDB as a second, independent line of defence.
import KbChunk from '../../models/Chunk.js';
import { embed } from '../llm/index.js';
import { vectorStore } from '../vector/faissStore.js';
import { canAccess } from '../../security/acl.js';
import { HttpError } from '../../utils/http.js';
import { env } from '../../config/env.js';
import { contentTokens } from './grounding.js';

export async function retrieve(principal, question, { topK = env.topK, minScore = env.minScore } = {}) {
  if (vectorStore.size() === 0) return { sources: [], stats: { partitionsSearched: 0, candidates: 0, denied: 0 } };

  const { vectors, model } = await embed([question], 'query');
  const sig = vectorStore.signature();
  if (sig && sig.model !== model) {
    throw new HttpError(409, `The index was built with "${sig.model}" but the active embedding model is "${model}". An admin must run Re-index (Knowledge Base page).`);
  }

  // Over-fetch a little, then lightly re-rank with lexical overlap (helps exact IDs / names / numbers).
  const { hits, stats } = vectorStore.search(principal, vectors[0], topK * 3);
  const rows = await KbChunk.find({ _id: { $in: hits.map((h) => h.chunkId) } }).lean();
  const byId = new Map(rows.map((r) => [String(r._id), r]));

  const qTokens = [...new Set(contentTokens(question))];
  const scored = [];
  for (const h of hits) {
    const c = byId.get(h.chunkId);
    if (!c) continue;
    if (!canAccess(principal, c.acl)) {
      stats.denied++; // second check disagreed with the index manifest → drop
      continue;
    }
    if (h.score < minScore) continue;
    const lower = c.text.toLowerCase();
    const lex = qTokens.length ? qTokens.filter((t) => lower.includes(t)).length / qTokens.length : 0;
    scored.push({ h, c, rank: h.score + 0.15 * lex });
  }
  scored.sort((a, b) => b.rank - a.rank);

  const sources = scored.slice(0, topK).map(({ h, c }, i) => ({
    sid: `S${i + 1}`,
    chunkId: String(c._id),
    documentId: String(c.documentId),
    text: c.text,
    score: Number(h.score.toFixed(4)),
    source: c.source,
  }));
  return { sources, stats };
}
