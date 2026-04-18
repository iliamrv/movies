import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Image from "next/image";
import styled from "styled-components";

import { Edit3, Trash2, ArrowLeft, Film } from "lucide-react";
import { StyledButtons, Button } from "../../styles/globalStyles";
import { getMovieById, deleteMovieById } from "../../src/api/movies";
import { fetchOmdbById, mergeMovieData } from "../../src/api/omdb";

export default function MovieDetails() {
  const router = useRouter();
  const { id } = router.query;

  const [movie, setMovie] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

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
  };

  const watchDates = Array.isArray(movie?.watch_dates)
    ? movie.watch_dates
    : [];

  const sortedWatchDates = [...watchDates].sort((a, b) =>
    a < b ? 1 : -1
  );

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
              {movie.Poster && movie.Poster !== "N/A" ? (
                <PosterFrame>
                  <Image
                    src={movie.Poster}
                    alt={movie.title || "Movie poster"}
                    fill
                    sizes="(max-width: 768px) 100vw, 280px"
                    style={{ objectFit: "cover" }}
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
                  <MetaLabel>Year</MetaLabel>
                  <MetaValue>{movie.year || movie.Year || "—"}</MetaValue>
                </MetaCard>

                <MetaCard>
                  <MetaLabel>Runtime</MetaLabel>
                  <MetaValue>{movie.Runtime || "—"}</MetaValue>
                </MetaCard>

                <MetaCard>
                  <MetaLabel>Genre</MetaLabel>
                  <MetaValue>{movie.Genre || "—"}</MetaValue>
                </MetaCard>

                <MetaCard>
                  <MetaLabel>Watch Time</MetaLabel>
                  <MetaValue>{movie.watchTime || "n/a"}</MetaValue>
                </MetaCard>

                <MetaCard>
                  <MetaLabel>IMDb ID</MetaLabel>
                  <MetaValue>{movie.imdb || "—"}</MetaValue>
                </MetaCard>
              </MetaGrid>
            </InfoColumn>
          </TopSection>

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
                Watch history {watchDates.length > 0 ? `(${watchDates.length})` : ""}
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