import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import styled from "styled-components";
import { fetchOmdbById, mergeMovieData } from "../../src/api/omdb";

import {
  Edit3,
  Trash2,
  ArrowLeft,
  Film,
  Database,
  Star,
  CheckCircle2,
  Sparkles,
} from "lucide-react";

import { StyledButtons, Button } from "../../styles/globalStyles";

import {
  getMovieById,
  deleteMovieById,
  updateMoviePriority,
  updateMovieRewatchMark,
  markMovieAsWatched,
  updateMovieById,
} from "../../src/api/movies";

import {
  getMoviePoster,
  getMovieTitle,
  getMovieOriginalTitle,
  getMovieDirector,
  getMovieGenres,
  getMovieDescription,
  getMovieRuntime,
  getMovieYear,
  getImdbRating,
  getRottenTomatoesRating,
  getMovieCast,
} from "../../src/utils/movieUtils";

export default function MovieDetails() {
  const router = useRouter();
  const { id } = router.query;

  const [movie, setMovie] = useState(null);

  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingTmdb, setIsFetchingTmdb] = useState(false);
  const [isUpdatingPriority, setIsUpdatingPriority] = useState(false);
  const [isUpdatingRewatch, setIsUpdatingRewatch] = useState(false);
  const [isMarkingWatched, setIsMarkingWatched] = useState(false);
  const [isImprovingComment, setIsImprovingComment] = useState(false);
  const [isSavingAiComment, setIsSavingAiComment] = useState(false);

  const [error, setError] = useState("");
  const [tmdbError, setTmdbError] = useState("");

  const [watchedForm, setWatchedForm] = useState({
    rating: "",
    watchTime: new Date().toISOString().slice(0, 10),
    comment: "",
  });


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

  async function handlePriorityChange(nextPriority) {
    if (!movie?.id) return;

    setIsUpdatingPriority(true);
    setError("");

    const { error } = await updateMoviePriority(movie.id, nextPriority);

    if (error) {
      console.error(error);
      setError("Failed to update priority");
      setIsUpdatingPriority(false);
      return;
    }

    setMovie((prev) => ({
      ...prev,
      priority: nextPriority,
    }));

    setIsUpdatingPriority(false);
  }

  async function handleToggleRewatch() {
    if (!movie?.id) return;

    const nextValue = !movie.rewatch_mark;

    setIsUpdatingRewatch(true);
    setError("");

    const { data, error } = await updateMovieRewatchMark(movie.id, nextValue);

    if (error) {
      console.error(error);
      setError("Failed to update rewatch mark");
      setIsUpdatingRewatch(false);
      return;
    }

    setMovie((prev) => ({
      ...prev,
      rewatch_mark: data?.rewatch_mark ?? nextValue,
    }));

    setIsUpdatingRewatch(false);
  }

  async function handleMarkAsWatched(event) {
    event.preventDefault();

    if (!movie?.id) return;

    const watchDate =
      watchedForm.watchTime || new Date().toISOString().slice(0, 10);

    const currentWatchDates = Array.isArray(movie.watch_dates)
      ? movie.watch_dates
      : [];

    const nextWatchDates = currentWatchDates.includes(watchDate)
      ? currentWatchDates
      : [...currentWatchDates, watchDate];

    const payload = {
      watchTime: watchDate,
      watch_dates: nextWatchDates,
    };

    if (watchedForm.rating !== "") {
      payload.rating = Number(watchedForm.rating);
    }

    if (watchedForm.comment.trim()) {
      payload.comment = watchedForm.comment.trim();
    }

    setIsMarkingWatched(true);
    setError("");

    const { data, error } = await markMovieAsWatched(movie.id, payload);

    if (error) {
      console.error(error);
      setError("Failed to mark movie as watched");
      setIsMarkingWatched(false);
      return;
    }

    setMovie((prev) => ({
      ...prev,
      ...data,
      watched_mark: true,
    }));

    setIsMarkingWatched(false);
  }

  async function handleImproveComment() {
    const trimmed = rawAiComment.trim();

    if (!trimmed || !movie?.id) return;

    setIsImprovingComment(true);
    setError("");

    try {
      const response = await fetch("/api/improve-movie-comment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          rawComment: trimmed,
          movie: {
            title: movie.title,
            director: movie.director,
            year: movie.year,
            rating: movie.rating,
            comment: movie.comment,
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to improve comment");
      }

      setAiCommentDraft(data.comment || trimmed);
      setAiTagsDraft(Array.isArray(data.tags) ? data.tags.slice(0, 3) : []);
    } catch (error) {
      console.error(error);
      setError("Failed to improve comment");
    } finally {
      setIsImprovingComment(false);
    }
  }

  async function handleSaveAiComment() {
    if (!movie?.id || !aiCommentDraft.trim()) return;

    const existingTags = Array.isArray(movie.tags) ? movie.tags : [];

    const cleanAiTags = aiTagsDraft
      .map((tag) => String(tag).trim().toLowerCase())
      .filter(Boolean);

    const nextTags = Array.from(new Set([...existingTags, ...cleanAiTags]));

    const payload = {
      comment: aiCommentDraft.trim(),
      tags: nextTags,
    };

    setIsSavingAiComment(true);
    setError("");

    const { data, error } = await updateMovieById(movie.id, payload);

    if (error) {
      console.error(error);
      setError("Failed to save AI comment");
      setIsSavingAiComment(false);
      return;
    }

    setMovie((prev) => ({
      ...prev,
      ...(data || {}),
      comment: payload.comment,
      tags: payload.tags,
    }));

    setRawAiComment("");
    setAiCommentDraft("");
    setAiTagsDraft([]);
    setIsSavingAiComment(false);
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

  const posterSrc = getMoviePoster(movie);
  const displayTitle = getMovieTitle(movie);
  const originalTitle = getMovieOriginalTitle(movie);
  const description = getMovieDescription(movie);
  const imdbRating = getImdbRating(movie);
  const rottenRating = getRottenTomatoesRating(movie);
  const cast = getMovieCast(movie, 5);
  const genres = getMovieGenres(movie).slice(0, 3);
  const runtime = getMovieRuntime(movie);
  const movieYear = getMovieYear(movie);

  const watchDates = Array.isArray(movie?.watch_dates) ? movie.watch_dates : [];
  const currentPriority = movie?.priority || "medium";
  const movieTags = Array.isArray(movie?.tags) ? movie.tags : [];

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
                {movieYear !== "—" ? ` (${movieYear})` : ""}
              </MovieTitle>

              {originalTitle && <OriginalTitle>{originalTitle}</OriginalTitle>}

              <MainMeta>
                <span>{getMovieDirector(movie)}</span>
                {runtime && <span>{runtime}</span>}
              </MainMeta>

              {genres.length > 0 && (
                <TagList>
                  {genres.map((genre) => (
                    <Tag key={genre}>{genre}</Tag>
                  ))}
                </TagList>
              )}

              <RatingsLine>
                {imdbRating && <RatingPill>IMDb {imdbRating}</RatingPill>}
                {rottenRating && <RatingPill>RT {rottenRating}</RatingPill>}
                {movie.rating !== null &&
                  movie.rating !== undefined &&
                  movie.rating !== "" && (
                    <RatingPill>My {movie.rating}/10</RatingPill>
                  )}
              </RatingsLine>

              {movieTags.length > 0 && (
                <MovieTagsBlock>
                  {movieTags.map((tag) => (
                    <MovieTag key={tag}>{tag}</MovieTag>
                  ))}
                </MovieTagsBlock>
              )}

              {movie.watched_mark === true && (
                <QuickActionPanel>
                  <QuickActionButton
                    type="button"
                    $active={movie.rewatch_mark}
                    onClick={handleToggleRewatch}
                    disabled={isUpdatingRewatch}
                  >
                    <Star size={16} />
                    {movie.rewatch_mark ? "In Rewatch list" : "Add to Rewatch"}
                  </QuickActionButton>
                </QuickActionPanel>
              )}

              {movie.watched_mark === false && (
                <PrioritySection>
                  <SectionLabel>To Watch Priority</SectionLabel>

                 <PriorityButtons>
  <PriorityButton
    type="button"
    $tone="high"
    $active={currentPriority === "high"}
    onClick={() => handlePriorityChange("high")}
    disabled={isUpdatingPriority}
  >
    <PriorityDot $tone="high" />
    High
  </PriorityButton>

  <PriorityButton
    type="button"
    $tone="medium"
    $active={currentPriority === "medium"}
    onClick={() => handlePriorityChange("medium")}
    disabled={isUpdatingPriority}
  >
    <PriorityDot $tone="medium" />
    Medium
  </PriorityButton>

  <PriorityButton
    type="button"
    $tone="low"
    $active={currentPriority === "low"}
    onClick={() => handlePriorityChange("low")}
    disabled={isUpdatingPriority}
  >
    <PriorityDot $tone="low" />
    Low
  </PriorityButton>
</PriorityButtons>

                  {isUpdatingPriority && (
                    <PriorityStatus>Saving priority...</PriorityStatus>
                  )}
                </PrioritySection>
              )}

              {movie.watched_mark === false && (
                <MarkWatchedBox onSubmit={handleMarkAsWatched}>
                  <SectionLabel>Mark as watched</SectionLabel>

                  <MarkWatchedGrid>
                    <FormField>
                      <FormLabel>Rating</FormLabel>
                      <SmallInput
                        type="number"
                        min="1"
                        max="10"
                        step="1"
                        value={watchedForm.rating}
                        onChange={(event) =>
                          setWatchedForm((prev) => ({
                            ...prev,
                            rating: event.target.value,
                          }))
                        }
                        placeholder="1–10"
                      />
                    </FormField>

                    <FormField>
                      <FormLabel>Watch date</FormLabel>
                      <SmallInput
                        type="date"
                        value={watchedForm.watchTime}
                        onChange={(event) =>
                          setWatchedForm((prev) => ({
                            ...prev,
                            watchTime: event.target.value,
                          }))
                        }
                      />
                    </FormField>
                  </MarkWatchedGrid>

                  <FormField>
                    <FormLabel>Comment</FormLabel>
                    <CommentTextarea
                      value={watchedForm.comment}
                      onChange={(event) =>
                        setWatchedForm((prev) => ({
                          ...prev,
                          comment: event.target.value,
                        }))
                      }
                      placeholder="Optional short note..."
                    />
                  </FormField>

                  <MarkWatchedButton type="submit" disabled={isMarkingWatched}>
                    <CheckCircle2 size={16} />
                    {isMarkingWatched ? "Saving..." : "Mark as watched"}
                  </MarkWatchedButton>
                </MarkWatchedBox>
              )}

              <DevActions>
                <Button
                  onClick={handleFetchTmdbMeta}
                  type="button"
                  disabled={isFetchingTmdb || !movie.imdb}
                >
                  <Database size={16} />
                  {isFetchingTmdb ? "Fetching..." : "Fetch TMDb"}
                </Button>

                {movie.external_meta?.sources?.tmdb?.fetchedAt && (
                  <FetchedText>
                    TMDb:{" "}
                    {new Date(
                      movie.external_meta.sources.tmdb.fetchedAt
                    ).toLocaleDateString()}
                  </FetchedText>
                )}

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
              <Button
                onClick={() => router.push(`/edit-movie/${id}`)}
                type="button"
              >
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

const MovieTagsBlock = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
  margin-top: 14px;
`;

const MovieTag = styled.span`
  display: inline-flex;
  padding: 5px 8px;
  border-radius: 999px;
  background: #eef2f7;
  color: #334155;
  font-size: 12px;
  font-weight: 700;
`;

const QuickActionPanel = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 16px;
`;

const QuickActionButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 7px;
  min-height: 38px;
  padding: 0 14px;
  border-radius: 999px;
  border: 1px solid ${({ $active }) => ($active ? "#111827" : "#d1d5db")};
  background: ${({ $active }) => ($active ? "#111827" : "#fff")};
  color: ${({ $active }) => ($active ? "#fff" : "#111827")};
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;

  &:hover {
    border-color: #111827;
    background: ${({ $active }) => ($active ? "#111827" : "#f9fafb")};
  }

  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }
`;

const PrioritySection = styled.div`
  margin-top: 18px;
  padding: 14px;
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  background: #fcfcfd;
`;

const SectionLabel = styled.div`
  margin-bottom: 10px;
  color: #64748b;
  font-size: 13px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
`;

const PriorityButtons = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
`;

const PriorityButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 7px;
  min-height: 36px;
  padding: 0 14px;
  border-radius: 999px;
  border: 1px solid
    ${({ $active, $tone }) => {
      if (!$active) return "#d1d5db";
      if ($tone === "high") return "#86efac";
      if ($tone === "medium") return "#fde68a";
      return "#d1d5db";
    }};
  background: ${({ $active, $tone }) => {
    if (!$active) return "#fff";
    if ($tone === "high") return "#ecfdf5";
    if ($tone === "medium") return "#fffbeb";
    return "#f9fafb";
  }};
  color: #111827;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;

  &:hover {
    border-color: ${({ $tone }) => {
      if ($tone === "high") return "#22c55e";
      if ($tone === "medium") return "#f59e0b";
      return "#9ca3af";
    }};
    background: ${({ $active, $tone }) => {
      if ($active && $tone === "high") return "#dcfce7";
      if ($active && $tone === "medium") return "#fef3c7";
      if ($active && $tone === "low") return "#f3f4f6";
      return "#f9fafb";
    }};
  }

  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }
`;

const PriorityDot = styled.span`
  width: 10px;
  height: 10px;
  border-radius: 999px;
  background: ${({ $tone }) => {
    if ($tone === "high") return "#22c55e";
    if ($tone === "medium") return "#f59e0b";
    return "#9ca3af";
  }};
  flex: 0 0 auto;
`;

const PriorityStatus = styled.div`
  margin-top: 8px;
  color: #6b7280;
  font-size: 13px;
`;

const MarkWatchedBox = styled.form`
  margin-top: 18px;
  padding: 14px;
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  background: #fcfcfd;
`;

const MarkWatchedGrid = styled.div`
  display: grid;
  grid-template-columns: 120px 180px;
  gap: 10px;
  margin-bottom: 10px;

  @media (max-width: 560px) {
    grid-template-columns: 1fr;
  }
`;

const FormField = styled.label`
  display: grid;
  gap: 6px;
  margin-bottom: 10px;
`;

const FormLabel = styled.span`
  color: #64748b;
  font-size: 13px;
  font-weight: 700;
`;

const SmallInput = styled.input`
  min-height: 38px;
  padding: 0 10px;
  border: 1px solid #d1d5db;
  border-radius: 10px;
  background: #fff;
  color: #111827;
  font-size: 14px;
  outline: none;

  &:focus {
    border-color: #111827;
  }
`;

const CommentTextarea = styled.textarea`
  min-height: 78px;
  padding: 10px;
  border: 1px solid #d1d5db;
  border-radius: 10px;
  background: #fff;
  color: #111827;
  font-size: 14px;
  line-height: 1.5;
  resize: vertical;
  outline: none;

  &:focus {
    border-color: #111827;
  }
`;

const MarkWatchedButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 7px;
  min-height: 38px;
  padding: 0 14px;
  border: 0;
  border-radius: 999px;
  background: #111827;
  color: #fff;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;

  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }
`;

const DevActions = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 18px;
  flex-wrap: wrap;
  opacity: 0.75;
`;

const FetchedText = styled.span`
  color: #6b7280;
  font-size: 0.9rem;
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

const SmartCommentBox = styled.div`
  padding: 14px;
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  background: #fcfcfd;
`;

const SmartTextarea = styled.textarea`
  width: 100%;
  min-height: 84px;
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 12px;
  background: #fff;
  color: #111827;
  font-size: 14px;
  line-height: 1.5;
  resize: vertical;
  outline: none;

  &:focus {
    border-color: #111827;
  }
`;

const SmartActions = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 10px;
`;

const SmartButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 7px;
  min-height: 38px;
  padding: 0 14px;
  border: 0;
  border-radius: 999px;
  background: #111827;
  color: #fff;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;

  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }
`;

const SecondarySmartButton = styled.button`
  min-height: 38px;
  padding: 0 14px;
  border: 1px solid #d1d5db;
  border-radius: 999px;
  background: #fff;
  color: #111827;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
`;

const AiDraftBox = styled.div`
  margin-top: 14px;
  padding: 12px;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  background: #f8fafc;
`;

const DraftLabel = styled.div`
  margin-top: ${({ $compact }) => ($compact ? "10px" : "0")};
  margin-bottom: 8px;
  color: #64748b;
  font-size: 13px;
  font-weight: 700;
`;

const DraftTags = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
  margin-top: 4px;
`;

const DraftTag = styled.span`
  display: inline-flex;
  padding: 5px 8px;
  border-radius: 999px;
  background: #111827;
  color: #fff;
  font-size: 12px;
  font-weight: 700;
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