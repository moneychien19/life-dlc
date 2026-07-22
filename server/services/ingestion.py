from pypdf import PdfReader
from services.vector_store import collection

def extract_text_from_pdf(file_path) -> str:
  reader = PdfReader(file_path)
  return "\n".join(page.extract_text() or "" for page in reader.pages)

def split_into_chunks(text: str, size: int = 1000, overlap: int = 100) -> list[str]:
  chunks, start = [], 0
  while start < len(text):
    chunks.append(text[start:start + size])
    start += size - overlap
  return [c for c in chunks if c.strip()]

def ingest_document(file, doc_id: str) -> int:
  text = extract_text_from_pdf(file)
  chunks = split_into_chunks(text)

  collection.delete(where={"doc_id": doc_id})

  collection.upsert(
    ids=[f"{doc_id}#{i}" for i in range(len(chunks))],
    documents=chunks,
    metadatas=[{"doc_id": doc_id, "chunk_index": i} for i in range(len(chunks))],
  )
  return len(chunks)