

import Navbar from "./Navbar";
import styled from "styled-components";



const Layout = ({ children }) => {
  return (
    <Wrapper>



      <Navbar />





      {children}


    </Wrapper>
  );
};



export default Layout;


export const Wrapper = styled.div`
  margin: 0 auto;
  max-width: 1200px;
  display: flex;
  flex-direction: column; 
  /* font-family: var(--font-roboto-mono);   */

 a {
  text-decoration: none;
   color: #333;
}

a:hover {
  /* text-decoration: underline; */
  color: #777;
  /* font-weight: 500; */
}



.description {
  
  border-radius: 6px;  

  padding: 20px;
  max-width: 480px;
  /* margin: 0 auto; */
  border-radius: 6px;
  background-color: #f9f9f9;
  font-size: 0.9rem;
}


/* forms */
form {
  padding: 20px;
  max-width: 480px;
  /* margin: 0 auto; */
  border-radius: 6px;
  background-color: rgba(238, 238, 238, 0.566);
}





* {
  font-family: var(--font-roboto-mono);
}


  
`;
