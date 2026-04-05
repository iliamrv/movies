import { useState } from "react";

import Link from "next/link";
import { FilterMatchMode } from "primereact/api";
//theme
// import "primereact/resources/themes/lara-light-indigo/theme.css";
import styled from "styled-components";

//core
import "primereact/resources/primereact.min.css";

import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";


function Table({ newItems }) {
  const [searchValue, setSearchValue] = useState("");


  const [filters, setFilters] = useState({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    status: { value: null, matchMode: FilterMatchMode.EQUALS },
  });


  function resetFields() {
    setSearchValue("");
    setFilters((prev) => ({
      ...prev,
      global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    }));
  }


  const linkTitle = (newItems) => {
    return (
      <Link
        className=" no-underline dark:text-blue-500 hover:underline"
        href={"/movies/" + newItems.id}
      >
        {newItems.title}
      </Link>
    );
  };


  const viewsTemplate = (rowData) => {
    const count = Array.isArray(rowData.watch_dates) ? rowData.watch_dates.length : 0;

    return <span className="views-badge">{count}</span>;
  };

  const ratingTemplate = (newItems) => {

    return (

      <div className="rating">

        <span
          className={

            (newItems.rating ? ` rating-${newItems.rating}` : "rating-na")
          }
        >
          {newItems.rating ? newItems.rating : " "}
        </span></div>
    );
  };



  return (
    <div>





      <StyledSearch
        type="text"
        placeholder="Search in collection..."
        value={searchValue}
        onFocus={resetFields}
        onChange={(e) => {
          const value = e.target.value;
          setSearchValue(value);
          setFilters({
            global: {
              value,
              matchMode: FilterMatchMode.CONTAINS,
            },
          });
        }}
      />




      <StyledTable>

        <DataTable
          stripedRows
          value={newItems}
          filterDisplay="row"
          paginator
          paginatorTemplate="  PrevPageLink CurrentPageReport NextPageLink "
          rows={30}
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

            header="rating"
            sortable
          />
          {/* <Column header="Views" body={viewsTemplate} sortable /> */}
          <Column field="watchTime" header="watched" sortable />
          {/* <Column field="imdb" header="imdb" body={imdb} sortable /> */}
        </DataTable>
      </StyledTable>


    </div>
  );
}

export default Table;



export const StyledSearch = styled.input`
  width: 100%;
  max-width: 340px;
  height: 44px;
  padding: 0 14px;
  margin-bottom: 24px;
  border: 1px solid #d7dee8;
  border-radius: 12px;
  background: #ffffff;
  color: #111827;
  outline: none;
  transition: border-color 0.18s ease, box-shadow 0.18s ease;

  &::placeholder {
    color: #94a3b8;
  }

  &:focus {
    border-color: #b8c7dc;
    box-shadow: 0 0 0 4px rgba(191, 208, 229, 0.25);
  }
`;

export const StyledTable = styled.div`
  .table-card {
    background: #ffffff;
    border: 1px solid #e5e7eb;
    border-radius: 20px;
    padding: 22px;
    box-shadow: 0 10px 30px rgba(17, 24, 39, 0.05);
  }

  
  .table-top {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 18px;
    margin-bottom: 24px;
    flex-wrap: wrap;
  }

  .table-title {
    margin: 0 0 4px;
    font-size: 1.5rem;
    line-height: 1.1;
    color: #111827;
  }

  .table-subtitle {
    margin: 0;
    color: #6b7280;
    font-size: 0.95rem;
  }

  table {
    font-size: 0.95rem;
  }

  tbody tr {
    transition: background-color 0.18s ease;
  }

  tbody tr:hover {
    background: #fafbfc;
  }

  tbody tr:hover .rating span {
    transform: translateY(-1px);
  }

  tr.p-row-odd {
    background: #fcfcfd;
  }

  .p-datatable-wrapper {
    border: 1px solid #eef2f7;
    border-radius: 14px;
    overflow: hidden;
  }

  .p-datatable-table th {
    background: #f8fafc;
    color: #64748b;
    padding: 14px 12px;
    font-size: 0.84rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    border-bottom: 1px solid #e9eef5;
  }

  .p-datatable-table td {
    padding: 14px 12px;
    border-top: 1px solid #f3f4f6;
    color: #1f2937;
  }

  td:first-child {
    width: 35%;
  }

  td:nth-child(2) {
    width: 35%;
  }

  td:nth-child(3) {
    width: 10%;
  }

  td:nth-child(4) {
    width: 5%;
  }

  .p-paginator {
    background: transparent;
    border: 0;
    padding: 16px 0 0;
  }

  .p-paginator .p-paginator-page,
  .p-paginator .p-paginator-first,
  .p-paginator .p-paginator-prev,
  .p-paginator .p-paginator-next,
  .p-paginator .p-paginator-last {
    border-radius: 10px;
  }

  .p-paginator .p-paginator-pages .p-paginator-page.p-highlight {
    background: #eef4ff;
    color: #1d4ed8;
    font-weight: 700;
  }

  .rating {
    text-align: center;
  }

  .rating span {
    display: inline-block;
    min-width: 34px;
    padding: 4px 10px;
    border-radius: 999px;
    text-align: center;
    font-size: 0.85rem;
    font-weight: 700;
    color: #111827;
    transition: transform 0.18s ease, box-shadow 0.18s ease;
  }

  .rating-na {
    background: #f3f4f6;
    color: #6b7280;
  }

  .rating-2 {
    background-color: #fee2e2;
  }

  .rating-3 {
    background-color: #fecaca;
  }

  .rating-4 {
    background-color: #fbcaca;
  }

  .rating-5 {
    background-color: #e5f4ea;
  }

  .rating-6 {
    background-color: #d9efe2;
  }

  .rating-7 {
    background-color: #caead8;
  }

  .rating-8 {
    background-color: #bae3cd;
  }

  .rating-9 {
    background-color: #a8dcc1;
  }

  .rating-10 {
    background-color: #95d3b3;
  }

  .rating-8,
  .rating-9,
  .rating-10 {
    box-shadow: 0 0 0 2px rgba(34, 197, 94, 0.12);
  }

  .views-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 28px;
  padding: 4px 8px;
  border-radius: 999px;
  background: #eef4ff;
  color: #1d4ed8;
  font-size: 0.8rem;
  font-weight: 600;
}

`;