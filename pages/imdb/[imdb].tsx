import { useRouter } from "next/router";
import React from "react";

import { useState, useEffect } from "react";
import supabase from "../../src/supabase";
import { data } from "autoprefixer";
import Image from "next/image";

// const db_name = `movies`;
const KEY = "8aab931f";

function Info() {
  var router = useRouter();
  var imdb = router.query["imdb"];

  const [title, setTitle] = useState("");
  const [director, setDirector] = useState("");
  const [year, setYear] = useState("");
  const [genre, setGenre] = useState("");

  const [rating, setRating] = useState("");
  const [watchTime, setWatchTime] = useState("");
  const [comment, setComment] = useState("");
  const [formError, setFormError] = useState(null);

  // const handleSubmit = async (e) => {
  //   e.preventDefault();

  //   if (
  //     !title ||
  //     // !comment ||
  //     !director ||
  //     !year ||
  //     !genre ||
  //     // !watchTime ||
  //     !rating
  //   ) {
  //     setFormError("Please fill in all the fields correctly.");
  //     return;
  //   }

  //   const { data: movies, error } = await supabase
  //     .from("movies")
  //     .update({
  //       title,
  //       comment,
  //       director,
  //       year,
  //       genre,
  //       watchTime,
  //       rating,
  //     })
  //     .eq("id", 1186);

  //   if (error) {
  //     setFormError("Please fill in all the fields correctly.");
  //   }
  //   if (data) {
  //     setFormError(null);
  //     router.push("/");
  //   }
  // };

  // const [error, setError] = useState("");
  const [movie, setMovie] = useState({});
  // const imdb = "tt0017765";

  useEffect(function () {
    async function getMovieDetails() {
      const res = await fetch(
        `http://www.omdbapi.com/?apikey=${KEY}&i=${imdb}`
      );

      const data = await res.json();

      setMovie(data);
      // console.log(data);
    }
    getMovieDetails();
  }, []);

  useEffect(function () {
    async function getLPitems() {
      const { data: movies, error } = await supabase

        .from("movies")
        .select()
        .eq("imdb", imdb)
        .single();

      setTitle(movies.title);
      setDirector(movies.director);
      setYear(movies.year);
      setGenre(movies.genre);
      setRating(movies.rating);
      setWatchTime(movies.watchTime);
      setComment(movies.comment);

      // console.log(movies.title);
    }

    getLPitems();
  }, []);

  console.log("imdb");

  return (
    <>
      <div className="prose lg:prose-xl mt-10 my-10 md:px-5">
        <h1>{title}</h1>

        <div className="flex items-center  gap-2">
          <div>
            <div>
              <Image
                src={movie.Poster}
                width={500}
                height={500}
                className="object-cover w-full rounded-t-lg h-96 md:h-auto md:w-48 md:rounded-none md:rounded-l-lg"
                alt="Picture of the author"
              />
            </div>
          </div>

          <div>
            <ul className="text-base">
              <li>
                <strong>Original title</strong>: {movie.Title}
              </li>
              <li>
                <strong>Director</strong>: {movie.Director} ({director})
              </li>
              <li>
                <strong>Year</strong>: {movie.Year}
              </li>
              <li>
                <strong>Genre</strong>: {movie.Genre}
              </li>

              <li>
                <strong>Runtime</strong>: {movie.Runtime}
              </li>

              <li>
                <strong>Watched date</strong>: {watchTime}
              </li>
              {/* <li>IMDB number: {imdb}</li> */}

              <li>
                <strong>My rating</strong>: {rating}
              </li>
            </ul>
          </div>
        </div>

        {comment ? (
          <p className="text-base description">
            <strong>Notes</strong>
            <br />
            {comment}
          </p>
        ) : null}

        <button
          className="bg-white text-base hover:bg-gray-100 py-2 px-4 border border-gray-400 rounded shadow "
          type="button"
          onClick={() => router.back()}
        >
          Click here to go back
        </button>
      </div>
    </>
  );
}

export default Info;
