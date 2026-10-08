# Secure Multi-Modal RAG System with Access Control

A Retrieval-Augmented Generation app that ingests **PDFs, images (OCR) and structured records**, builds a
**FAISS** vector index with per-passage access rules, and answers questions with **verified, exact citations**.
Authorization is enforced **inside the retrieval layer**, so a user's query can never pull in data they aren't allowed to see.

**Stack:** React (Vite) · Node.js + Express · MongoDB · FAISS (`faiss-node`) · Tesseract.js (OCR) · pdf.js · JWT
LLMs and embeddings come **directly from provider APIs** (OpenAI, Anthropic, Google Gemini, Voyage AI). No Ollama.

## Quick start

Requirements: Node.js 20+, a MongoDB (Atlas or local).

```bash
# 1. backend
cd backend
cp .env.example .env        # (a ready-made .env is already included in this zip)
npm install
npm run dev                 # http://localhost:5000

# 2. frontend (new terminal)
cd frontend
npm install
npm run dev                 # http://localhost:5173
```

Sign in with **`admin` / `admin`** (created automatically on first start).
Demo users are created too (password `Demo@123`): `hr01` (HR), `finance01` (FINANCE), `employee01` (EMPLOYEE).

### First-time setup in the UI
1. **Settings → LLM Providers & Keys**: paste an API key for a chat provider and an embeddings provider
   (OpenAI or Gemini do both; with Anthropic for chat, add Voyage or OpenAI for embeddings). Click **Test connection**,
   then choose the default chat + embedding models.
2. **Knowledge Base → Load sample data** (PDFs, an OCR image, and CSV "database" tables).
3. Ask questions in chat. Then sign in as `employee01`, `hr01`, `finance01` and ask the same things to see access control at work.
   Try: *"What was the Q3 revenue?"* (FINANCE/ADMIN only) · *"What is my base salary?"* (each user sees only their own payroll row).

## How access control works
Every chunk (PDF passage, OCR text, or table row) is stored with an ACL: `{department, allowedRoles[], allowedUsers[]}`.
`backend/src/security/acl.js` is the single policy function:

| Rule | Result |
|---|---|
| role = ADMIN | allowed |
| username in `allowedUsers` (row owner, private upload) | allowed |
| `allowedRoles` non-empty | allowed only if the user's role is listed |
| no lists | allowed if the role may read that department |
| anything else / malformed ACL | **denied** (fail closed) |

Enforcement points:
1. **FAISS layer** (`services/vector/faissStore.js`): one index per department; `search()` *requires* a principal, never searches
   unreachable partitions, over-fetches and discards unauthorized hits before returning anything.
2. **Retriever**: re-checks each loaded passage against the ACL stored in MongoDB (defense in depth).
3. **LLM boundary**: only authorized passages are ever placed in the prompt (verified by an automated leak test).
4. Document lists, file downloads, deletes and uploads are all ACL-checked; the user's role always comes from the database, not the token.

## Citations & hallucination control
The model must answer as JSON statements, each with source ids and a verbatim quote. The server then verifies every statement:
valid source id → numbers present in the cited text → word-level support → quote located in the passage
(otherwise replaced with the closest real sentence). Unsupported statements are dropped and counted. If nothing verifies,
the user gets a plain "not found in documents you can access" (which never reveals whether restricted data exists).
Each citation shows file, page / table row, character offsets, OCR confidence and the highlighted passage.

## Data & indexing notes
- Files and FAISS indexes live in `backend/data/` (gitignored). MongoDB holds users, chunks (text + ACL), chats, provider config, audit logs.
- Provider API keys are encrypted at rest (AES-256-GCM, `ENCRYPTION_KEY`) and never returned to the browser.
- If you change the **embedding model**, run **Knowledge Base → Re-index** (old vectors have a different dimension/meaning).
- Scanned (image-only) PDFs aren't OCR'd; upload the pages as images instead.
- Admins can read the audit trail at `GET /api/admin/audit` (queries, retrieved chunk ids, how many hits were denied).

## Tests
```bash
cd backend && npm test      # needs a MongoDB at mongodb://127.0.0.1:27017 (or set TEST_MONGO_URI)
```
Covers the ACL policy matrix, FAISS authorization/over-fetch/delete, the citation verifier, and an end-to-end run
(PDF + OCR + CSV ingestion, role isolation, row-level security, prompt leak test, uploads, deletes, re-index) using a mock LLM provider.

## Security checklist before real use
Change/remove the default `admin/admin` and demo accounts · rotate the MongoDB password · set strong `JWT_SECRET` / `ENCRYPTION_KEY` · serve over HTTPS.
