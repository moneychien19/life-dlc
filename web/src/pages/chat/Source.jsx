import styled from "@emotion/styled";

export const Sources = ({ sources }) => {
  if (!sources || sources.length === 0) return null;
  return (
    <StyledSourcesBlock>
      {sources.map((s, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: fixed list per message; never reorders
        <StyledTitle key={i}>
          <StyledSourceHead>
            <StyledCite>[{i + 1}]</StyledCite>
            <StyledDoc>{s.doc}</StyledDoc>
            <StyledScore>score {s.score}</StyledScore>
          </StyledSourceHead>
          <StyledScoreChunk>{s.chunk}</StyledScoreChunk>
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
