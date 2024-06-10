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

  const [filters, setFilters] = useState({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    status: { value: null, matchMode: FilterMatchMode.EQUALS },
  });


  function resetFields(e) {
    setFilters("");
    e.target.value = "";
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
        onClick={resetFields}
        className="search shadow  rounded  text-gray-700 w-1/2 mt-10"
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
          <Column field="watchTime" header="watched" sortable />
          {/* <Column field="imdb" header="imdb" body={imdb} sortable /> */}
        </DataTable>
      </StyledTable>


    </div>
  );
}

export default Table;



export const StyledSearch = styled.input`
    border-radius: 0.25rem; /* This is equivalent to 'rounded' in Tailwind which is usually 4px */

    /* text-gray-700: Set the text color to Tailwind's gray-700 */

    width: 50%;
  

    /* mt-10: Set the top margin */
    margin-top: 2.5rem; /* Tailwind's spacing scale for mt-10 is 40px, which is roughly 2.5rem */

  display: block;
 
  padding: 10px;

  border: 1px solid #ccc;
  margin: 10px 0 20px 0;


`


export const StyledTable = styled.div`


table {
 
 
  font-size: 0.9rem;
}




tbody tr:hover {
background: #f3f3f3;

}






.p-paginator .p-paginator-first,
.p-paginator .p-paginator-prev,
.p-paginator .p-paginator-next,
.p-paginator .p-paginator-last {
  background-color: transparent;
  border: 0 none;
  color: #6c757d;
  min-width: 2.5rem;
  height: 2.5rem;
  margin: 0.143rem;
  transition: box-shadow 0.2s;
  border-radius: 10%;
}
.p-paginator .p-paginator-first:not(.p-disabled):not(.p-highlight):hover,
.p-paginator .p-paginator-prev:not(.p-disabled):not(.p-highlight):hover,
.p-paginator .p-paginator-next:not(.p-disabled):not(.p-highlight):hover,
.p-paginator .p-paginator-last:not(.p-disabled):not(.p-highlight):hover {
  background: #e9ecef;
  border-color: transparent;
  color: #343a40;
}
.p-paginator .p-paginator-first {
  border-top-left-radius: 50%;
  border-bottom-left-radius: 50%;
}
.p-paginator .p-paginator-last {
  border-top-right-radius: 50%;
  border-bottom-right-radius: 50%;
}
.p-paginator .p-dropdown {
  margin-left: 0.5rem;
  height: 2.5rem;
}
.p-paginator .p-dropdown .p-dropdown-label {
  padding-right: 0;
}
.p-paginator .p-paginator-page-input {
  margin-left: 0.5rem;
  margin-right: 0.5rem;
}

.p-paginator .p-paginator-current {
  background-color: transparent;
  border: 0 none;
  color: #6c757d;
  min-width: 2.5rem;
  height: 2.5rem;
  margin: 0.143rem;
  padding: 0 0.5rem;
}
.p-paginator .p-paginator-pages .p-paginator-page {
  background-color: transparent;
  border: 0 none;
  color: #6c757d;
  min-width: 2.5rem;
  height: 2.5rem;
  margin: 0.143rem;
  transition: box-shadow 0.2s;

  border-radius: 10%;
}
.p-paginator .p-paginator-pages .p-paginator-page.p-highlight {
  background: #f3f4f6;
  border-color: #eef2ff;
  font-weight: bold;
}
.p-paginator .p-paginator-pages .p-paginator-page:not(.p-highlight):hover {
  background: #e9ecef;
  border-color: transparent;
  color: #343a40;
}

.p-datatable-table th {
  background-color: rgba(238, 238, 238, 0.566);
  padding: 10px;
}

.p-datatable-table td {
  padding: 8px;
}

tr.p-row-odd {
  background: #f3f4f6;
}



  td:first-child { width: 35%; }
  td:nth-child(2) { width: 35%; }
  td:nth-child(3) { width: 10%; }
  td:nth-child(4) { width: 5%; }






@layer primereact {
 
 
  .p-datatable .p-datatable-tbody > tr > td {
   
    border-top: 1px solid #ccc;
   
  }
  
  


.rating {
  text-align: center;
}
  

.rating span {
  transition: box-shadow 0.2s;
  color: #fff;
  border-radius: 15%;
  padding: 3px  7px;
  text-align: center;
  
}

.rating-na {
  color: rgba(31, 41, 55, 0.8);
}

.rating-2 {
  background-color: #fee2e2;
}

.rating-3 {
  background-color: #ffb1b1;
}

.rating-4 {
  background-color: #ffb1b1;
}

.rating-5 {
  background-color: #cfecde;
}

.rating-6 {
  background-color: #b7e2cd;
}

.rating-7 {
  background-color: #9fd9bd;
}

.rating-8 {
  background-color: #87cfac;
}

.rating-9 {
  background-color: #6fc59b;
}

.rating-10 {
  background-color: #57bb8a;
}

  
`;
