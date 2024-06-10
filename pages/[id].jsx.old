import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import supabase from "../src/supabase";
import StarRating from "../components/StarRating";
// import Form from "../components/Form";
import { Edit3, Trash2, ArrowLeft } from 'lucide-react';

import { StyledButtons } from "../styles/globalStyles"



const db_name = `movies`;

const Update = () => {
  const router = useRouter();
  const { id } = router.query;
  // const [userRating, setUserRating] = useState("");
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

  const handleDelete = async (e) => {
    e.preventDefault();

    const { data, error } = await supabase.from("movies_2024").delete().eq("id", id);

    if (error) {
      // console.log(error);
      setFormError("Error");
    } else {
      // setFormError(null);
      router.push("/");
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();

    if (
      !title ||
      // !comment ||
      !director ||
      !year ||
      !watchTime
      // !imdb
      // !rating
    ) {
      setFormError("Please fill in all the fields correctly.");
    } else {
      setFormSuccess("Updated");
    }

    const { data, error } = await supabase
      .from("movies_2024")
      .update([{ title, director, year, watchTime, comment, rating, imdb }])
      .eq("id", id);

    if (error) {
      // console.log(error);
      setFormError("Please fill in all the fields correctly.");
    }
    if (data) {
      // console.log(data);
      setFormError(null);
      router.push("/");
    }
  };

  useEffect(() => {
    const fetchMovies = async () => {
      const { data: movies, error } = await supabase
        .from("movies_2024")
        .select()
        .eq("id", id)
        .single();

      if (error) {
        // router.push("/");
      }
    if (movies) {
      setTitle(movies.title || "");
      setDirector(movies.director || "");
      setYear(movies.year || "");
      setRating(movies.rating || "");
      setWatchTime(movies.watchTime || currentday);  // Ensure this also defaults to `currentday` if null
      setComment(movies.comment || "");  // Default to an empty string if null
      setImdb(movies.imdb || "");
    }
    };

    fetchMovies();
  }, [id]);

  const handleBack = () => {
    router.back();
  };


  return (
    <>
      <h1 className="text-center">
        Update <span className="highlight">{title}</span>
      </h1>

      {/* <Form /> */}

      <form className="mx-auto">
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
        <StarRating maxRating={10} rating={rating} onSetRating={setRating} />
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
          <button type="button" onClick={handleUpdate} className="button">
            <Edit3 size={16} style={{ marginRight: '8px' }} /> Update
          </button>

          <button type="button" onClick={handleDelete} className="button">
            <Trash2 size={16} style={{ marginRight: '8px' }} /> Delete
          </button>

          <button type="button" onClick={handleBack} className="button">
            <ArrowLeft size={16} style={{ marginRight: '8px' }} /> Go Back
          </button>
        </StyledButtons>




        {formError && (
          <div className="message">
            <p className="error">{formError}</p>
          </div>
        )}
        {formSuccess && (
          <div className="message">
            <p className="success">{formSuccess}</p>
          </div>
        )}
      </form>
    </>
  );
};

export default Update;


