import styled from "@emotion/styled";

export const AnswerText = ({ text }) => {
  const parts = text.split(/(\[\d+\])/g);
  return (
    <StyledAnswerText>
      {parts.map((part, i) =>
        /^\[\d+\]$/.test(part) ? (
          // biome-ignore lint/suspicious/noArrayIndexKey: static split of one string; never reorders
          <StyledCite key={i}>{part}</StyledCite>
        ) : (
          part
        ),
      )}
    </StyledAnswerText>
  );
};

const StyledAnswerText = styled.p`
  margin: 0;
  font-size: 16px;
  line-height: 1.5;
  letter-spacing: 0.16px;
  color: var(--ink);
  white-space: pre-wrap;
  word-break: break-word;
`;
const StyledCite = styled.span`
  color: var(--primary);
  font-weight: 600;
`;
