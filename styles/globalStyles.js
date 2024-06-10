
import styled from "styled-components";



export const StyledButtons = styled.div`   
 display: flex; /* Aligns children (icon and text) inline */


`;

export const Button = styled.button`  


  padding: 8px 16px;
  margin-right: 20px;
  text-decoration: none;
  color: #333;
  background-color: #fff;
  border: 1px solid #ccc;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
  display: flex;
  align-items: center;
 align-self: center;
 font-weight: 600;
/* font-size: 1rem; */




  svg {
    margin-right: 10px;
  }

  a { text-decoration: none;}

&:hover { background-color: #f3f3f3; }
 

`;



