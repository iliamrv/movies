import React from "react";
import supabase from "../src/supabase";
import { useRouter } from "next/router";
import { useState } from "react";
import StarRating from "../components/StarRating";
function Form() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [director, setDirector] = useState("");
  const [year, setYear] = useState("");

  const today = new Date();
  const date = today.setDate(today.getDate());
  const currentday = new Date(date).toISOString().split("T")[0]; // yyyy-mm-dd

  const [rating, setRating] = useState("");
  const [watchTime, setWatchTime] = useState(currentday);
  const [comment, setComment] = useState("");
  const [imdb, setImdb] = useState("");
  const [formError, setFormError] = useState(null);
  const [formSuccess, setFormSuccess] = useState(null);
  // const [userRating, setUserRating] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !title ||
      // !comment ||
      !director ||
      !year ||
      !watchTime ||
      // !rating ||
      !imdb
    ) {
      setFormError("Please fill in all the fields correctly.");
      return;
    }

    const { data, error } = await supabase
      .from("movies")
      .insert([{ title, director, year, watchTime, comment, rating, imdb }])
      .select();

    if (error) {
      console.log(error);
      setFormError("Please fill in all the fields correctly.");
    }
    if (data) {
      console.log(data);
      setFormError(null);
      setFormSuccess("The record is created");
      router.push("/");
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <label htmlFor="title">Title:</label>
      <input
        type="text"
        id="title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />

      <label htmlFor="director">Director:</label>
      <input
        type="text"
        id="director"
        value={director}
        onChange={(e) => setDirector(e.target.value)}
      />

      <label htmlFor="year">Year:</label>
      <input
        type="text"
        id="year"
        value={year}
        onChange={(e) => setYear(e.target.value)}
      />

      <div className="mb-5">
        <label htmlFor="rating">Rating:</label>
        <input
          type="number"
          id="rating"
          value={rating}
          onChange={(e) => setRating(e.target.value)}
        />

        <StarRating maxRating={10} onSetRating={setRating} />
      </div>

      <label htmlFor="watchtime">Watch time:</label>
      <input
        type="date"
        id="watchtime"
        value={watchTime}
        onChange={(e) => setWatchTime(e.target.value)}
      />

      <label htmlFor="comment">Comment:</label>
      <textarea
        id="comment"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
      />

      <label htmlFor="imdb">IMDb ID:</label>
      <input id="imdb" value={imdb} onChange={(e) => setImdb(e.target.value)} />

      <button className="bg-white hover:bg-gray-100 py-2 px-4 border border-gray-400 rounded shadow">
        Create Record
      </button>

      {formError && <p className="error">{formError}</p>}
      {formSuccess && (
        <div className="message">
          <p className="success">{formSuccess}</p>
        </div>
      )}
    </form>
  );
}

export default Form;
