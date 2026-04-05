import Navbar from "./Navbar";
import styled from "styled-components";

const Layout = ({ children }) => {
  return (
    <PageShell>
      <Navbar />
      <Wrapper>{children}</Wrapper>
    </PageShell>
  );
};

export default Layout;

const PageShell = styled.div`
  min-height: 100vh;
  background: #f6f7fb;
`;

export const Wrapper = styled.div`
  margin: 0 auto;
  max-width: 1180px;
  padding: 0 20px 40px;
  display: flex;
  flex-direction: column;

  * {
    font-family: var(--font-roboto-mono);
    box-sizing: border-box;
  }

  a {
    text-decoration: none;
    color: #1f2937;
    transition: color 0.18s ease;
  }

  a:hover {
    color: #111827;
  }

  h1,
  h2,
  h3 {
    color: #111827;
    letter-spacing: -0.02em;
  }

  .page-title {
    margin: 6px 0 18px;
    font-size: 1.8rem;
    font-weight: 700;
  }

  .description,
  form,
  .message {
    width: 100%;
    max-width: 560px;
    padding: 22px;
    border-radius: 18px;
    background: #ffffff;
    border: 1px solid #e5e7eb;
    box-shadow: 0 10px 30px rgba(17, 24, 39, 0.05);
  }

  .description {
    color: #4b5563;
    font-size: 0.96rem;
    line-height: 1.65;
  }
`;