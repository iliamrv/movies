import Navbar from "./Navbar";

const Layout = ({ children }) => {
  return (
    <div className="max-w-md mx-auto   md:max-w-2xl">
      <Navbar />
      {children}
      {/* <Footer /> */}
    </div>
  );
};

export default Layout;
