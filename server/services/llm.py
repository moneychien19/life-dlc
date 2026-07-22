from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()
client = OpenAI()

SYSTEM_PROMPT = """You answer questions about the user's own reference documents \
(insurance, school policy, visa paperwork).

Rules:
- Answer ONLY from the provided sources. If they don't contain the answer, say you \
couldn't find it in their documents — do not guess.
- On high-stakes topics (insurance claims, visa, school policy), stay conservative: \
state what the document says, then remind the user to confirm with the insurer / \
school / official source.
- Cite the sources you used by their number."""

def generate_answer(question: str, sources: list) -> str:
  context = "\n\n".join(
    f"[{i + 1}] (from {s.doc})\n{s.chunk}" for i, s in enumerate(sources)
  )
  user_message = (
    f"Sources:\n{context}\n\n"
    f"Question: {question}\n\n"
    "Answer using only the sources above, and cite them by number."
  )

  response = client.chat.completions.create(
    model="gpt-4o",
    max_tokens=1024,
    messages=[
      {"role": "system", "content": SYSTEM_PROMPT},
      {"role": "user", "content": user_message},
    ],
  )

  return response.choices[0].message.content
