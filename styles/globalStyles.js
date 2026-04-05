import styled from "styled-components";

export const StyledButtons = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
`;

export const Button = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  margin-right: 0;
  border-radius: 12px;
  border: 1px solid ${({ $secondary }) => ($secondary ? "#dbe1ea" : "#cfd8e3")};
  background: ${({ $secondary }) => ($secondary ? "#ffffff" : "#eef4ff")};
  color: #111827;
  cursor: pointer;
  transition:
    background-color 0.18s ease,
    border-color 0.18s ease,
    transform 0.18s ease,
    box-shadow 0.18s ease;
  font-weight: 600;
  line-height: 1;

  svg {
    flex-shrink: 0;
  }

  &:hover {
    background: ${({ $secondary }) => ($secondary ? "#f8fafc" : "#e5efff")};
    border-color: #bfd0e5;
    box-shadow: 0 8px 18px rgba(15, 23, 42, 0.06);
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
  }
`;