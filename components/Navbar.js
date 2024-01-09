import Link from "next/link";

function Navbar() {
  return (
    <div className="flex flex-row ">
      <div className="flex-none">
        <h1 className="text-center">Movies Database</h1>
      </div>

      <div className="flex-auto w-64">
        <nav className="m-2">
          <Link
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

          <Link
            className="bg-white hover:bg-gray-100 py-2 px-4 border border-gray-400 rounded shadow no-underline"
            href="/towatch"
          >
            To watch
          </Link>
        </nav>
      </div>
    </div>
  );
}

export default Navbar;
