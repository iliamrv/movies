import Link from "next/link";

function resetFields() {
  console.log("click");
}

function Navbar() {
  return (
    <nav>
      <Link
        onClick={resetFields}
        className="bg-white hover:bg-gray-100 py-2 px-4 border border-gray-400 rounded shadow"
        href="/"
      >
        Home
      </Link>
      <Link
        className="bg-white hover:bg-gray-100 py-2 px-4 border border-gray-400 rounded shadow"
        href="/create"
      >
        Create
      </Link>
      {/* <Link
        className="bg-white hover:bg-gray-100 py-2 px-4 border border-gray-400 rounded shadow"
        href="/7/"
      >
        Movie
      </Link> */}
    </nav>
  );
}

export default Navbar;
