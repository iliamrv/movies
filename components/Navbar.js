import Link from "next/link";
import { useRouter } from "next/router";
import {
  Film,
  Plus,
  Clock3,
  BarChart3,
  Library,
  Images,
} from "lucide-react";
import styled from "styled-components";
import { Button, StyledButtons } from "../styles/globalStyles";

function Navbar() {
  const router = useRouter();

  function isActive(path) {
    if (path === "/") return router.pathname === "/";
    return router.pathname.startsWith(path);
  }

  return (
    <HeaderOuter>
      <HeaderInner>
        <Link href="/" passHref legacyBehavior>
          <Logo>
            <Film size={18} />
            <span>MovieBase</span>
          </Logo>
        </Link>

        <StyledButtons>
          <Link href="/" passHref legacyBehavior>
            <a>
              <Button as="span" $secondary={!isActive("/")}>
                <Library size={16} />
                Library
              </Button>
            </a>
          </Link>

          <Link href="/recent" passHref legacyBehavior>
            <a>
              <Button as="span" $secondary={!isActive("/recent")}>
                <Images size={16} />
                Recent
              </Button>
            </a>
          </Link>

          <Link href="/towatch" passHref legacyBehavior>
            <a>
              <Button as="span" $secondary={!isActive("/towatch")}>
                <Clock3 size={16} />
                To watch
              </Button>
            </a>
          </Link>

          <Link href="/stats" passHref legacyBehavior>
            <a>
              <Button as="span" $secondary={!isActive("/stats")}>
                <BarChart3 size={16} />
                Stats
              </Button>
            </a>
          </Link>

          <Link href="/createmovie" passHref legacyBehavior>
            <a>
              <Button as="span">
                <Plus size={16} />
                Add movie
              </Button>
            </a>
          </Link>



        </StyledButtons>
      </HeaderInner>
    </HeaderOuter>
  );
}

export default Navbar;

/* ---------------- styled ---------------- */

const HeaderOuter = styled.header`
  position: sticky;
  top: 0;
  z-index: 30;
  background: rgba(246, 247, 251, 0.82);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(229, 231, 235, 0.9);
  margin-bottom: 28px;
`;

const HeaderInner = styled.div`
  max-width: 1180px;
  margin: 0 auto;
  padding: 14px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
`;

export const Logo = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  border: 1px solid #dbe4f0;
  border-radius: 999px;
  background: #ffffff;
  color: #111827;
  box-shadow: 0 8px 20px rgba(15, 23, 42, 0.05);
  font-weight: 700;
  letter-spacing: -0.02em;
  cursor: pointer;
`;