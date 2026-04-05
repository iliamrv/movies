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
  justify-content: center;
  gap: 8px;

  padding: 10px 14px;
  border-radius: 12px;

  border: 1px solid ${({ $secondary }) => ($secondary ? "#dbe1ea" : "#cfd8e3")};
  background: ${({ $secondary }) => ($secondary ? "#ffffff" : "#eef4ff")};
  color: #111827;

  cursor: pointer;
  font-weight: 600;
  font-size: 0.92rem;
  line-height: 1;

  transition:
    background-color 0.18s ease,
    border-color 0.18s ease,
    transform 0.18s ease,
    box-shadow 0.18s ease;

  svg {
    flex-shrink: 0;
  }

  &:hover {
    background: ${({ $secondary }) => ($secondary ? "#f8fafc" : "#e5efff")};
    border-color: #bfd0e5;
    box-shadow: 0 10px 22px rgba(15, 23, 42, 0.08);
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
    box-shadow: none;
  }

   &:focus-visible {
    outline: none;
    box-shadow: 0 0 0 4px rgba(191, 208, 229, 0.35);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
`;