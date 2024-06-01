
import Link from "next/link";
import { Laptop } from "lucide-react";



function Navbar() {


  return (


    <>

      <div className="header flex justify-between items-center ">



        <div className="logo">

          <Link href="/">
            <Laptop size={30} color="#0777f5 " strokeWidth={1} />



          </Link>
        </div>






        <div className="flex-1 w-64">


          {/* <input
            onClick={resetFields}
            className="search shadow  rounded  text-gray-700 w-full"
            placeholder="Search"
            onInput={(e) => {
              setFilters({
                global: {
                  value: e.target.value,
                  matchMode: FilterMatchMode.CONTAINS,
                },
              });
            }}
          /> */}

        </div>

        <div className="buttons ">




          <Link
            className="bg-white hover:bg-gray-100 py-2 px-4 border border-gray-400 rounded shadow no-underline mx-5"
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

        </div>





      </div>


    </>




  );
}



export default Navbar;

