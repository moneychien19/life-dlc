import styled from "@emotion/styled";

export const TextArea = ({
  ref,
  value,
  placeholder,
  disabled = false,
  onChange = () => {},
  onKeyDown = () => {},
}) => {
  return (
    <StyledTextArea
      ref={ref}
      value={value}
      onChange={onChange}
      onKeyDown={onKeyDown}
      placeholder={placeholder}
      rows={1}
      disabled={disabled}
      autoFocus
    />
  );
};

const StyledTextArea = styled.textarea`
  flex: 1 1 auto;
  min-width: 0;
  background: var(--surface-1);
  color: var(--ink);
  border: none;
  border-bottom: 1px solid var(--hairline-strong);
  padding: 11px var(--md);
  font-family: inherit;
  font-size: 16px;
  line-height: 1.5;
  letter-spacing: 0.16px;
  outline: none;
  resize: none;
  overflow-y: auto;
  max-height: 160px;

  &:focus {
    border-bottom: 2px solid var(--primary);
    padding-bottom: 10px;
  }

  &:disabled {
    color: var(--ink-subtle);
    cursor: not-allowed;
  }

  @media (max-width: 720px) {
    min-height: 48px;
  }
`;
