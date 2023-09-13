import { useState, useEffect } from "react";
import supabase from "../src/supabase";
import Table from "../components/Table";
import Loading from "./loading";

export default function Page() {
  const db_name = `movies`;
  const [isLoading, setIsLoading] = useState(false);
  const [newItems, setNewItems] = useState([]);
  const [orderBy, setOrderBy] = useState("id");
  const [isActive, setIsActive] = useState(false);
  // const [isAct, setIsAct] = useState(false);
  // const [ascOrder, setAscOrder] = useState(true);

  // function handleSearch(e) {
  //   setSearch(e.target.value.toLowerCase());
  // }

  const handleSort = (e) => {
    setIsActive((current) => !current);

    // console.log(btnState);

    setOrderBy(e.target.value);

    console.log(isActive);
  };

  useEffect(
    function () {
      async function getLPitems() {
        setIsLoading(true);
        const { data: movies, error } = await supabase
          .from(db_name)
          .select("")
          .limit(1115)
          .order(orderBy, { ascending: isActive });
        setNewItems(movies);
        setIsLoading(false);
      }
      getLPitems();
    },
    [orderBy, isActive]
  );

  return (
    <>
      <div className="prose max-w-none mt-10 my-10 md:px-5">
        <h1>Movies Database</h1>

        {/* <button
          className={isActive ? "asc " : null}
          value="title"
          onClick={handleSort}
        >
          title
        </button> */}

        {isLoading ? <Loading /> : <Table newItems={newItems} />}
      </div>
    </>
  );
}
