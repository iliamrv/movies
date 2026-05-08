import { useEffect, useState } from "react";
import styled from "styled-components";
import { RefreshCcw } from "lucide-react";

import MovieCard from "../components/MovieCard";
import Loading from "./loading";

import {
  getUnwatchedMovies,
  updateMoviePriority,
  deleteMovieById,
  markTowatchMoviesAsSeen,
  resetTowatchCycle,
} from "../src/api/movies";

import { fetchOmdbById, mergeMovieData } from "../src/api/omdb";

const PICKS_COUNT = 8;
const HIGH_PRIORITY_SLOTS = 2;

function getMovieWeight(movie) {
  if (movie.priority === "medium") return 3;
  if (movie.priority === "low") return 1;

  return 2;
}

function getWeightedRandomMovies(items, count) {
  const result = [];
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

function excludeAlreadyPicked(items, pickedMovies) {
  const pickedIds = new Set(pickedMovies.map((movie) => String(movie.id)));

  return items.filter((movie) => !pickedIds.has(String(movie.id)));
}

async function getCycleRandomMovies(items, count = PICKS_COUNT) {
  const highPriorityMovies = items.filter((movie) => movie.priority === "high");
  const cycleMovies = items.filter((movie) => movie.priority !== "high");

  const highPriorityCount = Math.min(
    HIGH_PRIORITY_SLOTS,
    highPriorityMovies.length,
    count
  );

  const highPriorityPicks = getWeightedRandomMovies(
    highPriorityMovies,
    highPriorityCount
  );

  const remainingCount = count - highPriorityPicks.length;

  let unseenCycleMovies = cycleMovies.filter(
    (movie) => !movie.towatch_cycle_seen_at
  );

  if (unseenCycleMovies.length < remainingCount && cycleMovies.length > 0) {
    const { error } = await resetTowatchCycle();

    if (error) {
      console.error("Failed to reset towatch cycle:", error);
    }

    unseenCycleMovies = cycleMovies.map((movie) => ({
      ...movie,
      towatch_cycle_seen_at: null,
    }));
  }

  const cyclePicks = getWeightedRandomMovies(
    unseenCycleMovies,
    Math.min(remainingCount, unseenCycleMovies.length)
  );

  let result = [...highPriorityPicks, ...cyclePicks];

  const missingCount = count - result.length;

  if (missingCount > 0 && highPriorityMovies.length > 0) {
    const extraHighPriorityMovies = excludeAlreadyPicked(
      highPriorityMovies,
      result
    );

    const extraHighPriorityPicks = getWeightedRandomMovies(
      extraHighPriorityMovies,
      missingCount
    );

    result = [...result, ...extraHighPriorityPicks];
  }

  const cyclePickIds = cyclePicks.map((movie) => movie.id);

  const { error } = await markTowatchMoviesAsSeen(cyclePickIds);

  if (error) {
    console.error("Failed to mark towatch movies as seen:", error);
  }

  return result;
}

export default function Page() {
  const [isLoading, setIsLoading] = useState(false);
  const [movies, setMovies] = useState([]);

  useEffect(() => {
    fetchMovies();
  }, []);

  async function fetchMovies() {
    setIsLoading(true);

    const { data, error } = await getUnwatchedMovies();

    if (error) {
      console.error("Failed to fetch unwatched movies:", error);
      setIsLoading(false);
      return;
    }

    if (!data) {
      setMovies([]);
      setIsLoading(false);
      return;
    }

    const selected = await getCycleRandomMovies(data, PICKS_COUNT);

    const enriched = await Promise.all(
      selected.map(async (movie) => {
        if (!movie.imdb) {
          return {
            ...movie,
            posterError: false,
          };
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
    setIsLoading(false);
  }

  function markPosterError(id) {
    setMovies((prev) =>
      prev.map((movie) =>
        String(movie.id) === String(id)
          ? { ...movie, posterError: true }
          : movie
      )
    );
  }

  async function handleUpdatePriority(id, priority) {
    const { error } = await updateMoviePriority(id, priority);

    if (error) {
      console.error("Failed to update movie priority:", error);
      return;
    }

    setMovies((prev) =>
      prev.map((movie) =>
        String(movie.id) === String(id) ? { ...movie, priority } : movie
      )
    );
  }

  async function handleRemoveMovie(id) {
    const { error } = await deleteMovieById(id);

    if (error) {
      console.error("Failed to remove movie:", error);
      return;
    }

    setMovies((prev) =>
      prev.filter((movie) => String(movie.id) !== String(id))
    );
  }

  function goToMovie(id) {
    window.location.href = `/movies/${id}`;
  }

  return (
    <PageWrap>
      <Header>
        <TitleWrap>
          <PageTitle>To Watch</PageTitle>
          <PageText>
            8 films from your watchlist. Priority films may repeat, others go
            through a full cycle.
          </PageText>
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

  &:hover {
    background: #1f2937;
  }
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 16px;
`;