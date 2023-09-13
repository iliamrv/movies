import { useState } from "react";
import Link from "next/link";
// import Filter from "./Filter";
// import Sort from "./Sort";
import ImdbPanel from "./ImdbPanel";

//theme
import "primereact/resources/themes/lara-light-indigo/theme.css";

//core
import "primereact/resources/primereact.min.css";

import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
// import { JoinRight } from "@mui/icons-material";
import { FilterMatchMode } from "primereact/api";
import { InputText } from "primereact/inputtext";

function Table({ newItems }) {
  // const [ratingFilter, setRatingFilter] = useState("");
  // const [search, setSearch] = useState("");

  const [imdbInfo, setImdbInfo] = useState("");
  const [imdbPanel, setImdbPanel] = useState(true);
  // const [btnState, setBtnState] = useState(false);

  const linkTitle = (newItems) => {
    return (
      <Link
        className=" no-underline dark:text-blue-500 hover:underline"
        href={"/" + newItems.id}
      >
        {newItems.title}
      </Link>
    );
  };

  const [filters, setFilters] = useState({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
  });

  // function resetFields() {
  //   setRatingFilter("");
  //   setSearch("");
  // }

  // console.log(ratingFilter);

  // const handleClick = (e) => {
  //   setIsAct((current) => !current);
  //   // console.log(btnState);

  //   setOrderBy(e.target.value);

  //   // console.log(isAct);
  // };

  // function handleInfo(imdbid) {
  //   if (imdbid) {
  //     setImdbInfo(imdbid);
  //     console.log(e.target.value);
  //   }

  // setImdbPanel(true);

  return (
    <div>
      <div>
        {/* <input
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search movie title"
          className="shadow  rounded  text-gray-700 
              "
          id="username"
          type="text"
          
        /> */}

        <InputText
          onInput={(e) => {
            setFilters({
              global: {
                value: e.target.value,
                matchMode: FilterMatchMode.CONTAINS,
              },
            });
          }}
        />

        <DataTable
          stripedRows
          value={newItems}
          paginator
          rows={50}
          // rowsPerPageOptions={[1, 2, 3]}
          totalRecords={3}
          filters={filters}
        >
          <Column field="id" header="ID" />

          <Column field="title" header="title" body={linkTitle} sortable />

          <Column field="director" header="director" sortable />
          <Column field="year" header="year" sortable />
          <Column
            field="rating"
            className={" text-center  " + "rating-"}
            header="rating"
            sortable
          />
          <Column field="watchTime" header="watchTime" sortable />
        </DataTable>
      </div>

      {/* {imdbPanel ? <p>{imdbInfo}</p> : null} */}
    </div>
  );
}

export default Table;
