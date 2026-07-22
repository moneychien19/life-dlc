import { useState, useEffect, useRef } from "react";
import { askQuestion } from "./api";
import "./App.css";
import { Button, TextArea } from "./components";

// Render inline citation markers like [1] in the brand accent color.
function AnswerText({ text }) {
  const parts = text.split(/(\[\d+\])/g);
  return (
    <p className="answer">
      {parts.map((part, i) =>
        /^\[\d+\]$/.test(part) ? (
          <span key={i} className="cite">
            {part}
          </span>
        ) : (
          part
        ),
      )}
    </p>
  );
}

function Sources({ sources }) {
  if (!sources || sources.length === 0) return null;
  return (
    <ul className="sources">
      {sources.map((s, i) => (
        <li key={i} className="source-tile">
          <div className="source-head">
            <span className="cite">[{i + 1}]</span>
            <span className="source-doc">{s.doc}</span>
            <span className="source-score">score {s.score}</span>
          </div>
          <p className="source-chunk">{s.chunk}</p>
        </li>
      ))}
    </ul>
  );
}

export default function App() {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const logRef = useRef(null);
  const inputRef = useRef(null);

  // Keep the newest message in view.
  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight });
  }, [messages, loading]);

  // Auto-grow the textarea to fit its content (capped, then scrolls).
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 160) + "px";
  }, [question]);

  function handleKeyDown(e) {
    // Enter submits; Shift+Enter makes a newline. Ignore Enter mid-IME-composition.
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      handleSubmit(e);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const q = question.trim();
    if (!q || loading) return;

    setError("");
    setLoading(true);
    setMessages((prev) => [...prev, { role: "user", text: q }]);
    setQuestion("");

    try {
      const data = await askQuestion(q);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: data.answer, sources: data.sources },
      ]);
    } catch (err) {
      setError(err.message || "Something went wrong. Is the server running?");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="app">
      <header className="app-header">Life DLC — Chat</header>

      <main className="chat-log" ref={logRef}>
        {messages.length === 0 && !loading && (
          <div className="empty-state">
            Ask a question about your uploaded documents.
          </div>
        )}

        {messages.map((m, i) =>
          m.role === "user" ? (
            <div key={i} className="row row-user">
              <div className="message-user">{m.text}</div>
            </div>
          ) : (
            <div key={i} className="row row-assistant">
              <div className="message-assistant">
                <AnswerText text={m.text} />
                <Sources sources={m.sources} />
              </div>
            </div>
          ),
        )}

        {loading && (
          <div className="row row-assistant">
            <div className="message-assistant">
              <span className="dots" aria-label="Thinking">
                <span></span>
                <span></span>
                <span></span>
              </span>
            </div>
          </div>
        )}
      </main>

      {error && <div className="error-banner">{error}</div>}

      <form className="composer" onSubmit={handleSubmit}>
        <TextArea
          ref={inputRef}
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="e.g. Is dental cleaning covered?"
          disabled={loading}
        />
        <Button type="submit" disabled={loading || !question.trim()}>
          {loading ? "…" : "Ask"}
        </Button>
      </form>
    </div>
  );
}
