import { useState } from "react";

import Link from "next/link";
import ImdbPanel from "./ImdbPanel";

import { Tag } from "primereact/tag";
import { Dropdown } from "primereact/dropdown";
//theme
// import "primereact/resources/themes/lara-light-indigo/theme.css";

//core
import "primereact/resources/primereact.min.css";

import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";

import { FilterMatchMode } from "primereact/api";
import { InputText } from "primereact/inputtext";

function Table({ newItems }) {
  const [imdbInfo, setImdbInfo] = useState("");
  const [imdbPanel, setImdbPanel] = useState(true);

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

  const imdb = (newItems) => {
    return (
      <>
        {newItems.imdb ? (
          <Link
            className=" no-underline dark:text-blue-500 hover:underline"
            href={"/imdb/" + newItems.imdb}
          >
            <span className="bg-blue-100 text-blue-800 text-xs font-medium mr-2 px-2.5 py-0.5 rounded-full dark:bg-blue-900 dark:text-blue-300">
              imdb
            </span>
          </Link>
        ) : null}
      </>
    );
  };

  const ratingTemplate = (newItems) => {
    return (
      <span
        className={
          "  mr-2 px-2.5 py-0.5  text-center  " +
          "rating rating-" +
          (newItems.rating ? newItems.rating : "na")
        }
      >
        {newItems.rating}
      </span>
    );
  };

  const [filters, setFilters] = useState({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    status: { value: null, matchMode: FilterMatchMode.EQUALS },
  });

  function resetFields(e) {
    setFilters("");
    e.target.value = "";
  }

  return (
    <div>
      <div>
        <InputText
          onClick={resetFields}
          className="shadow  rounded  text-gray-700 "
          placeholder="Search"
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
          filterDisplay="row"
          paginator
          paginatorTemplate="  PrevPageLink CurrentPageReport NextPageLink "
          rows={70}
          // rowsPerPageOptions={[1, 2, 3]}
          // totalRecords={3}
          filters={filters}
        >
          {/* <Column field="id" header="ID" /> */}

          <Column field="title" header="title" body={linkTitle} sortable />
          <Column field="director" header="director" sortable />
          <Column field="year" header="year" sortable />
          <Column
            field="rating"
            body={ratingTemplate}
            className={" text-center  " + "rating-"}
            header="rating"
            sortable
          />
          <Column field="watchTime" header="watched" sortable />
          <Column field="imdb" header="imdb" body={imdb} sortable />
        </DataTable>
      </div>

      {/* {imdbPanel ? <p>{imdbInfo}</p> : null} */}
    </div>
  );
}

export default Table;
