import { useState } from "react";
import Link from "next/link";
import Filter from "./Filter";
import Sort from "./Sort";
import ImdbPanel from "./ImdbPanel";

function Table({ newItems, setIsActive, setOrderBy }) {
  const [ratingFilter, setRatingFilter] = useState("");
  const [search, setSearch] = useState("");
  const [isAct, setIsAct] = useState(false);
  const [imdbInfo, setImdbInfo] = useState("");
  const [imdbPanel, setImdbPanel] = useState(true);
  const [btnState, setBtnState] = useState(false);

  // function resetFields() {
  //   setRatingFilter("");
  //   setSearch("");
  // }

  // console.log(ratingFilter);

  const handleClick = (e) => {
    setIsActive((current) => !current);
    // console.log(btnState);

    setOrderBy(e.target.value);
    // setIsAct((current) => !current);
  };

  function handleInfo(imdbid) {
    if (imdbid) {
      setImdbInfo(imdbid);
      console.log(e.target.value);
    }

    // setImdbPanel(true);
  }

  return (
    <div>
      <Filter
        setBtnState={setBtnState}
        setSearch={setSearch}
        setRatingFilter={setRatingFilter}
      />

      <table className="table w-full text-base">
        <Sort
          handleClick={handleClick}
          btnState={btnState}
          setIsAct={setIsAct}
          isAct={isAct}
        />

        <tbody>
          {newItems
            .filter((item) => {
              return search.toLowerCase() === ""
                ? item
                : item.title.toLowerCase().includes(search);
            })

            .filter((item) => {
              return ratingFilter === "" ? item : item.rating == ratingFilter;
            })
            .map((fact) => (
              <tr key={fact.id}>
                <td>
                  <span className="bg-blue-100 mr-2 px-2.5  text-blue-800 text-xs  py-0.5 rounded-full dark:bg-blue-900 dark:text-blue-300">
                    {newItems.indexOf(fact) + 1}
                  </span>
                </td>
                <td>
                  {" "}
                  <Link
                    className=" no-underline dark:text-blue-500 hover:underline"
                    href={"/" + fact.id}
                  >
                    {fact.title}
                  </Link>
                  {/* <button onClick={() => handleInfo(fact.imdb)}>
                    <span className="imdbinfo bg-blue-100 mr-2 px-2.5  text-blue-800 text-xs mx-2  py-0.5 rounded-full dark:bg-blue-900 dark:text-blue-300 ">
                      i
                    </span>
                  </button> */}
                </td>

                <td className="  ">
                  {" "}
                  {(fact.director === null && "") || fact.director}
                </td>
                <td>{fact.year}</td>

                <td
                  className={
                    " text-center  " +
                    "rating-" +
                    (fact.rating ? fact.rating : "na")
                  }
                >
                  {(fact.rating === null && "") || fact.rating}
                </td>

                <td>{fact.watchTime}</td>
              </tr>
            ))}
        </tbody>
      </table>

      {imdbPanel ? <p>{imdbInfo}</p> : null}
    </div>
  );
}

export default Table;
