import Link from "next/link";

function resetFields() {
  console.log("click");
}

function Navbar() {
  return (
    <nav className="m-2">
      <Link
        onClick={resetFields}
        className="bg-white hover:bg-gray-100 py-2 px-4 border border-gray-400 rounded shadow no-underline"
        href="/"
      >
        Home
      </Link>
      <Link
        className="bg-white hover:bg-gray-100 py-2 px-4 border border-gray-400 rounded shadow no-underline"
        href="/create"
      >
        Add movie
      </Link>
    </nav>
  );
}

export default Navbar;
