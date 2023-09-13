function Filter({ setSearch, setRatingFilter }) {
  return (
    <div className="filter flex ">
      <div>
        <input
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search movie title"
          className="shadow  rounded  text-gray-700 
              "
          id="username"
          type="text"
        />
      </div>

      <div>
        <label className=" mx-5">
          <b>Rating</b>
        </label>
        <select
          onChange={(e) => setRatingFilter(e.target.value)}
          className="shadow  rounded  text-gray-700"
          id="number-dd"
          name="rating-filter"
        >
          <option value=""></option>
          <option value="3">3</option>
          <option value="4">4</option>
          <option value="5">5</option>
          <option value="6">6</option>
          <option value="7">7</option>
          <option value="8">8</option>
          <option value="9">9</option>
          <option value="10">10</option>
        </select>
      </div>
      {/* 
      <div>
        <button
          className=" hover:bg-gray-100 py-1 px-1 border border-gray-400 rounded shadow"
          onClick={resetFields}
        >
          Reset
        </button>
      </div> */}
    </div>
  );
}

export default Filter;
