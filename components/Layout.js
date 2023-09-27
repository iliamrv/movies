import Navbar from "./Navbar";

const Layout = ({ children }) => {
  return (
    <div className="max-w-md mx-auto   md:max-w-2xl">
      <div className="prose max-w-none mt-10 my-10 md:px-5 m-2">
        <Navbar />
        {children}
        {/* <Footer /> */}
      </div>
    </div>
  );
};

export default Layout;
