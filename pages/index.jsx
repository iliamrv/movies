import { useState, useEffect } from "react";
import supabase from "../src/supabase";
import Table from "../components/Table";
import Loading from "./loading";
// import styled from "styled-components";

export default function Page() {
  const db_name = `movies_2024`;
  const [isLoading, setIsLoading] = useState(false);
  const [newItems, setNewItems] = useState([]);
  // const [orderBy, setOrderBy] = useState("id");
  // const [isActive, setIsActive] = useState(false);

  useEffect(function () {
    async function getLPitems() {
      setIsLoading(true);
      const { data: movies, error } = await supabase
        .from(db_name)
        .select("*")
        .eq("watched_mark", true)
        .order("watchTime", { ascending: false });
      // .limit(1115);
      setNewItems(movies);
      setIsLoading(false);
    }
    getLPitems();
  }, []);

  // function resetFields(e) {
  //   setFilters("");
  //   e.target.value = "";
  // }


  return <>










    {isLoading ? <Loading /> : <Table newItems={newItems} />}</>;
}




