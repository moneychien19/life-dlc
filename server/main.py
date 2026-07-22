from fastapi import FastAPI, UploadFile, File
from services.vector_store import collection
from services.ingestion import ingest_document
from services.llm import generate_answer
from schemas import ChatRequest, ChatResponse, Source

app = FastAPI()

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