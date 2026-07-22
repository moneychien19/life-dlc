from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from services.vector_store import collection
from services.ingestion import ingest_document
from services.llm import generate_answer
from schemas import ChatRequest, ChatResponse, Source

app = FastAPI()

# Allow the React dev server (Vite) to call the API from a different origin.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
  return {"message": "Hello, World!"}
  
@app.post("/upload")
async def upload(file: UploadFile = File(...)):
  chunks_added = ingest_document(file.file, doc_id=file.filename)
  return {"status": "done", "doc_id": file.filename, "chunks_added": chunks_added}

@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
  results = collection.query(query_texts=[request.question], n_results=request.top_k)

  docs = results["documents"][0]
  metas = results["metadatas"][0]
  dists = results["distances"][0]

  sources = [
    Source(doc=meta["doc_id"], chunk=doc, score=round(1 - dist, 3))
    for doc, meta, dist in zip(docs, metas, dists)
  ]

  if not sources:
    return ChatResponse(
      answer="I couldn't find anything about that in your documents.",
      sources=[],
    )

  answer = generate_answer(request.question, sources)
  return ChatResponse(answer=answer, sources=sources)

@app.get("/documents")
async def list_documents():
  docs = collection.get(include=["metadatas"])
  counts = {}
  for meta in docs["metadatas"]:
    counts[meta["doc_id"]] = counts.get(meta["doc_id"], 0) + 1
  
  return {
    "documents": [
      {"doc_id": doc_id, "chunks": n} for doc_id, n in counts.items()
    ]
  }

@app.delete("/documents/{doc_id}")
async def delete_document(doc_id: str):
  existing = collection.get(where={"doc_id": doc_id}, include=[])
  if not existing["ids"]:
    raise HTTPException(status_code=404, detail=f"No document '{doc_id}'")
  collection.delete(where={"doc_id": doc_id})
  return {"status": "deleted", "doc_id": doc_id, "chunks_removed": len(existing["ids"])}