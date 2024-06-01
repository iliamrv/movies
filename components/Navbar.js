
import Link from "next/link";
import { Laptop } from "lucide-react";
import styled from "styled-components";


function Navbar() {


  return (


    <StyledHeader>

      <div className=" flex justify-between items-center ">



        <div className="logo">

          <Link href="/">
            <Laptop size={30} color="#0777f5 " strokeWidth={1} />



          </Link>
        </div>






        <div className="flex-1 w-64">



        </div>

        <div className="buttons ">




          <Link
            className="button"
            href="/create"
          >
            Add movie
          </Link>

          <Link
            className="button"
            href="/towatch"
          >
            To watch
          </Link>

          <Link
            className="button"
            href="/stats"
          >
            Stats
          </Link>

        </div>





      </div>


    </StyledHeader>




  );
}



export default Navbar;


const StyledHeader = styled.div`  
  padding: 7px;
  margin-bottom: 50px ;
  
  
`;
