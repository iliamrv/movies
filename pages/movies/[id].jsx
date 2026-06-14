import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import styled from "styled-components";
import { fetchOmdbById, mergeMovieData } from "../../src/api/omdb";
import {
  Edit3,
  Trash2,
  ArrowLeft,
  Film,
  Star,
  CheckCircle2,
  Clock3,
  CalendarDays,
  Ticket,
} from "lucide-react";

import {
  getMovieById,
  deleteMovieById,
  updateMoviePriority,
  updateMovieRewatchMark,
  markMovieAsWatched,
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
  getLatestWatchDate,
} from "../../src/utils/movieUtils";

export default function MovieDetails() {
  const router = useRouter();
  const { id } = router.query;

  const [movie, setMovie] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdatingPriority, setIsUpdatingPriority] = useState(false);
  const [isUpdatingRewatch, setIsUpdatingRewatch] = useState(false);
  const [isMarkingWatched, setIsMarkingWatched] = useState(false);
  const [error, setError] = useState("");
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

    try {
      const { data, error: fetchError } = await getMovieById(movieId);

      if (fetchError) throw fetchError;

      setMovie(data);
      setIsLoading(false);

      if (data?.imdb) {
        const imdbData = await fetchOmdbById(data.imdb);

        if (imdbData) {
          setMovie((prev) => {
            if (!prev) return prev;
            return mergeMovieData(prev, imdbData);
          });
        }
      }
    } catch (err) {
      setError("Failed to fetch movie details: " + err.message);
      setIsLoading(false);
    }
  }

  async function handlePriorityChange(nextPriority) {
    if (!movie?.id) return;

    setIsUpdatingPriority(true);
    setError("");

    const { error: updateError } = await updateMoviePriority(
      movie.id,
      nextPriority
    );

    if (updateError) {
      console.error(updateError);
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

    const { data, error: updateError } = await updateMovieRewatchMark(
      movie.id,
      nextValue
    );

    if (updateError) {
      console.error(updateError);
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

    const { data, error: updateError } = await markMovieAsWatched(
      movie.id,
      payload
    );

    if (updateError) {
      console.error(updateError);
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

  async function handleDelete(event) {
    event.preventDefault();

    const { error: deleteError } = await deleteMovieById(id);

    if (deleteError) {
      setError("Delete failed");
    } else {
      router.push("/");
    }
  }

  const posterSrc = getMoviePoster(movie);
  const displayTitle = getMovieTitle(movie);
  const originalTitle = getMovieOriginalTitle(movie);
  const director = getMovieDirector(movie);
  const description = getMovieDescription(movie);
  const imdbRating = getImdbRating(movie);
  const rottenRating = getRottenTomatoesRating(movie);
  const cast = getMovieCast(movie, 6);
  const genres = getMovieGenres(movie).slice(0, 3);
  const runtime = getMovieRuntime(movie);
  const movieYear = getMovieYear(movie);

  const watchDates = Array.isArray(movie?.watch_dates) ? movie.watch_dates : [];
  const sortedWatchDates = [...watchDates].sort((a, b) => (a < b ? 1 : -1));
  const latestWatchDate = getLatestWatchDate(movie);
  const currentPriority = movie?.priority || "medium";
  const movieTags = Array.isArray(movie?.tags) ? movie.tags : [];
  const hasPersonalRating =
    movie?.rating !== null && movie?.rating !== undefined && movie?.rating !== "";
  const heroBackdrop = posterSrc
    ? `linear-gradient(135deg, rgba(248, 250, 252, 0.94), rgba(255, 255, 255, 0.98)), url(${posterSrc})`
    : "linear-gradient(135deg, rgba(248, 250, 252, 0.96), rgba(255, 255, 255, 0.99))";

  return (
    <PageWrap>
      {isLoading ? (
        <StateText>Loading...</StateText>
      ) : movie ? (
        <ContentCard>
          <HeroSection $backdrop={heroBackdrop}>
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

            <HeroBody>
              <HeroHeader>
                <TitleCluster>
                  <MovieTitle>
                    {displayTitle}
                    {movieYear !== "-" ? ` (${movieYear})` : ""}
                  </MovieTitle>

                  {originalTitle && (
                    <OriginalTitle>{originalTitle}</OriginalTitle>
                  )}

                  <MainMeta>
                    <span>{director}</span>
                    {runtime && <span>{runtime}</span>}
                  </MainMeta>
                </TitleCluster>

                <PrimaryActionRow>
                  <PrimaryActionButton
                    onClick={() => router.push(`/edit-movie/${id}`)}
                    type="button"
                  >
                    <Edit3 size={16} />
                    Edit
                  </PrimaryActionButton>

                  {movie.watched_mark === true && (
                    <QuickActionButton
                      type="button"
                      $active={movie.rewatch_mark}
                      onClick={handleToggleRewatch}
                      disabled={isUpdatingRewatch}
                    >
                      <Star size={16} />
                      {movie.rewatch_mark
                        ? "In Rewatch list"
                        : "Add to Rewatch"}
                    </QuickActionButton>
                  )}
                </PrimaryActionRow>
              </HeroHeader>

              <HighlightGrid>
                <HighlightCard $tone="dark">
                  <HighlightLabel>My rating</HighlightLabel>
                  <HighlightValue>
                    {hasPersonalRating ? `${movie.rating}/10` : "Not rated"}
                  </HighlightValue>
                </HighlightCard>

                <HighlightCard>
                  <HighlightLabel>Latest watch</HighlightLabel>
                  <HighlightValue>{latestWatchDate || "No date"}</HighlightValue>
                </HighlightCard>

                <HighlightCard>
                  <HighlightLabel>Watch history</HighlightLabel>
                  <HighlightValue>
                    {sortedWatchDates.length > 0
                      ? `${sortedWatchDates.length} ${
                          sortedWatchDates.length === 1 ? "entry" : "entries"
                        }`
                      : "—"}
                  </HighlightValue>
                </HighlightCard>
              </HighlightGrid>

              {genres.length > 0 && (
                <TagList $compact>
                  {genres.map((genre) => (
                    <Tag key={genre}>{genre}</Tag>
                  ))}
                </TagList>
              )}

              <RatingsLine>
                {imdbRating && <RatingPill>IMDb {imdbRating}</RatingPill>}
                {rottenRating && <RatingPill>RT {rottenRating}</RatingPill>}
                {hasPersonalRating && <RatingPill>My {movie.rating}/10</RatingPill>}
              </RatingsLine>

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
                        placeholder="1-10"
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

            </HeroBody>
          </HeroSection>

          <ContentGrid>
            <MainColumn>
              <SectionCard>
                <SectionTitle>Your note</SectionTitle>
                {movie.comment ? (
                  <CommentBox>{movie.comment}</CommentBox>
                ) : (
                  <EmptyCardText>No personal note yet.</EmptyCardText>
                )}
              </SectionCard>

              {description && (
                <SectionCard>
                  <SectionTitle>Description</SectionTitle>
                  <DescriptionBox>{description}</DescriptionBox>
                </SectionCard>
              )}

              {cast.length > 0 && (
                <SectionCard>
                  <SectionTitle>Cast</SectionTitle>
                  <CastGrid>
                    {cast.map((person) => (
                      <CastItem key={person.id || person.name}>
                        <CastName>{person.name}</CastName>
                        {person.character && (
                          <CastRole>{person.character}</CastRole>
                        )}
                      </CastItem>
                    ))}
                  </CastGrid>
                </SectionCard>
              )}
            </MainColumn>

            <SideColumn>
              <SidebarCard>
                <SidebarTitle>In your library</SidebarTitle>
                <SidebarFacts>
                  <SidebarFact>
                    <FactIconWrap>
                      <CalendarDays size={15} />
                    </FactIconWrap>
                    <FactTextWrap>
                      <FactLabel>Latest watch</FactLabel>
                      <FactValue>{latestWatchDate || "No date yet"}</FactValue>
                    </FactTextWrap>
                  </SidebarFact>

                  {sortedWatchDates.length > 0 && (
                    <SidebarFact>
                      <FactIconWrap>
                        <Clock3 size={15} />
                      </FactIconWrap>
                      <FactTextWrap>
                        <FactLabel>History entries</FactLabel>
                        <FactValue>{sortedWatchDates.length}</FactValue>
                      </FactTextWrap>
                    </SidebarFact>
                  )}

                  <SidebarFact>
                    <FactIconWrap>
                      <Ticket size={15} />
                    </FactIconWrap>
                    <FactTextWrap>
                      <FactLabel>Status</FactLabel>
                      <FactValue>
                        {movie.watched_mark ? "Watched" : "To watch"}
                      </FactValue>
                    </FactTextWrap>
                  </SidebarFact>
                </SidebarFacts>
              </SidebarCard>

              {sortedWatchDates.length > 0 && (
                <SidebarCard>
                  <SidebarTitle>Watch history</SidebarTitle>
                  <HistoryTimeline>
                    {sortedWatchDates.map((date) => (
                      <HistoryItem key={date}>
                        <HistoryDot />
                        <HistoryDate>{date}</HistoryDate>
                      </HistoryItem>
                    ))}
                  </HistoryTimeline>
                </SidebarCard>
              )}

              {movieTags.length > 0 && (
                <SidebarCard>
                  <SidebarTitle>Tags</SidebarTitle>
                  <MovieTagsBlock>
                    {movieTags.map((tag) => (
                      <MovieTag key={tag}>{tag}</MovieTag>
                    ))}
                  </MovieTagsBlock>
                </SidebarCard>
              )}
            </SideColumn>
          </ContentGrid>

          <BottomActionBar>
            <GhostActionButton type="button" onClick={() => router.back()}>
              <ArrowLeft size={16} />
              Go Back
            </GhostActionButton>

            <DangerActionButton onClick={handleDelete} type="button">
              <Trash2 size={16} />
              Delete
            </DangerActionButton>
          </BottomActionBar>
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
  max-width: 1120px;
  margin: 0 auto;
  padding: 22px;
  border: 1px solid #e5e7eb;
  border-radius: 26px;
  background:
    radial-gradient(circle at top left, rgba(226, 232, 240, 0.25), transparent 30%),
    #fff;
  box-shadow: 0 18px 45px rgba(15, 23, 42, 0.08);
`;

const HeroSection = styled.section`
  display: grid;
  grid-template-columns: 280px minmax(0, 1fr);
  gap: 28px;
  align-items: start;
  padding: 22px;
  border-radius: 22px;
  background: ${({ $backdrop }) => $backdrop};
  background-size: cover;
  background-position: center;
  border: 1px solid rgba(226, 232, 240, 0.95);

  @media (max-width: 760px) {
    grid-template-columns: 1fr;
    padding: 18px;
  }
`;

const PosterColumn = styled.div``;

const PosterFrame = styled.div`
  width: 100%;
  aspect-ratio: 2 / 3;
  overflow: hidden;
  border-radius: 18px;
  background: #f3f4f6;
  box-shadow: 0 20px 45px rgba(15, 23, 42, 0.22);
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
  border-radius: 18px;
  background: #f3f4f6;
  color: #9ca3af;
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: center;
  justify-content: center;
`;

const HeroBody = styled.div`
  display: grid;
  gap: 18px;
  min-width: 0;
`;

const HeroHeader = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 18px;
  align-items: start;

  @media (max-width: 880px) {
    flex-direction: column;
  }
`;

const TitleCluster = styled.div`
  min-width: 0;
`;

const MovieTitle = styled.h1`
  margin: 0;
  line-height: 1.1;
  color: #111827;
  font-size: clamp(2.2rem, 4vw, 3.5rem);
  word-break: break-word;
  letter-spacing: -0.03em;
`;

const OriginalTitle = styled.div`
  margin-top: 10px;
  color: #475569;
  font-size: 1.05rem;
`;

const MainMeta = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px 14px;
  margin-top: 14px;
  color: #334155;
  font-size: 0.96rem;
  font-weight: 500;

  span:not(:last-child)::after {
    content: "•";
    margin-left: 14px;
    color: #9ca3af;
  }
`;

const PrimaryActionRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
`;

const PrimaryActionButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 42px;
  padding: 0 16px;
  border: 0;
  border-radius: 999px;
  background: #111827;
  color: #fff;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;

  &:hover {
    background: #0f172a;
  }
`;

const HighlightGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;

  @media (max-width: 760px) {
    grid-template-columns: 1fr;
  }
`;

const HighlightCard = styled.div`
  padding: 16px;
  border-radius: 18px;
  border: 1px solid
    ${({ $tone }) => ($tone === "dark" ? "rgba(15, 23, 42, 0.9)" : "#e2e8f0")};
  background: ${({ $tone }) =>
    $tone === "dark" ? "#111827" : "rgba(255, 255, 255, 0.9)"};
  color: ${({ $tone }) => ($tone === "dark" ? "#f8fafc" : "#0f172a")};
  backdrop-filter: blur(6px);
`;

const HighlightLabel = styled.div`
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  opacity: 0.7;
`;

const HighlightValue = styled.div`
  margin-top: 8px;
  font-size: 1.05rem;
  font-weight: 700;
  line-height: 1.35;
`;

const TagList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: ${({ $compact }) => ($compact ? "0" : "12px")};
`;

const Tag = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 6px 9px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.8);
  color: #374151;
  font-size: 0.86rem;
  line-height: 1.25;
  border: 1px solid #e5e7eb;
`;

const RatingsLine = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
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

const QuickActionButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 7px;
  min-height: 42px;
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
  padding: 14px;
  border: 1px solid #e5e7eb;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.82);
  backdrop-filter: blur(6px);
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
  padding: 14px;
  border: 1px solid #e5e7eb;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.82);
  backdrop-filter: blur(6px);
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

const ContentGrid = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1.5fr) minmax(280px, 0.9fr);
  gap: 22px;
  margin-top: 22px;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`;

const MainColumn = styled.div`
  display: grid;
  gap: 18px;
`;

const SideColumn = styled.div`
  display: grid;
  gap: 18px;
  align-content: start;
`;

const SectionCard = styled.section`
  padding: 18px;
  border: 1px solid #e8edf3;
  border-radius: 20px;
  background: linear-gradient(180deg, #fff, #fbfdff);
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.04);
`;

const SidebarCard = styled.aside`
  padding: 18px;
  border: 1px solid #e8edf3;
  border-radius: 20px;
  background: linear-gradient(180deg, #fff, #fbfdff);
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.04);
`;

const SectionTitle = styled.h2`
  margin: 0 0 10px;
  font-size: 1.02rem;
  color: #111827;
`;

const SidebarTitle = styled.h3`
  margin: 0 0 14px;
  font-size: 0.98rem;
  color: #0f172a;
`;

const DescriptionBox = styled.div`
  padding: 16px 18px;
  border: 1px solid #eef2f7;
  border-radius: 16px;
  background: #fcfcfd;
  color: #374151;
  line-height: 1.65;
  font-size: 0.98rem;
  white-space: pre-wrap;
  word-break: break-word;
`;

const CommentBox = styled.div`
  padding: 16px 18px;
  border: 1px solid #eef2f7;
  border-radius: 16px;
  background: #fcfcfd;
  color: #374151;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
`;

const CastGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;

  @media (max-width: 700px) {
    grid-template-columns: 1fr;
  }
`;

const CastItem = styled.div`
  padding: 12px 14px;
  border-radius: 14px;
  background: #f8fafc;
  border: 1px solid #eef2f7;
`;

const CastName = styled.div`
  color: #111827;
  font-weight: 700;
`;

const CastRole = styled.div`
  margin-top: 4px;
  color: #64748b;
  font-size: 0.92rem;
`;

const SidebarFacts = styled.div`
  display: grid;
  gap: 12px;
`;

const SidebarFact = styled.div`
  display: grid;
  grid-template-columns: 36px 1fr;
  gap: 10px;
  align-items: start;
`;

const FactIconWrap = styled.div`
  width: 36px;
  height: 36px;
  border-radius: 12px;
  background: #eef2ff;
  color: #1e293b;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const FactTextWrap = styled.div``;

const FactLabel = styled.div`
  color: #64748b;
  font-size: 0.82rem;
`;

const FactValue = styled.div`
  margin-top: 2px;
  color: #0f172a;
  font-weight: 700;
`;

const HistoryTimeline = styled.div`
  display: grid;
  gap: 12px;
`;

const HistoryItem = styled.div`
  display: grid;
  grid-template-columns: 10px 1fr;
  gap: 10px;
  align-items: center;
`;

const HistoryDot = styled.span`
  width: 10px;
  height: 10px;
  border-radius: 999px;
  background: #111827;
  box-shadow: 0 0 0 4px #e2e8f0;
`;

const HistoryDate = styled.div`
  color: #334155;
  font-weight: 600;
`;

const EmptyCardText = styled.p`
  margin: 0;
  color: #64748b;
  line-height: 1.6;
`;

const BottomActionBar = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-top: 22px;
  flex-wrap: wrap;
`;

const GhostActionButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 42px;
  padding: 0 16px;
  border: 1px solid #d1d5db;
  border-radius: 999px;
  background: #fff;
  color: #111827;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
`;

const DangerActionButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 42px;
  padding: 0 16px;
  border: 1px solid #fecaca;
  border-radius: 999px;
  background: #fff5f5;
  color: #b91c1c;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
`;

const StateText = styled.p`
  color: #6b7280;
`;

const ErrorText = styled.p`
  margin-top: 14px;
  color: #b91c1c;
`;
