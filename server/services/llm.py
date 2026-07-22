import json
import re

from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()
client = OpenAI()


# Fold typographic characters to ASCII so a model's straight quotes / plain
# hyphens match a PDF's curly quotes / dashes. 1:1 only, so index mapping stays exact.
_FOLD = str.maketrans(
  {
    "‘": "'",  # ' left single quote
    "’": "'",  # ' right single quote (apostrophe)
    "“": '"',  # " left double quote
    "”": '"',  # " right double quote
    "–": "-",  # – en dash
    "—": "-",  # — em dash
    "−": "-",  # − minus sign
    " ": " ",  # non-breaking space
  }
)


def find_verbatim_span(quote: str, chunk: str) -> str | None:
  """Return the substring of `chunk` matching `quote`, tolerant of whitespace and
  typographic differences (PDF extraction adds stray newlines/spaces and uses curly
  quotes / dashes where the model writes ASCII).

  Compares on normalized text but returns the original chunk span, so the frontend
  can still exact-match and highlight the real text. None if no match.
  """
  norm_quote = re.sub(r"\s+", " ", quote.translate(_FOLD)).strip()
  if not norm_quote:
    return None

  # `translate` is 1:1, so folded indices line up with the original chunk.
  folded = chunk.translate(_FOLD)
  norm_chars, idx_map, prev_space = [], [], False
  for orig_i, ch in enumerate(folded):
    if ch.isspace():
      if prev_space:
        continue
      norm_chars.append(" ")
      prev_space = True
    else:
      norm_chars.append(ch)
      prev_space = False
    idx_map.append(orig_i)
  norm_chunk = "".join(norm_chars)

  pos = norm_chunk.find(norm_quote)
  if pos == -1:
    return None
  start = idx_map[pos]
  end = idx_map[pos + len(norm_quote) - 1]
  return chunk[start : end + 1]

SYSTEM_PROMPT = """You answer questions about the user's own reference documents \
(insurance, school policy, visa paperwork).

Rules:
- Answer ONLY from the provided sources. If they don't contain the answer, say you \
couldn't find it in their documents — do not guess.
- On high-stakes topics (insurance claims, visa, school policy), stay conservative: \
state what the document says, then remind the user to confirm with the insurer / \
school / official source.
- Cite the sources you used by their number, like [1], [2]. Put each [n] marker \
inline in the answer text, right after the fact it supports.

Respond as JSON with this exact shape:
{
  "answer": "<your answer text, with [n] citation markers>",
  "citations": [
    {"index": <the source number you cited>, "quote": "<the exact sentence, copied verbatim from that source, that supports the claim>"}
  ]
}
Each quote MUST be copied word-for-word from the cited source text — do not \
paraphrase, trim, or edit it. Include one citation entry per source number you rely on."""


def generate_answer(question: str, sources: list) -> str:
  """Generate an answer and attach a verified supporting quote to each cited source.

  Mutates `sources` in place: sets `source.quote` only when the model's quote is an
  exact substring of that source's chunk (never surface an unverified quote).
  """
  context = "\n\n".join(
    f"[{i + 1}] (from {s.doc})\n{s.chunk}" for i, s in enumerate(sources)
  )
  user_message = (
    f"Sources:\n{context}\n\n"
    f"Question: {question}\n\n"
    "Answer using only the sources above. Respond as JSON."
  )

  response = client.chat.completions.create(
    model="gpt-4o",
    max_tokens=1024,
    response_format={"type": "json_object"},
    messages=[
      {"role": "system", "content": SYSTEM_PROMPT},
      {"role": "user", "content": user_message},
    ],
  )

  data = json.loads(response.choices[0].message.content)
  answer = data.get("answer", "")

  for citation in data.get("citations", []):
    quote = (citation.get("quote") or "").strip()
    try:
      idx = int(citation.get("index"))
    except (TypeError, ValueError):
      continue
    if not (1 <= idx <= len(sources)):
      continue
    source = sources[idx - 1]
    source.cited = True
    # Highlight only a quote that appears (whitespace-tolerantly) in its chunk.
    if source.quote is None and quote:
      span = find_verbatim_span(quote, source.chunk)
      if span:
        source.quote = span

  return answer
