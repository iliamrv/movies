

import Navbar from "./Navbar";



const Layout = ({ children }) => {
  return (
    <div className=" lg:max-w-6xl mx-auto ">
      <div className="prose max-w-none mt-10 my-10 md:px-5 m-2 ">


        <Navbar />





        {children}

      </div>
    </div>
  );
};



export default Layout;
