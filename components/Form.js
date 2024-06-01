import React from "react";
import { StyledButtons } from "../styles/globalStyles";

import { CirclePlus, ArrowLeft } from 'lucide-react';


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

    // Remove imdb from the validation check
    if (!title || !director || !year) {
      setFormError("Please fill in all mandatory fields.");
      return;
    }

    const { data, error } = await supabase
      .from("movies_2024")
      .insert([{ title, director, year, watchTime, comment, rating, imdb }])
      .select();

    if (error) {
      setFormError("Please fill in all the fields correctly.");
    }
    if (data) {
      setFormError(null);
      setFormSuccess("The record is created");
      router.push("/");
    }
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <>
      <form className="mx-auto" onSubmit={handleSubmit}>
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
          <StarRating maxRating={10} onSetRating={setRating} ratingValue={rating} />
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
        <input
          id="imdb"
          value={imdb}
          onChange={(e) => setImdb(e.target.value)}
        />

        <StyledButtons>
          <button className="button">
            <CirclePlus size={16} style={{ marginRight: '8px' }} />
            Create Record
          </button>

          <button
            type="button" // Ensure this button doesn't submit the form
            onClick={handleBack}
            className="button">
            <ArrowLeft size={16} style={{ marginRight: '8px' }} />
            Go back
          </button>
        </StyledButtons>

        {formError && <p className="error">{formError}</p>}
        {formSuccess && (
          <div className="message">
            <p className="success">{formSuccess}</p>
          </div>
        )}
      </form>
    </>
  );
}

export default Form;
