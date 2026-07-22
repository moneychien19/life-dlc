from fastapi import FastAPI
from services.vector_store import collection
from services.llm import generate_answer
from schemas import ChatRequest, ChatResponse, Source

app = FastAPI()

@app.get("/")
async def root():
  return {"message": "Hello, World!"}

@app.get("/db-check")
async def db_check():
  collection.upsert(
    ids=["insurance_2026.pdf#0"],
    documents=["Your plan covers one teeth cleaning per year."],
    metadatas=[{"doc_id": "insurance_2026.pdf", "chunk_index": 0}],
  )
  collection.upsert(
    ids=["mse_handbook.pdf#1"],
    documents=["The program takes 16 months to complete."],
    metadatas=[{"doc_id": "mse_handbook.pdf", "chunk_index": 1}],
  )
  collection.upsert(
    ids = ["the_julian.pdf#2"],
    documents = ["The lease term is 12 months."],
    metadatas = [{"doc_id": "the_julian.pdf", "chunk_index": 2}],
  )
  collection.upsert(
    ids = ["taiwan_alumni.pdf#3"],
    documents = ["The alumni association meets every 3 months."],
    metadatas = [{"doc_id": "taiwan_alumni.pdf", "chunk_index": 3}],
  )

  hits = collection.query(query_texts=["meet"], n_results=1)
  return {"count": collection.count(), "hits": hits}
  
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