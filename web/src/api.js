const API_BASE = "http://localhost:8000";

export async function askQuestion(question, topK = 4) {
  const res = await fetch(`${API_BASE}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question, top_k: topK }),
  });
  if (!res.ok) {
    throw new Error(`Request failed (${res.status})`);
  }
  return res.json(); // { answer, sources: [{ doc, chunk, score }] }
}
