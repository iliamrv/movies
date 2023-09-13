import { useState, useEffect } from "react";
import supabase from "../src/supabase";
import TestTable from "../components/TestTable";
import Loading from "./loading";

export default function Page() {
  const db_name = `movies`;
  const [isLoading, setIsLoading] = useState(false);
  const [newItems, setNewItems] = useState([]);
  const [orderBy, setOrderBy] = useState("id");
  const [isActive, setIsActive] = useState(false);

  // const [ascOrder, setAscOrder] = useState(true);

  // function handleSearch(e) {
  //   setSearch(e.target.value.toLowerCase());
  // }

  useEffect(
    function () {
      async function getLPitems() {
        setIsLoading(true);
        const { data: movies, error } = await supabase
          .from(db_name)
          .select("")
          .limit(10)
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

        {isLoading ? (
          <Loading />
        ) : (
          <TestTable
            setIsActive={setIsActive}
            setOrderBy={setOrderBy}
            newItems={newItems}
          />
        )}
      </div>
    </>
  );
}
