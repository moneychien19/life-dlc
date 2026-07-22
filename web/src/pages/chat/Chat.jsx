import styled from "@emotion/styled";
import { useEffect, useRef, useState } from "react";
import { askQuestion } from "../../api";
import { Button, TextArea } from "../../components";
import { AnswerText } from "./AnswerText";
import { Sources } from "./Source";

export const Chat = () => {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const logRef = useRef(null);
  const inputRef = useRef(null);

  // Keep the newest message in view.
  // biome-ignore lint/correctness/useExhaustiveDependencies: deps are intentional re-run triggers (scroll on new message / loading)
  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight });
  }, [messages, loading]);

  // Auto-grow the textarea to fit its content (capped, then scrolls).
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional re-run trigger (resize as the question text changes)
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    const full = el.scrollHeight;
    el.style.height = `${Math.min(full, 160)}px`;
    el.style.overflowY = full > 160 ? "auto" : "hidden";
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
    setMessages((prev) => [
      ...prev,
      { id: crypto.randomUUID(), role: "user", text: q },
    ]);
    setQuestion("");

    try {
      const data = await askQuestion(q);
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          text: data.answer,
          sources: data.sources,
        },
      ]);
    } catch (err) {
      setError(err.message || "Something went wrong. Is the server running?");
    } finally {
      setLoading(false);
    }
  }

  return (
    <StyledChat>
      <StyledChatLog ref={logRef}>
        {messages.length === 0 && !loading && (
          <StyledEmptyState>
            Ask a question about your uploaded documents.
          </StyledEmptyState>
        )}

        {messages.map((m) =>
          m.role === "user" ? (
            <StyledRow key={m.id} $align="end">
              <StyledMessageUser>{m.text}</StyledMessageUser>
            </StyledRow>
          ) : (
            <StyledRow key={m.id} $align="start">
              <StyledMessageAssistant>
                <AnswerText text={m.text} />
                <Sources sources={m.sources} />
              </StyledMessageAssistant>
            </StyledRow>
          ),
        )}

        {loading && (
          <StyledRow $align="start">
            <StyledMessageAssistant>
              <StyledDots role="status" aria-label="Thinking">
                <span></span>
                <span></span>
                <span></span>
              </StyledDots>
            </StyledMessageAssistant>
          </StyledRow>
        )}
      </StyledChatLog>

      {error && <StyledError>{error}</StyledError>}

      <StyledChatForm onSubmit={handleSubmit}>
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
      </StyledChatForm>
    </StyledChat>
  );
};

const StyledChat = styled.div`
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
`;
const StyledChatLog = styled.div`
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  padding: var(--lg) var(--md);
  display: flex;
  flex-direction: column;
  gap: var(--lg);

  @media (max-width: 720px) {
    padding: var(--md) var(--sm);
    gap: var(--md);
  }
`;
const StyledEmptyState = styled.div`
  margin: auto;
  text-align: center;
  color: var(--ink-subtle);
  font-size: 16px;
  letter-spacing: 0.16px;
  padding: var(--xxl) var(--md);
`;
const StyledRow = styled.div`
  display: flex;
  justify-content: ${({ $align }) =>
    $align === "end" ? "flex-end" : "flex-start"};
`;
const StyledMessageUser = styled.div`
  max-width: 75%;
  background: var(--surface-1);
  color: var(--ink);
  padding: var(--sm) var(--md);
  font-size: 16px;
  line-height: 1.5;
  letter-spacing: 0.16px;
  white-space: pre-wrap;
  word-break: break-word;

  @media (max-width: 720px) {
    max-width: 85%;
  }
`;
const StyledMessageAssistant = styled.div`
  max-width: 100%;
  background: var(--canvas);
  border-left: 2px solid var(--primary);
  padding: var(--sm) var(--md);
`;
const StyledDots = styled.span`
  display: inline-flex;
  gap: 6px;
  padding: 4px 0;

  span {
    width: 6px;
    height: 6px;
    display: inline-block;
    background: var(--ink-subtle);
    animation: blink 1.2s infinite ease-in-out both;
  }
  span:nth-of-type(2) {
    animation-delay: 0.2s;
  }
  span:nth-of-type(3) {
    animation-delay: 0.4s;
  }

  @keyframes blink {
    0%,
    80%,
    100% {
      opacity: 0.2;
    }
    40% {
      opacity: 1;
    }
  }
`;
const StyledError = styled.div`
  flex: 0 0 auto;
  border-left: 2px solid var(--error);
  color: var(--error);
  font-size: 14px;
  letter-spacing: 0.16px;
  padding: var(--sm) var(--md);
  margin: 0 var(--md);
  background: var(--canvas);
`;
const StyledChatForm = styled.form`
  flex: 0 0 auto;
  display: flex;
  align-items: flex-end;
  gap: var(--xs);
  padding: var(--md);
  border-top: 1px solid var(--hairline);

  @media (max-width: 720px) {
    padding: var(--sm);
  }
`;
