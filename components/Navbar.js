
import Link from "next/link";
import { Laptop } from "lucide-react";
import styled from "styled-components";



import { Button, StyledButtons } from "../styles/globalStyles";

function Navbar() {


  return (


    <StyledHeader>





      <Logo>

        <Link href="/">
          <Laptop size={30} color="#0777f5 " strokeWidth={1} />



        </Link>
      </Logo>



      <StyledButtons>
        <Button>
          <Link
            className="button"
            href="/createmovie"
          >
            Add movie
          </Link></Button>

        <Button><Link
          className="button"
          href="/towatch"
        >
          To watch
        </Link></Button>

        <Button> <Link
          className="button"
          href="/stats"
        >
          Stats
        </Link></Button>
      </StyledButtons>


    </StyledHeader>




  );
}



export default Navbar;

const StyledHeader = styled.div`  
  padding: 7px;
  margin-bottom: 50px ;
  display: flex;
 ;
   ;
  
`;

export const Logo = styled.div`
 
  padding: 5px;
  border: 1px solid #cce6ff;
  border-radius: 3px;  
  background: linear-gradient(to bottom, #feffff 0%, #cee7ff 100%);
  
  margin-right: 50px;  
  border-radius: 13px


  
`;


