from pydantic import BaseModel

class Source(BaseModel):
  doc: str
  chunk: str
  score: float
  quote: str | None = None  # verbatim supporting sentence within `chunk`, if any
  cited: bool = False  # did the answer actually use this source?

class ChatRequest(BaseModel):
  question: str
  top_k: int = 5

class ChatResponse(BaseModel):
  answer: str
  sources: list[Source]
