from pydantic import BaseModel

class Source(BaseModel):
  doc: str
  chunk: str
  score: float

class ChatRequest(BaseModel):
  question: str
  top_k: int = 5

class ChatResponse(BaseModel):
  answer: str
  sources: list[Source]
