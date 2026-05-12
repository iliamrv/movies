import { useEffect, useMemo, useState } from "react";
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

type Priority = "high" | "medium" | "low";

type MovieItem = {
  id: string | number;
  title?: string | null;
  Title?: string | null;
  director?: string | null;
  year?: string | number | null;
  imdb?: string | null;
  imdbID?: string | null;
  priority?: Priority | null;
  watched_mark?: boolean | null;
  towatch_cycle_seen_at?: string | null;
  external_meta?: any;
  Genre?: string | null;
  genre?: string | null;
  Poster?: string | null;
  poster?: string | null;
  poster_url?: string | null;
  posterError?: boolean;
  onPosterError?: () => void;
};

function getMovieWeight(movie: MovieItem) {
  if (movie.priority === "medium") return 3;
  if (movie.priority === "low") return 1;

  return 2;
}

function getWeightedRandomMovies(items: MovieItem[], count: number) {
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

function excludeAlreadyPicked(items: MovieItem[], pickedMovies: MovieItem[]) {
  const pickedIds = new Set(pickedMovies.map((movie) => String(movie.id)));

  return items.filter((movie) => !pickedIds.has(String(movie.id)));
}

function normalizeGenre(value: string | null | undefined) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function getMovieGenres(item: MovieItem): string[] {
  const tmdbGenres = item?.external_meta?.tmdb?.genres;

  if (Array.isArray(tmdbGenres) && tmdbGenres.length > 0) {
    return tmdbGenres.map(String).filter(Boolean);
  }

  if (item?.Genre) {
    return item.Genre.split(",")
      .map((genre) => genre.trim())
      .filter(Boolean);
  }

  if (item?.genre) {
    return String(item.genre)
      .split(",")
      .map((genre) => genre.trim())
      .filter(Boolean);
  }

  return [];
}

function getGenreLabel(genre: string) {
  const map: Record<string, string> = {
    drama: "Drama",
    comedy: "Comedy",
    crime: "Crime",
    thriller: "Thriller",
    documentary: "Documentary",
    action: "Action",
    adventure: "Adventure",
    romance: "Romance",
    mystery: "Mystery",
    horror: "Horror",
    fantasy: "Fantasy",
    "science fiction": "Sci-Fi",
    sci_fi: "Sci-Fi",

    драма: "Драма",
    комедия: "Комедия",
    криминал: "Криминал",
    триллер: "Триллер",
    документальный: "Документальный",
    боевик: "Боевик",
    приключения: "Приключения",
    мелодрама: "Мелодрама",
    детектив: "Детектив",
    ужасы: "Ужасы",
    фантастика: "Фантастика",
    фэнтези: "Фэнтези",
  };

  return map[normalizeGenre(genre)] || genre;
}

async function getCycleRandomMovies(items: MovieItem[], count = PICKS_COUNT) {
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
const [genreFilter, setGenreFilter] = useState("all");
const [totalTowatchCount, setTotalTowatchCount] = useState(0);

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
      setGenreFilter("all");
      setIsLoading(false);
      return;
    }
setTotalTowatchCount(data.length);
    const selected = await getCycleRandomMovies(data as MovieItem[], PICKS_COUNT);

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

    setMovies(enriched as MovieItem[]);
    setGenreFilter("all");
    setIsLoading(false);
  }

  function markPosterError(id: MovieItem["id"]) {
    setMovies((prev) =>
      prev.map((movie) =>
        String(movie.id) === String(id)
          ? { ...movie, posterError: true }
          : movie
      )
    );
  }

  async function handleUpdatePriority(id: MovieItem["id"], priority: Priority) {
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

  async function handleRemoveMovie(id: MovieItem["id"]) {
    const { error } = await deleteMovieById(id);

    if (error) {
      console.error("Failed to remove movie:", error);
      return;
    }

    setMovies((prev) =>
      prev.filter((movie) => String(movie.id) !== String(id))
    );
  }

  function goToMovie(id: MovieItem["id"]) {
    window.location.href = `/movies/${id}`;
  }

  const availableGenres = useMemo<string[]>((() => {
    const genres = new Set<string>();

    movies.forEach((movie) => {
      getMovieGenres(movie).forEach((genre) => {
        genres.add(String(genre));
      });
    });

    return Array.from(genres).sort((a, b) =>
      getGenreLabel(a).localeCompare(getGenreLabel(b))
    );
  }) as () => string[], [movies]);

  const filteredMovies = useMemo(() => {
    if (genreFilter === "all") {
      return movies;
    }

    return movies.filter((movie) =>
      getMovieGenres(movie).some(
        (genre) => normalizeGenre(genre) === normalizeGenre(genreFilter)
      )
    );
  }, [movies, genreFilter]);

  return (
    <PageWrap>
      <Header>
        <TitleWrap>
          <PageTitle>To Watch</PageTitle>
   <PageText>
  {movies.length || PICKS_COUNT} films shown · {totalTowatchCount} movies in
  your watchlist. 
</PageText>
        </TitleWrap>

        <Reload onClick={fetchMovies} type="button" disabled={isLoading}>
          <RefreshCcw size={16} />
          {isLoading ? "Loading..." : "New picks"}
        </Reload>
      </Header>

      {isLoading ? (
        <Loading />
      ) : (
        <>
          <GenreFilterBar>
            <GenreFilterLabel>Genres</GenreFilterLabel>

            <GenreChips>
              <GenreChip
                type="button"
                $active={genreFilter === "all"}
                onClick={() => setGenreFilter("all")}
              >
                All
              </GenreChip>

              {availableGenres.map((genre) => (
                <GenreChip
                  key={genre}
                  type="button"
                  $active={normalizeGenre(genreFilter) === normalizeGenre(genre)}
                  onClick={() => setGenreFilter(genre)}
                >
                  {getGenreLabel(genre)}
                </GenreChip>
              ))}
            </GenreChips>
          </GenreFilterBar>

          <Grid>
            {filteredMovies.map((item) => (
              <MovieCard
                key={item.id}
                item={{
                  ...item,
                  onPosterError: () => markPosterError(item.id),
                }}
                onEdit={() => goToMovie(item.id)}
                onRemove={() => handleRemoveMovie(item.id)}
                onPriorityChange={(priority: Priority) =>
                  handleUpdatePriority(item.id, priority)
                }
              />
            ))}
          </Grid>

          {filteredMovies.length === 0 && (
            <EmptyState>No movies for this genre in current picks.</EmptyState>
          )}
        </>
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

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const GenreFilterBar = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 10px;
  margin-bottom: 14px;
  flex-wrap: wrap;
`;

const GenreFilterLabel = styled.div`
  color: #64748b;
  font-size: 13px;
  font-weight: 700;
  padding-top: 7px;
  min-width: 54px;
`;

const GenreChips = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
`;

const GenreChip = styled.button<{ $active: boolean }>`
  padding: 7px 10px;
  border: 1px solid ${({ $active }) => ($active ? "#111827" : "#e5e7eb")};
  border-radius: 999px;
  background: ${({ $active }) => ($active ? "#111827" : "#fff")};
  color: ${({ $active }) => ($active ? "#fff" : "#475569")};
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;

  &:hover {
    border-color: #111827;
  }
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 16px;
`;

const EmptyState = styled.div`
  margin-top: 18px;
  padding: 18px;
  border: 1px dashed #d7dee8;
  border-radius: 14px;
  background: #fff;
  color: #64748b;
  text-align: center;
  font-size: 14px;
`;