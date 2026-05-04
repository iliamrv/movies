import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Image from "next/image";
import styled from "styled-components";
import { fetchOmdbById, mergeMovieData } from "../../src/api/omdb";

import { Edit3, Trash2, ArrowLeft, Film, Database } from "lucide-react";
import { StyledButtons, Button } from "../../styles/globalStyles";
import { getMovieById, deleteMovieById } from "../../src/api/movies";


export default function MovieDetails() {
  const router = useRouter();
  const { id } = router.query;

  const [movie, setMovie] = useState(null);
  const [posterFailed, setPosterFailed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingTmdb, setIsFetchingTmdb] = useState(false);
  const [error, setError] = useState("");
  const [tmdbError, setTmdbError] = useState("");

  const handleEdit = () => {
    router.push(`/edit-movie/${id}`);
  };

  const handleDelete = async (e) => {
    e.preventDefault();

    const { error } = await deleteMovieById(id);

    if (error) {
      setError("Delete failed");
    } else {
      router.push("/");
    }
  };

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

      setPosterFailed(false);
    } catch (error) {
      console.error("Fetch TMDb meta error:", error);
      setTmdbError(error.message || "Failed to fetch TMDb meta");
    } finally {
      setIsFetchingTmdb(false);
    }
  }

  const displayRatings = (ratings) => {
    if (!ratings) return null;

    return ratings.map((rating, index) => (
      <RatingItem key={index}>
        <span>{rating.Source}</span>
        <strong>{rating.Value}</strong>
      </RatingItem>
    ));
  };

  useEffect(() => {
    if (!id) return;
    fetchMovie(id);
  }, [id]);

const fetchMovie = async (movieId) => {
  setIsLoading(true);
  setError("");
  setTmdbError("");
  setPosterFailed(false);

  try {
    const { data, error } = await getMovieById(movieId);

    if (error) throw error;

    let finalMovie = data;

    // OMDb нужен только для внешних рейтингов: IMDb, Rotten Tomatoes, Metacritic
    if (data?.imdb) {
      const imdbData = await fetchOmdbById(data.imdb);
      finalMovie = mergeMovieData(data, imdbData);
    }

    setMovie(finalMovie);
  } catch (err) {
    setError("Failed to fetch movie details: " + err.message);
  }

  setIsLoading(false);
};

  function isValidPosterUrl(value) {
    if (!value || value === "N/A") return false;
    return /^https?:\/\//i.test(String(value));
  }

function getPosterSrc() {
  const tmdbPoster = movie?.external_meta?.tmdb?.posterUrl;
  const omdbPoster = movie?.Poster;

  if (!posterFailed && isValidPosterUrl(tmdbPoster)) {
    return tmdbPoster;
  }

  if (!posterFailed && isValidPosterUrl(omdbPoster)) {
    return omdbPoster;
  }

  return "";
}

  const watchDates = Array.isArray(movie?.watch_dates)
    ? movie.watch_dates
    : [];

  const sortedWatchDates = [...watchDates].sort((a, b) =>
    a < b ? 1 : -1
  );

  const tmdbMeta = movie?.external_meta?.tmdb;
  const posterSrc = getPosterSrc();


  return (
    <PageWrap>
      {isLoading ? (
        <StateText>Loading...</StateText>
      ) : movie ? (
        <ContentCard>
          <TitleBlock>
            <MovieTitle>
              {movie.title}
              {movie.year ? ` (${movie.year})` : ""}
            </MovieTitle>
          </TitleBlock>

          <TopSection>
            <PosterColumn>
              {posterSrc ? (
                <PosterFrame>
                  <Image
                    src={posterSrc}
                    alt={movie.title || "Movie poster"}
                    fill
                    sizes="(max-width: 768px) 100vw, 280px"
                    style={{ objectFit: "cover" }}
                    onError={() => setPosterFailed(true)}
                    unoptimized
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
              <MetaGrid>
                <MetaCard>
                  <MetaLabel>Director</MetaLabel>
                  <MetaValue>{movie.director || "—"}</MetaValue>
                </MetaCard>

            

        


                <MetaCard>
                  <MetaLabel>Genre</MetaLabel>
                  <MetaValue>
                    {movie.Genre ||
                      (Array.isArray(tmdbMeta?.genres)
                        ? tmdbMeta.genres.join(", ")
                        : "") ||
                      "—"}
                  </MetaValue>
                </MetaCard>

                <MetaCard>
                  <MetaLabel>Watch Time</MetaLabel>
                  <MetaValue>{movie.watchTime || "n/a"}</MetaValue>
                </MetaCard>

            <MetaCard>
  <MetaLabel>My  Rating</MetaLabel>
  <MetaValue>
    {movie.rating !== null && movie.rating !== undefined && movie.rating !== ""
      ? `${movie.rating}/10`
      : "—"}
  </MetaValue>
</MetaCard>
              </MetaGrid>

           

              <TmdbActions>
                <Button
                  onClick={handleFetchTmdbMeta}
                  type="button"
                  disabled={isFetchingTmdb || !movie.imdb}
                  title={
                    !movie.imdb
                      ? "Movie has no IMDb ID"
                      : "Fetch TMDb metadata"
                  }
                >
                  <Database size={16} />
                  {isFetchingTmdb ? "Fetching TMDb..." : "Fetch TMDb meta"}
                </Button>

                {movie.external_meta?.sources?.tmdb?.fetchedAt && (
                  <FetchedText>
                    TMDb fetched:{" "}
                    {new Date(
                      movie.external_meta.sources.tmdb.fetchedAt
                    ).toLocaleDateString()}
                  </FetchedText>
                )}
              </TmdbActions>

              {tmdbError && <TmdbErrorText>{tmdbError}</TmdbErrorText>}
            </InfoColumn>
          </TopSection>

          {movie.Plot && movie.Plot !== "N/A" && (
            <Section>
              <SectionTitle>Description</SectionTitle>
              <DescriptionBox>{movie.Plot}</DescriptionBox>
            </Section>
          )}

          {tmdbMeta && (
            <Section>
              <SectionTitle>TMDb Meta</SectionTitle>

              <TmdbGrid>
                <MetaCard>
                  <MetaLabel>RU title</MetaLabel>
                  <MetaValue>{tmdbMeta.titles?.ru || "—"}</MetaValue>
                </MetaCard>

                <MetaCard>
                  <MetaLabel>EN title</MetaLabel>
                  <MetaValue>{tmdbMeta.titles?.en || "—"}</MetaValue>
                </MetaCard>

                <MetaCard>
                  <MetaLabel>Original title</MetaLabel>
                  <MetaValue>{tmdbMeta.titles?.original || "—"}</MetaValue>
                </MetaCard>

                <MetaCard>
                  <MetaLabel>TMDb ID</MetaLabel>
                  <MetaValue>{tmdbMeta.id || "—"}</MetaValue>
                </MetaCard>

                <MetaCard>
                  <MetaLabel>Release date</MetaLabel>
                  <MetaValue>{tmdbMeta.releaseDate || "—"}</MetaValue>
                </MetaCard>

                <MetaCard>
                  <MetaLabel>Runtime</MetaLabel>
                  <MetaValue>
                    {tmdbMeta.runtime ? `${tmdbMeta.runtime} min` : "—"}
                  </MetaValue>
                </MetaCard>
              </TmdbGrid>

              {tmdbMeta.posterUrl && (
                <TmdbSubsection>
                  <SmallTitle>TMDb poster</SmallTitle>
                  <SmallText>{tmdbMeta.posterUrl}</SmallText>
                </TmdbSubsection>
              )}

              {tmdbMeta.overview?.ru && (
                <TmdbSubsection>
                  <SmallTitle>Russian overview</SmallTitle>
                  <DescriptionBox>{tmdbMeta.overview.ru}</DescriptionBox>
                </TmdbSubsection>
              )}

              {Array.isArray(tmdbMeta.genres) && tmdbMeta.genres.length > 0 && (
                <TmdbSubsection>
                  <SmallTitle>Genres</SmallTitle>
                  <TagList>
                    {tmdbMeta.genres.map((genre) => (
                      <Tag key={genre}>{genre}</Tag>
                    ))}
                  </TagList>
                </TmdbSubsection>
              )}

              {Array.isArray(tmdbMeta.directors) &&
                tmdbMeta.directors.length > 0 && (
                  <TmdbSubsection>
                    <SmallTitle>Directors</SmallTitle>
                    <TagList>
                      {tmdbMeta.directors.map((director) => (
                        <Tag key={director.id || director.name}>
                          {director.name}
                        </Tag>
                      ))}
                    </TagList>
                  </TmdbSubsection>
                )}

              {Array.isArray(tmdbMeta.cast) && tmdbMeta.cast.length > 0 && (
                <TmdbSubsection>
                  <SmallTitle>Cast</SmallTitle>
                  <TagList>
                    {tmdbMeta.cast.map((person) => (
                      <Tag key={person.id || person.name}>
                        {person.name}
                        {person.character ? ` — ${person.character}` : ""}
                      </Tag>
                    ))}
                  </TagList>
                </TmdbSubsection>
              )}

              {Array.isArray(tmdbMeta.ruAlternativeTitles) &&
                tmdbMeta.ruAlternativeTitles.length > 0 && (
                  <TmdbSubsection>
                    <SmallTitle>RU alternative titles</SmallTitle>
                    <TagList>
                      {tmdbMeta.ruAlternativeTitles.map((title) => (
                        <Tag key={title}>{title}</Tag>
                      ))}
                    </TagList>
                  </TmdbSubsection>
                )}
            </Section>
          )}

          <Section>
            <SectionTitle>Ratings</SectionTitle>
            {movie.Ratings ? (
              <RatingsList>{displayRatings(movie.Ratings)}</RatingsList>
            ) : (
              <MutedText>No ratings available.</MutedText>
            )}
          </Section>

          <Section>
            <SectionTop>
              <SectionTitle>
                Watch history{" "}
                {watchDates.length > 0 ? `(${watchDates.length})` : ""}
              </SectionTitle>
            </SectionTop>

            {watchDates.length > 0 ? (
              <HistoryList>
                {sortedWatchDates.map((date, index) => (
                  <li key={index}>{date}</li>
                ))}
              </HistoryList>
            ) : (
              <MutedText>No rewatches yet</MutedText>
            )}
          </Section>

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
              <Button onClick={handleEdit} type="button">
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

const TitleBlock = styled.div`
  margin-bottom: 18px;
`;

const MovieTitle = styled.h1`
  margin: 0;
  line-height: 1.2;
  color: #111827;
  font-size: clamp(1.9rem, 3vw, 2.6rem);
  word-break: break-word;
`;

const TopSection = styled.div`
  display: grid;
  grid-template-columns: 280px minmax(0, 1fr);
  gap: 22px;
  align-items: start;
  margin-bottom: 22px;

  @media (max-width: 760px) {
    grid-template-columns: 1fr;
  }
`;

const PosterColumn = styled.div``;

const PosterFrame = styled.div`
  position: relative;
  width: 100%;
  aspect-ratio: 2 / 3;
  overflow: hidden;
  border-radius: 14px;
  background: #f3f4f6;
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

const MetaGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

const TmdbGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;

  @media (max-width: 760px) {
    grid-template-columns: 1fr;
  }
`;

const MetaCard = styled.div`
  padding: 14px 16px;
  border: 1px solid #eef2f7;
  border-radius: 14px;
  background: #fcfcfd;
`;

const MetaLabel = styled.div`
  margin-bottom: 6px;
  color: #6b7280;
  font-size: 0.9rem;
`;

const MetaValue = styled.div`
  color: #111827;
  line-height: 1.45;
  word-break: break-word;
`;

const TmdbActions = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 14px;
  flex-wrap: wrap;
`;

const FetchedText = styled.span`
  color: #6b7280;
  font-size: 0.9rem;
`;

const TmdbErrorText = styled.div`
  margin-top: 10px;
  color: #b91c1c;
  font-size: 0.9rem;
`;

const Section = styled.div`
  margin-top: 22px;
`;

const SectionTop = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
`;

const SectionTitle = styled.h2`
  margin: 0 0 12px;
  font-size: 1.05rem;
  color: #111827;
`;

const SmallTitle = styled.h3`
  margin: 0 0 8px;
  font-size: 0.95rem;
  color: #374151;
`;

const SmallText = styled.div`
  color: #64748b;
  font-size: 0.85rem;
  line-height: 1.45;
  word-break: break-all;
`;

const TmdbSubsection = styled.div`
  margin-top: 14px;
`;

const RatingsList = styled.div`
  display: grid;
  gap: 10px;
`;

const RatingItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 14px;
  border: 1px solid #eef2f7;
  border-radius: 12px;
  background: #fcfcfd;
  color: #374151;
`;

const HistoryList = styled.ul`
  margin: 0;
  padding-left: 18px;

  li {
    margin-bottom: 6px;
    color: #374151;
  }
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