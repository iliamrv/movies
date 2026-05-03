import { useEffect, useState } from "react";
import MovieCard from "../components/MovieCard";
import styled from "styled-components";
import { RefreshCcw } from "lucide-react";

import Loading from "./loading";
import {
  getUnwatchedMovies,
  updateMoviePriority,
  deleteMovieById,
} from "../src/api/movies";
import { fetchOmdbById, mergeMovieData } from "../src/api/omdb";

type MovieItem = {
  id: number | string;
  title?: string;
  imdb?: string | null;
  director?: string | null;
  year?: number | string | null;
  watchTime?: string | null;
  comment?: string | null;
  priority?: "high" | "medium" | "low" | null;
  watched_mark?: boolean | null;

  Poster?: string;
  Director?: string;
  Genre?: string;
  Runtime?: string;
  Ratings?: Array<{ Source: string; Value: string }>;
  imdbRating?: string;

  posterError?: boolean;
  onPosterError?: () => void;
};

export default function Page() {
  const [isLoading, setIsLoading] = useState(false);
  const [movies, setMovies] = useState<MovieItem[]>([]);

  useEffect(() => {
    fetchMovies();
  }, []);

  function getMovieWeight(movie: MovieItem) {
    if (movie.priority === "high") return 6;
    if (movie.priority === "medium") return 3;
    if (movie.priority === "low") return 1;
    return 2;
  }

  function getWeightedRandomMovies(items: MovieItem[], count = 8) {
    const result: MovieItem[] = [];
    const pool = [...items];

    while (result.length < count && pool.length > 0) {
      const totalWeight = pool.reduce(
        (sum, item) => sum + getMovieWeight(item),
        0
      );

      let random = Math.random() * totalWeight;

      for (let i = 0; i < pool.length; i++) {
        random -= getMovieWeight(pool[i]);

        if (random <= 0) {
          result.push(pool[i]);
          pool.splice(i, 1);
          break;
        }
      }
    }

    return result;
  }

  const fetchMovies = async () => {
    setIsLoading(true);

    const { data, error } = await getUnwatchedMovies();

    if (!error && data) {
      const selected = getWeightedRandomMovies(data as MovieItem[], 8);

      const enriched = await Promise.all(
        selected.map(async (movie) => {
          if (!movie.imdb) {
            return { ...movie, posterError: false };
          }

          const imdbData = await fetchOmdbById(movie.imdb);
          const merged = mergeMovieData(movie, imdbData);

          return {
            ...merged,
            posterError: false,
          };
        })
      );

      setMovies(enriched);
    }

    setIsLoading(false);
  };

  function markPosterError(id: MovieItem["id"]) {
    setMovies((prev) =>
      prev.map((movie) =>
        movie.id === id ? { ...movie, posterError: true } : movie
      )
    );
  }

  async function handleUpdatePriority(
    id: MovieItem["id"],
    priority: "high" | "medium" | "low"
  ) {
    const { error } = await updateMoviePriority(id, priority);

    if (error) return;

    setMovies((prev) =>
      prev.map((m) => (m.id === id ? { ...m, priority } : m))
    );
  }

  async function handleRemoveMovie(id: MovieItem["id"]) {
    const { error } = await deleteMovieById(id);

    if (error) return;

    setMovies((prev) => prev.filter((m) => m.id !== id));
  }

 const goToMovie = (id: MovieItem["id"]) => {
  window.location.href = `/movies/${id}`;
};

  return (
    <PageWrap>
      <Header>
        <TitleWrap>
          <PageTitle>To Watch</PageTitle>
          <PageText>8 random unwatched films from your database</PageText>
        </TitleWrap>

        <Reload onClick={fetchMovies} type="button">
          <RefreshCcw size={16} />
          New picks
        </Reload>
      </Header>

      {isLoading ? (
        <Loading />
      ) : (
        <Grid>
          {movies.map((item) => (
          <MovieCard
  key={item.id}
  item={{
    ...item,
    onPosterError: () => markPosterError(item.id),
  }}
  onEdit={() => goToMovie(item.id)}
  onRemove={() => handleRemoveMovie(item.id)}
  onPriorityChange={(priority) =>
    handleUpdatePriority(item.id, priority)
  }
/>
          ))}
        </Grid>
      )}
    </PageWrap>
  );
}

const PageWrap = styled.div`
  padding: 20px;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 16px;

  @media (max-width: 700px) {
    flex-direction: column;
  }
`;

const TitleWrap = styled.div``;

const PageTitle = styled.h1`
  margin: 0;
`;

const PageText = styled.p`
  color: #6b7280;
  margin-top: 6px;
`;

const Reload = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #111827;
  color: white;
  padding: 8px 12px;
  border-radius: 10px;
  border: none;
  cursor: pointer;
  font-size: 14px;
  line-height: 1;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 16px;
`;