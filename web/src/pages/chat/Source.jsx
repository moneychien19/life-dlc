import styled from "@emotion/styled";

// Render the chunk, highlighting the verified supporting quote if present.
const Chunk = ({ chunk, quote }) => {
  if (!quote || !chunk.includes(quote)) {
    return <StyledScoreChunk>{chunk}</StyledScoreChunk>;
  }
  const start = chunk.indexOf(quote);
  const before = chunk.slice(0, start);
  const after = chunk.slice(start + quote.length);
  return (
    <StyledScoreChunk>
      {before}
      <StyledMark>{quote}</StyledMark>
      {after}
    </StyledScoreChunk>
  );
};

export const Sources = ({ sources }) => {
  if (!sources || sources.length === 0) return null;

  // Only show sources the answer actually cited, keeping their original number.
  const cited = sources
    .map((source, i) => ({ source, num: i + 1 }))
    .filter(({ source }) => source.cited);

  if (cited.length === 0) return null;

  return (
    <StyledSourcesBlock>
      {cited.map(({ source, num }) => (
        <StyledTitle key={num}>
          <StyledSourceHead>
            <StyledCite>[{num}]</StyledCite>
            <StyledDoc>{source.doc}</StyledDoc>
            <StyledScore>score {source.score}</StyledScore>
          </StyledSourceHead>
          <Chunk chunk={source.chunk} quote={source.quote} />
        </StyledTitle>
      ))}
    </StyledSourcesBlock>
  );
};

const StyledSourcesBlock = styled.ul`
  list-style: none;
  margin: var(--md) 0 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: var(--xs);
`;
const StyledTitle = styled.li`
  background: var(--surface-1);
  border: 1px solid var(--hairline);
  padding: var(--sm) var(--md);
`;
const StyledSourceHead = styled.div`
  display: flex;
  align-items: baseline;
  gap: var(--xs);
  flex-wrap: wrap;
  margin-bottom: var(--xxs);
`;
const StyledCite = styled.span`
  color: var(--primary);
  font-weight: 600;
`;
const StyledDoc = styled.span`
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.16px;
  color: var(--ink);
  word-break: break-all;
`;
const StyledScore = styled.span`
  margin-left: auto;
  font-size: 12px;
  letter-spacing: 0.32px;
  color: var(--ink-subtle);
`;
const StyledScoreChunk = styled.p`
  margin: 0;
  font-size: 14px;
  line-height: 1.4;
  letter-spacing: 0.16px;
  color: var(--ink-muted);
`;
// The verified supporting sentence — a restrained blue-tint highlight.
const StyledMark = styled.mark`
  background: rgba(15, 98, 254, 0.12);
  color: var(--ink);
  padding: 0 2px;
`;
