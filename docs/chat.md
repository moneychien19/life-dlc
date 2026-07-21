# Chat — Design Doc

Reference-document Q&A over private documents using RAG. This doc covers the API surface,
ingestion, data model, and the design principles that matter for correctness and safety.

See the [README](../README.md) for the project mission and the component diagram.

---

## Architecture

Six roles. Most are familiar web pieces; the only genuinely "AI" parts are the Embedding API and the LLM API.

| Role               | What it is                             |
| ------------------ | -------------------------------------- |
| Frontend (Chat UI) | A single-page chat interface           |
| Backend API        | The orchestration hub, FastAPI         |
| Vector Store       | A database that does similarity search |
| Embedding API      | Text → vector, external service        |
| LLM API            | Generates answers, external service    |
| Ingestion Logic    | Writes documents into the vector store |

### Query Flow (`/chat`)

1. Frontend sends the question to the backend.
2. Backend calls the Embedding API to turn the question into a vector.
3. Uses the vector to fetch the most relevant passages from the Vector Store (top-k).
4. Backend assembles the prompt: `system instructions + retrieved passages + user question`.
5. Calls the LLM API to generate an answer, and returns it to the frontend **with citations**.

From a familiar angle: it's an ordinary request handler with three external calls wired into the middle.

---

## Scope (MVP)

**In scope**

- A backend exposing two APIs: `/upload` (add a reference document) and `/chat` (ask a question).
- Ingestion pipeline: extract → chunk → embed → write to the vector store.
- RAG answering: retrieve relevant passages → stuff into the prompt → LLM generates an answer **with citations**.
- A thin frontend chat UI (built last).

**Out of scope** (avoid over-engineering — this is a single-user tool)

- Job queue / distributed background tasks — running synchronously, or FastAPI `BackgroundTasks`, is enough.
- Auth / multi-user / permissions.
- Upload de-duplication (idempotency) — revisit later using a content hash as the key.
- A fancy frontend — being testable with curl / Postman is enough to start.

---

## API Design

### `POST /upload`

Upload one reference document, triggering ingestion.

- Request: `multipart/form-data`, field `file`
- Response (MVP runs synchronously; a few seconds is fine):

```json
{
  "status": "done",
  "doc_id": "insurance_2026.pdf",
  "chunks_added": 42
}
```

### `POST /chat`

Ask a question, get an answer with citations.

- Request:

```json
{
  "question": "Does my plan cover teeth cleaning?",
  "top_k": 4
}
```

- Response:

```json
{
  "answer": "Based on your plan document, …(please confirm with the insurer).",
  "sources": [
    { "doc": "insurance_2026.pdf", "chunk": "…source passage…", "score": 0.83 }
  ]
}
```

### Error handling (design intent)

| Case                               | Response                                                                |
| ---------------------------------- | ----------------------------------------------------------------------- |
| No relevant passages retrieved     | Return a "not found in your documents" answer, **not** a hallucination. |
| Unsupported file type on `/upload` | `400` with a clear message; do not partially ingest.                    |
| Embedding / LLM API failure        | `502`, surface that it's an upstream error; do not fake an answer.      |
| Empty question                     | `400`.                                                                  |

---

## Ingestion

Separate the **trigger** from the **logic**. The real work is a plain function that both `/upload` and any future batch script can call:

```
ingest_document(file, doc_name):
    text   = extract_text(file)          # read the file
    chunks = split_into_chunks(text)     # chunk it
    for chunk in chunks:
        vec = embedding_api(chunk)       # embed
        vector_store.upsert(vec, metadata={doc_name, chunk_index})
```

**Ingestion is slow** — one embedding-API call per chunk. Synchronous is fine for the MVP.
To smooth the UX, use FastAPI `BackgroundTasks` so `/upload` can return "processing" first.
**Do not add a job queue yet.**

### Chunking

- Chunk by a target token size with some overlap, so a passage split across a boundary is still
  retrievable. Start simple (e.g. ~500 tokens, ~50 overlap) and tune against real retrieval quality.
- Keep enough metadata per chunk (`doc_name`, `chunk_index`, and ideally page/section) so citations
  can point a human back to the exact source.

### Re-ingestion

Documents get revised (a new insurance plan year, an updated policy). Keep a path to re-ingest a
document — for the MVP, delete existing chunks for that `doc_id` and re-run ingestion.

---

## Data Model

One vector-store collection of chunks. Each row:

| Field              | Purpose                                    |
| ------------------ | ------------------------------------------ |
| `id`               | Unique chunk id (`{doc_id}#{chunk_index}`) |
| `vector`           | The embedding                              |
| `doc_id`           | Source document name / id                  |
| `chunk_index`      | Position within the document               |
| `text`             | The raw passage (returned in `sources`)    |
| `page` / `section` | Optional, for more precise citations       |

> **Invariant: build and query must use the same embedding model.** Different models produce
> different coordinate spaces, so mixing them makes similarity comparison meaningless. If the
> embedding model changes, the whole store must be re-embedded.

---

## High-Risk Content Principles

Insurance claims, visa / school policy — the cost of a wrong answer is high. The design must:

- **Always cite** — which document, which passage.
- **Stay conservative** — "your document says…, please confirm with the insurer / school."
- **Time-sensitive policy** (visas, etc.) → point to the official source; don't let the bot replace verification.
- **Support revisions** — keep the re-ingestion path so stale documents can be refreshed.

---

## Build Order (backend first)

1. **Get `/chat` working against fake data** — manually insert a few passages into the vector store and verify the RAG loop (test with curl).
2. **Wire up the real embedding + LLM APIs** — confirm retrieval quality and answer format.
3. **`/upload`** — factor ingestion into a function, run synchronously.
4. **Thin frontend** — a single-page chat wired to `/chat`.
5. Once it runs cleanly locally, talk deployment (VPS / Fly.io …).

---

## Tech Stack (MVP)

| Item                 | Choice                               | Notes                                          |
| -------------------- | ------------------------------------ | ---------------------------------------------- |
| Language / Framework | Python + FastAPI                     | The RAG ecosystem is smoothest in Python       |
| Vector Store         | Chroma (to start) or pgvector        | pgvector aligns with 15-445 / infra direction  |
| Embedding            | An off-the-shelf embedding API (TBD) | Pick the most cost-effective one when building |
| LLM                  | Claude API (or others)               | Confirm model / cost when building             |
| Frontend             | Later                                | Test the backend with curl / Postman first     |
