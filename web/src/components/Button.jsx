import styled from "@emotion/styled";
import { Button as MuiButton } from "@mui/material";

export const Button = ({ type, disabled, children }) => {
  return (
    <StyledButton
      type={type}
      disabled={disabled}
      disableElevation
      disableRipple
    >
      {children}
    </StyledButton>
  );
};

const StyledButton = styled(MuiButton)`
  &.MuiButton-root {
    flex: 0 0 auto;
    background: var(--primary);
    color: var(--on-primary);
    border: none;
    border-radius: 0;
    padding: 12px var(--md);
    font-family: inherit;
    font-size: 14px;
    font-weight: 400;
    letter-spacing: 0.16px;
    text-transform: none;
    box-shadow: none;
    min-width: 64px;

    &:hover:not(.Mui-disabled) {
      background: var(--blue-hover);
      box-shadow: none;
    }

    &.Mui-disabled {
      background: #e0e0e0;
      color: var(--ink-subtle);
      cursor: not-allowed;
      pointer-events: auto;
    }
  }
`;
