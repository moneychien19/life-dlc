import styled from "@emotion/styled";
import { Chat } from "./pages/chat";

export default function App() {
  return (
    <StyledApp>
      <StyledHeader>Life DLC — Chat</StyledHeader>
      <Chat />
    </StyledApp>
  );
}

const StyledApp = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  max-width: 720px;
  margin: 0 auto;
  background: var(--canvas);
  border-inline: 1px solid var(--hairline);

  @media (max-width: 720px) {
    border-inline: none;
  }
`;
const StyledHeader = styled.header`
  flex: 0 0 auto;
  height: 48px;
  display: flex;
  align-items: center;
  padding: 0 var(--md);
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.16px;
  color: var(--ink);
  border-bottom: 1px solid var(--hairline);
`;
