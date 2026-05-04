import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import styled from "styled-components";
import { fetchOmdbById, mergeMovieData } from "../../src/api/omdb";

import { Edit3, Trash2, ArrowLeft, Film, Database } from "lucide-react";
import { StyledButtons, Button } from "../../styles/globalStyles";
import { getMovieById, deleteMovieById } from "../../src/api/movies";

export default function MovieDetails() {
  const router = useRouter();
  const { id } = router.query;

  const [movie, setMovie] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingTmdb, setIsFetchingTmdb] = useState(false);
  const [error, setError] = useState("");
  const [tmdbError, setTmdbError] = useState("");

  useEffect(() => {
    if (!id) return;
    fetchMovie(id);
  }, [id]);

  async function fetchMovie(movieId) {
    setIsLoading(true);
    setError("");
    setTmdbError("");

    try {
      const { data, error } = await getMovieById(movieId);
      if (error) throw error;

      let finalMovie = data;

      if (data?.imdb) {
        const imdbData = await fetchOmdbById(data.imdb);
        finalMovie = mergeMovieData(data, imdbData);
      }

      setMovie(finalMovie);
    } catch (err) {
      setError("Failed to fetch movie details: " + err.message);
    }

    setIsLoading(false);
  }

  async function handleFetchTmdbMeta() {
    if (!movie?.id) return;

    setIsFetchingTmdb(true);
    setTmdbError("");

    try {
      const response = await fetch("/api/fetch-tmdb-meta", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          movieId: movie.id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch TMDb meta");
      }

      setMovie((prev) => ({
        ...prev,
        external_meta: data.external_meta,
      }));
    } catch (error) {
      console.error("Fetch TMDb meta error:", error);
      setTmdbError(error.message || "Failed to fetch TMDb meta");
    } finally {
      setIsFetchingTmdb(false);
    }
  }

  async function handleDelete(e) {
    e.preventDefault();

    const { error } = await deleteMovieById(id);

    if (error) {
      setError("Delete failed");
    } else {
      router.push("/");
    }
  }

  const tmdbMeta = movie?.external_meta?.tmdb;

  function getPosterSrc() {
    return movie?.external_meta?.tmdb?.posterUrl || movie?.Poster || "";
  }

  function getDisplayTitle() {
    return tmdbMeta?.titles?.ru || movie?.title || "";
  }

  function getOriginalTitle() {
    const original =
      tmdbMeta?.titles?.original ||
      tmdbMeta?.titles?.en ||
      movie?.title ||
      "";

    const display = getDisplayTitle();

    if (!original || original === display) return "";
    return original;
  }

  function getDirector() {
    if (Array.isArray(tmdbMeta?.directors) && tmdbMeta.directors.length > 0) {
      return tmdbMeta.directors
        .map((director) => director.name)
        .filter(Boolean)
        .join(", ");
    }

    return movie?.director || movie?.Director || "—";
  }

  function getGenres() {
    if (Array.isArray(tmdbMeta?.genres) && tmdbMeta.genres.length > 0) {
      return tmdbMeta.genres.join(", ");
    }

    return movie?.Genre || "—";
  }

  function getDescription() {
    return (
      tmdbMeta?.overview?.ru ||
      tmdbMeta?.overview?.en ||
      (movie?.Plot !== "N/A" ? movie?.Plot : "") ||
      ""
    );
  }

  function getImdbRating() {
    if (!movie?.imdbRating || movie.imdbRating === "N/A") return "";
    return movie.imdbRating;
  }

  function getRottenRating() {
    if (!Array.isArray(movie?.Ratings)) return "";

    const rating = movie.Ratings.find(
      (item) => item.Source === "Rotten Tomatoes"
    );

    return rating?.Value || "";
  }

  function getRuntime() {
    if (tmdbMeta?.runtime) return `${tmdbMeta.runtime} min`;
    if (movie?.Runtime && movie.Runtime !== "N/A") return movie.Runtime;
    return "";
  }

  function getReleaseDate() {
    return tmdbMeta?.releaseDate || movie?.Released || "";
  }

  const posterSrc = getPosterSrc();
  const displayTitle = getDisplayTitle();
  const originalTitle = getOriginalTitle();
  const description = getDescription();
  const imdbRating = getImdbRating();
  const rottenRating = getRottenRating();

  const cast = Array.isArray(tmdbMeta?.cast) ? tmdbMeta.cast.slice(0, 5) : [];

  const watchDates = Array.isArray(movie?.watch_dates) ? movie.watch_dates : [];

  return (
    <PageWrap>
      {isLoading ? (
        <StateText>Loading...</StateText>
      ) : movie ? (
        <ContentCard>
          <TopSection>
            <PosterColumn>
              {posterSrc ? (
                <PosterFrame>
                  <PosterImage
                    src={posterSrc}
                    alt={displayTitle || "Movie poster"}
                  />
                </PosterFrame>
              ) : (
                <PosterPlaceholder>
                  <Film size={34} />
                  <span>No poster</span>
                </PosterPlaceholder>
              )}
            </PosterColumn>

            <InfoColumn>
              <MovieTitle>
                {displayTitle}
                {movie.year ? ` (${movie.year})` : ""}
              </MovieTitle>

              {originalTitle && <OriginalTitle>{originalTitle}</OriginalTitle>}

              <MainMeta>
                <span>{getDirector()}</span>
                {getReleaseDate() && <span>{getReleaseDate()}</span>}
                {getRuntime() && <span>{getRuntime()}</span>}
              </MainMeta>

              <TagList>
                {getGenres()
                  .split(",")
                  .map((genre) => genre.trim())
                  .filter(Boolean)
                  .slice(0, 3)
                  .map((genre) => (
                    <Tag key={genre}>{genre}</Tag>
                  ))}
              </TagList>

              <RatingsLine>
                {imdbRating && <RatingPill>IMDb {imdbRating}</RatingPill>}
                {rottenRating && <RatingPill>RT {rottenRating}</RatingPill>}
                {movie.rating !== null &&
                  movie.rating !== undefined &&
                  movie.rating !== "" && (
                    <RatingPill>My {movie.rating}/10</RatingPill>
                  )}
              </RatingsLine>

              <DevActions>
                <Button
                  onClick={handleFetchTmdbMeta}
                  type="button"
                  disabled={isFetchingTmdb || !movie.imdb}
                >
                  <Database size={16} />
                  {isFetchingTmdb ? "Fetching..." : "Fetch TMDb"}
                </Button>

                {tmdbError && <TmdbErrorText>{tmdbError}</TmdbErrorText>}
              </DevActions>
            </InfoColumn>
          </TopSection>

          {description && (
            <Section>
              <SectionTitle>Description</SectionTitle>
              <DescriptionBox>{description}</DescriptionBox>
            </Section>
          )}

          {cast.length > 0 && (
            <Section>
              <SectionTitle>Cast</SectionTitle>
              <TagList>
                {cast.map((person) => (
                  <Tag key={person.id || person.name}>
                    {person.name}
                    {person.character ? ` — ${person.character}` : ""}
                  </Tag>
                ))}
              </TagList>
            </Section>
          )}

          {watchDates.length > 0 && (
            <Section>
              <SectionTitle>Watch history ({watchDates.length})</SectionTitle>
              <HistoryList>
                {[...watchDates]
                  .sort((a, b) => (a < b ? 1 : -1))
                  .map((date, index) => (
                    <li key={index}>{date}</li>
                  ))}
              </HistoryList>
            </Section>
          )}

          <Section>
            <SectionTitle>Comment</SectionTitle>
            {movie.comment ? (
              <CommentBox>{movie.comment}</CommentBox>
            ) : (
              <MutedText>No comment</MutedText>
            )}
          </Section>

          <Section>
            <StyledButtons>
              <Button onClick={() => router.push(`/edit-movie/${id}`)} type="button">
                <Edit3 size={16} /> Edit
              </Button>

              <Button onClick={handleDelete} type="button">
                <Trash2 size={16} /> Delete
              </Button>

              <Button type="button" onClick={() => router.back()}>
                <ArrowLeft size={16} /> Go Back
              </Button>
            </StyledButtons>
          </Section>
        </ContentCard>
      ) : (
        <StateText>Movie not found.</StateText>
      )}

      {error && <ErrorText>Error: {error}</ErrorText>}
    </PageWrap>
  );
}

const PageWrap = styled.div`
  padding: 28px;
`;

const ContentCard = styled.div`
  max-width: 980px;
  margin: 0 auto;
  padding: 22px;
  border: 1px solid #e5e7eb;
  border-radius: 18px;
  background: #fff;
  box-shadow: 0 10px 30px rgba(17, 24, 39, 0.05);
`;

const TopSection = styled.div`
  display: grid;
  grid-template-columns: 280px minmax(0, 1fr);
  gap: 24px;
  align-items: start;

  @media (max-width: 760px) {
    grid-template-columns: 1fr;
  }
`;

const PosterColumn = styled.div``;

const PosterFrame = styled.div`
  width: 100%;
  aspect-ratio: 2 / 3;
  overflow: hidden;
  border-radius: 14px;
  background: #f3f4f6;
`;

const PosterImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
  display: block;
`;

const PosterPlaceholder = styled.div`
  width: 100%;
  aspect-ratio: 2 / 3;
  border-radius: 14px;
  background: #f3f4f6;
  color: #9ca3af;
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: center;
  justify-content: center;
`;

const InfoColumn = styled.div``;

const MovieTitle = styled.h1`
  margin: 0;
  line-height: 1.15;
  color: #111827;
  font-size: clamp(1.9rem, 3vw, 2.6rem);
  word-break: break-word;
`;

const OriginalTitle = styled.div`
  margin-top: 6px;
  color: #6b7280;
  font-size: 1rem;
`;

const MainMeta = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px 14px;
  margin-top: 14px;
  color: #4b5563;
  font-size: 0.95rem;

  span:not(:last-child)::after {
    content: "•";
    margin-left: 14px;
    color: #9ca3af;
  }
`;

const RatingsLine = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 14px;
`;

const RatingPill = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 6px 10px;
  border-radius: 999px;
  background: #111827;
  color: #fff;
  font-size: 0.85rem;
  font-weight: 600;
`;

const DevActions = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 18px;
  flex-wrap: wrap;
  opacity: 0.75;
`;

const TmdbErrorText = styled.div`
  color: #b91c1c;
  font-size: 0.9rem;
`;

const Section = styled.div`
  margin-top: 24px;
`;

const SectionTitle = styled.h2`
  margin: 0 0 10px;
  font-size: 1.05rem;
  color: #111827;
`;

const DescriptionBox = styled.div`
  padding: 16px 18px;
  border: 1px solid #eef2f7;
  border-radius: 14px;
  background: #fcfcfd;
  color: #374151;
  line-height: 1.65;
  font-size: 0.98rem;
  white-space: pre-wrap;
  word-break: break-word;
`;

const CommentBox = styled.div`
  padding: 14px 16px;
  border: 1px solid #eef2f7;
  border-radius: 12px;
  background: #fcfcfd;
  color: #374151;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
`;

const TagList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
`;

const Tag = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 6px 9px;
  border-radius: 999px;
  background: #f3f4f6;
  color: #374151;
  font-size: 0.86rem;
  line-height: 1.25;
`;

const HistoryList = styled.ul`
  margin: 0;
  padding-left: 18px;

  li {
    margin-bottom: 6px;
    color: #374151;
  }
`;

const MutedText = styled.p`
  margin: 0;
  color: #6b7280;
`;

const StateText = styled.p`
  color: #6b7280;
`;

const ErrorText = styled.p`
  margin-top: 14px;
  color: #b91c1c;
`;