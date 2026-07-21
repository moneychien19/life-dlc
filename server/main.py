from fastapi import FastAPI
from services.vector_store import collection

app = FastAPI()

@app.get("/")
async def root():
  return {"message": "Hello, World!"}

@app.get("/db-check")
async def db_check():
    # seed a fake passage (this is your design doc's "Step 1: fake data")
    collection.upsert(
        ids=["insurance_2026.pdf#0"],
        documents=["Your plan covers one teeth cleaning per year."],
        metadatas=[{"doc_id": "insurance_2026.pdf", "chunk_index": 0}],
    )
    hits = collection.query(query_texts=["dental coverage"], n_results=1)
    return {"count": collection.count(), "hits": hits}