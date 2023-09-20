import { useRouter } from "next/router";
import React from "react";

import { useState, useEffect } from "react";
import supabase from "../../src/supabase";
// import { data } from "autoprefixer";
import Image from "next/image";

// const db_name = `movies`;
const KEY = "8aab931f";

function Info() {
  var router = useRouter();
  var imdb = router.query["imdb"];

  const [title, setTitle] = useState("");
  const [director, setDirector] = useState("");

  const [rating, setRating] = useState("");

  const [watchTime, setWatchTime] = useState("");
  const [comment, setComment] = useState("");

  const [poster, setPoster] = useState("");

  const [imdbTitle, setImdbTitle] = useState("");

  const [imdbYear, setImdbYear] = useState("");
  const [imdbGenre, setImdbGenre] = useState("");
  const [imdbRuntime, setImdbRuntime] = useState("");
  const [imdbDirector, setImdbDirector] = useState("");

  // const [formError, setFormError] = useState(null);

  // const [error, setError] = useState("");
  const [movie, setMovie] = useState({});
  // const imdb = "tt0017765";

  useEffect(function () {
    async function getMovieDetails() {
      const res = await fetch(
        `https://www.omdbapi.com/?apikey=${KEY}&i=${imdb}`
      );

      const data = await res.json();

      setMovie(data);
      setPoster(data.Poster);
      setImdbTitle(data.Title);
      setImdbYear(data.Year);
      setImdbGenre(data.Genre);
      setImdbRuntime(data.Runtime);
      setImdbDirector(data.Director);
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

      setRating(movies.rating);
      setWatchTime(movies.watchTime);
      setComment(movies.comment);
    }

    getLPitems();
  }, []);

  return (
    <>
      <div className="prose lg:prose-xl mt-10 my-10 md:px-5">
        <h1>{title}</h1>

        <div className="flex items-center  gap-2">
          <div>
            <div>
              <Image
                src={poster}
                width={500}
                height={500}
                className="object-cover w-full rounded-t-lg h-96 md:h-auto md:w-48 md:rounded-none md:rounded-l-lg"
                alt="Movie pic"
              />
            </div>
          </div>

          <div>
            <ul className="text-base">
              <li>
                <strong>Original title</strong>: {imdbTitle}
              </li>
              <li>
                <strong>Director</strong>: {imdbDirector} ({director})
              </li>
              <li>
                <strong>Year</strong>: {imdbYear}
              </li>
              <li>
                <strong>Genre</strong>: {imdbGenre}
              </li>

              <li>
                <strong>Runtime</strong>: {imdbRuntime}
              </li>

              <li>
                <strong>Watched date</strong>: {watchTime}
              </li>

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
