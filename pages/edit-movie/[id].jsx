import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import supabase from "../../src/supabase";
import styled from "styled-components";
import { CirclePlus, Plus } from "lucide-react";
import { Button } from "../../styles/globalStyles";

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  padding: 20px;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  max-width: 600px;
  width: 100%;
  padding: 24px;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  margin-top: 20px;
  box-shadow: 0 10px 30px rgba(17, 24, 39, 0.05);
`;

const WatchHistoryCard = styled.div`
  max-width: 600px;
  width: 100%;
  padding: 20px;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  margin-top: 12px;
  box-shadow: 0 10px 30px rgba(17, 24, 39, 0.05);
`;

const WatchHistoryTop = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 12px;
`;

const WatchHistoryTitle = styled.h3`
  margin: 0;
  font-size: 1rem;
  color: #111827;
`;

const WatchHistoryList = styled.ul`
  margin: 0;
  padding-left: 18px;

  li {
    margin-bottom: 6px;
    color: #374151;
  }
`;

const EmptyText = styled.p`
  margin: 0;
  color: #6b7280;
`;

const InputGroup = styled.div`
  display: flex;
  flex-direction: column-reverse;
  align-items: flex-start;
  margin-bottom: 20px;
`;

const Input = styled.input`
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #d7dee8;
  border-radius: 12px;
  font-size: 16px;
  background: #ffffff;
  color: #111827;

  &:focus {
    outline: none;
    border-color: #b8c7dc;
    box-shadow: 0 0 0 4px rgba(191, 208, 229, 0.25);
  }
`;

const Label = styled.label`
  font-size: 14px;
  color: #666;
  margin-bottom: 6px;
`;

const Hint = styled.p`
  margin: -10px 0 16px;
  font-size: 13px;
  color: #6b7280;
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #d7dee8;
  border-radius: 12px;
  font-size: 16px;
  min-height: 100px;
  background: #ffffff;
  color: #111827;
  resize: vertical;

  &:focus {
    outline: none;
    border-color: #b8c7dc;
    box-shadow: 0 0 0 4px rgba(191, 208, 229, 0.25);
  }
`;

const SuccessMessage = styled.div`
  padding: 16px 18px;
  margin-top: 14px;
  border-radius: 12px;
  background-color: #dcfce7;
  color: #166534;
`;

const ErrorMessage = styled.div`
  padding: 16px 18px;
  margin-top: 14px;
  border-radius: 12px;
  background-color: #fef9c3;
  color: #854d0e;
`;

const InlineButtonWrap = styled.div`
  margin-top: -6px;
  margin-bottom: 20px;
`;

export default function EditMovie() {
  const router = useRouter();
  const { id } = router.query;

  const currentDay = useMemo(
    () => new Date().toISOString().slice(0, 10),
    []
  );

  const [movieData, setMovieData] = useState({
    title: "",
    imdb: "",
    director: "",
    year: "",
    personalRating: "",
    comment: "",
    watchTime: currentDay,
    watchDatesText: "",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    if (id) fetchMovieData(id);
  }, [id]);

  const parsedWatchDates = movieData.watchDatesText
    .split(",")
    .map((d) => d.trim())
    .filter(Boolean);

  const sortedWatchDates = [...parsedWatchDates].sort((a, b) =>
    a < b ? 1 : -1
  );

  const fetchMovieData = async (movieId) => {
    setIsLoading(true);
    setError("");

    const { data, error } = await supabase
      .from("movies_2024")
      .select("*")
      .eq("id", movieId)
      .single();

    setIsLoading(false);

    if (error) {
      setError("Failed to fetch movie data");
      return;
    }

    setMovieData({
      title: data.title || "",
      imdb: data.imdb || "",
      director: data.director || "",
      year: data.year || "",
      personalRating: data.rating || "",
      comment: data.comment || "",
      watchTime: data.watchTime || currentDay,
      watchDatesText: Array.isArray(data.watch_dates)
        ? data.watch_dates.join(", ")
        : "",
    });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();

    setError("");
    setSuccessMessage("");

    if (
      !movieData.title.trim() ||
      !movieData.director.trim() ||
      !movieData.year.toString().trim() ||
      !movieData.watchTime
    ) {
      setError("Please fill in title, director, year and watch time.");
      return;
    }

    setIsLoading(true);

    const { error } = await supabase
      .from("movies_2024")
      .update({
        title: movieData.title,
        imdb: movieData.imdb,
        director: movieData.director,
        year: movieData.year,
        rating: movieData.personalRating,
        comment: movieData.comment,
        watchTime: movieData.watchTime,
        watch_dates: parsedWatchDates,
      })
      .eq("id", id);

    setIsLoading(false);

    if (error) {
      setError(error.message);
      setSuccessMessage("");
      return;
    }

    setSuccessMessage("Movie updated successfully!");
    setTimeout(() => router.push("/"), 1200);
  };

  const addTodayToWatchHistory = () => {
    setMovieData((prev) => {
      const items = prev.watchDatesText
        .split(",")
        .map((d) => d.trim())
        .filter(Boolean);

      if (items.includes(currentDay)) return prev;

      return {
        ...prev,
        watchDatesText: prev.watchDatesText
          ? `${prev.watchDatesText}, ${currentDay}`
          : currentDay,
      };
    });
  };

  return (
    <Container>
      <h1>Edit Movie</h1>

      <WatchHistoryCard>
        <WatchHistoryTop>
          <WatchHistoryTitle>
            Watch history {sortedWatchDates.length ? `(${sortedWatchDates.length})` : ""}
          </WatchHistoryTitle>

          <Button type="button" onClick={addTodayToWatchHistory}>
            <Plus size={16} />
            Today
          </Button>
        </WatchHistoryTop>

        {sortedWatchDates.length > 0 ? (
          <WatchHistoryList>
            {sortedWatchDates.map((date, index) => (
              <li key={`${date}-${index}`}>{date}</li>
            ))}
          </WatchHistoryList>
        ) : (
          <EmptyText>No watch history yet.</EmptyText>
        )}
      </WatchHistoryCard>

      <Form onSubmit={handleUpdate}>
        <InputGroup>
          <Label>Title</Label>
          <Input
            type="text"
            value={movieData.title}
            onChange={(e) =>
              setMovieData({ ...movieData, title: e.target.value })
            }
          />
        </InputGroup>

        <InputGroup>
          <Label>Director</Label>
          <Input
            type="text"
            value={movieData.director}
            onChange={(e) =>
              setMovieData({ ...movieData, director: e.target.value })
            }
          />
        </InputGroup>

        <InputGroup>
          <Label>Year</Label>
          <Input
            type="text"
            value={movieData.year}
            onChange={(e) =>
              setMovieData({ ...movieData, year: e.target.value })
            }
          />
        </InputGroup>

        <InputGroup>
          <Label>Imdb ID</Label>
          <Input
            type="text"
            value={movieData.imdb}
            onChange={(e) =>
              setMovieData({ ...movieData, imdb: e.target.value })
            }
          />
        </InputGroup>

        <InputGroup>
          <Label>Personal Rating</Label>
          <Input
            type="text"
            value={movieData.personalRating}
            onChange={(e) =>
              setMovieData({
                ...movieData,
                personalRating: e.target.value,
              })
            }
          />
        </InputGroup>

        <InputGroup>
          <Label>First Watch Time</Label>
          <Input
            type="date"
            value={movieData.watchTime}
            onChange={(e) =>
              setMovieData({ ...movieData, watchTime: e.target.value })
            }
          />
        </InputGroup>

        <InputGroup>
          <Label>Watch dates</Label>
          <TextArea
            value={movieData.watchDatesText}
            onChange={(e) =>
              setMovieData({
                ...movieData,
                watchDatesText: e.target.value,
              })
            }
            placeholder="example: 2026-04-05, 2026-03-20"
          />
        </InputGroup>

        <Hint>Use comma-separated dates in YYYY-MM-DD format.</Hint>

        <InlineButtonWrap>
          <Button type="button" onClick={addTodayToWatchHistory}>
            <Plus size={16} />
            Add today
          </Button>
        </InlineButtonWrap>

        <InputGroup>
          <Label>Comment</Label>
          <TextArea
            value={movieData.comment}
            onChange={(e) =>
              setMovieData({ ...movieData, comment: e.target.value })
            }
          />
        </InputGroup>

        <Button type="submit" disabled={isLoading}>
          <CirclePlus size={16} style={{ marginRight: "8px" }} />
          {isLoading ? "Updating..." : "Update Movie"}
        </Button>

        {error && <ErrorMessage>{error}</ErrorMessage>}
        {successMessage && <SuccessMessage>{successMessage}</SuccessMessage>}
      </Form>
    </Container>
  );
}