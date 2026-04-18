import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import supabase from "../../src/supabase";
import styled from "styled-components";
import { Search, Zap, CirclePlus, Trash2, ArrowLeft } from "lucide-react";
import { Button } from "../../styles/globalStyles";

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  max-width: 600px;
  width: 100%;
  padding: 24px;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  background: #fff;
`;

const InputGroup = styled.div`
  display: flex;
  flex-direction: column-reverse;
  margin-bottom: 20px;
`;

const Input = styled.input`
  padding: 10px;
  border-radius: 10px;
  border: 1px solid #ddd;
`;

const Label = styled.label`
  font-size: 14px;
  margin-bottom: 6px;
`;

const TextArea = styled.textarea`
  padding: 10px;
  border-radius: 10px;
  min-height: 100px;
  border: 1px solid #ddd;
`;

const SearchResults = styled.div`
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  margin-top: 10px;
  overflow: hidden;
`;

const ResultItem = styled.div`
  padding: 10px;
  cursor: pointer;
  border-bottom: 1px solid #f3f4f6;

  &:hover {
    background: #f9fafb;
  }

  &:last-child {
    border-bottom: none;
  }
`;

const ErrorText = styled.p`
  color: red;
  margin: 10px 0 0;
`;

const ActionBlock = styled.div`
  margin-bottom: 20px;
`;

const BottomButtons = styled.div`
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 20px;
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
  });

  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (id) fetchMovieFromDb(id);
  }, [id]);

  const fetchMovieFromDb = async (movieId) => {
    const { data, error } = await supabase
      .from("movies_2024")
      .select("*")
      .eq("id", movieId)
      .single();

    if (error) {
      setError("Failed to load movie from database");
      return;
    }

    if (data) {
      setMovieData({
        title: data.title || "",
        imdb: data.imdb || "",
        director: data.director || "",
        year: data.year || "",
        personalRating: data.rating || "",
        comment: data.comment || "",
        watchTime: data.watchTime || currentDay,
      });
    }
  };

  const fetchMovieDataFromImdb = async (imdbID) => {
    if (!imdbID) {
      setError("IMDb ID is empty");
      return;
    }

    setError("");

    try {
      const res = await fetch(
        `https://www.omdbapi.com/?i=${encodeURIComponent(imdbID)}&apikey=8aab931f`
      );
      const data = await res.json();

      if (data.Response === "True") {
        setMovieData((prev) => ({
          ...prev,
          imdb: imdbID,
          title: data.Title || prev.title,
          year:
            data.Year && /^\d{4}$/.test(data.Year)
              ? Number(data.Year)
              : prev.year,
          director: data.Director || prev.director,
        }));
      } else {
        setError(data.Error || "Failed to fetch movie details");
      }
    } catch (e) {
      setError("Fetch failed");
    }
  };

  const searchImdb = async () => {
    if (!movieData.title.trim()) {
      setError("Enter a title first");
      return;
    }

    setIsSearching(true);
    setSearchResults([]);
    setError("");

    const cleanTitle = movieData.title.trim();
    const cleanYear = String(movieData.year || "").trim();

    try {
      const exactUrl = cleanYear
        ? `https://www.omdbapi.com/?t=${encodeURIComponent(cleanTitle)}&y=${encodeURIComponent(cleanYear)}&apikey=8aab931f`
        : `https://www.omdbapi.com/?t=${encodeURIComponent(cleanTitle)}&apikey=8aab931f`;

      const exactRes = await fetch(exactUrl);
      const exactData = await exactRes.json();

      if (exactData.Response === "True") {
        setSearchResults([
          {
            imdbID: exactData.imdbID,
            Title: exactData.Title,
            Year: exactData.Year,
            Type: exactData.Type,
          },
        ]);
        setIsSearching(false);
        return;
      }

      const listQuery = cleanYear ? `${cleanTitle} ${cleanYear}` : cleanTitle;

      const listRes = await fetch(
        `https://www.omdbapi.com/?s=${encodeURIComponent(listQuery)}&apikey=8aab931f`
      );
      const listData = await listRes.json();

      if (listData.Response === "True" && Array.isArray(listData.Search)) {
        setSearchResults(listData.Search);
      } else {
        setError(listData.Error || exactData.Error || "Nothing found");
      }
    } catch (e) {
      setError("Search failed");
    }

    setIsSearching(false);
  };

  const selectImdb = async (item) => {
    await fetchMovieDataFromImdb(item.imdbID);
    setSearchResults([]);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    const payload = {
      title: movieData.title,
      imdb: movieData.imdb || null,
      director: movieData.director || null,
      year: movieData.year ? Number(movieData.year) : null,
      rating: movieData.personalRating
        ? Math.round(Number(movieData.personalRating))
        : null,
      comment: movieData.comment || null,
      watchTime: movieData.watchTime || null,
    };

    const { error } = await supabase
      .from("movies_2024")
      .update(payload)
      .eq("id", id);

    setIsLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    router.push("/");
  };

  const handleDelete = async () => {
    if (!id) return;

    const confirmed = window.confirm("Delete this movie?");
    if (!confirmed) return;

    setError("");
    setIsDeleting(true);

    const { error } = await supabase
      .from("movies_2024")
      .delete()
      .eq("id", id);

    setIsDeleting(false);

    if (error) {
      setError("Delete failed");
      return;
    }

    router.push("/");
  };

  return (
    <Container>
      <h1>Edit Movie</h1>

      <Form onSubmit={handleUpdate}>
        <InputGroup>
          <Label>Title</Label>
          <Input
            value={movieData.title}
            onChange={(e) =>
              setMovieData({ ...movieData, title: e.target.value })
            }
          />
        </InputGroup>

        <ActionBlock>
          {movieData.imdb ? (
            <Button
              type="button"
              onClick={() => fetchMovieDataFromImdb(movieData.imdb)}
            >
              <Zap size={16} style={{ marginRight: 6 }} />
              Fetch Movie Data
            </Button>
          ) : (
            <Button type="button" onClick={searchImdb}>
              <Search size={16} style={{ marginRight: 6 }} />
              Find IMDb
            </Button>
          )}
        </ActionBlock>

        {isSearching && <p>Searching...</p>}
        {error && <ErrorText>{error}</ErrorText>}

        {searchResults.length > 0 && (
          <SearchResults>
            {searchResults.map((item) => (
              <ResultItem
                key={item.imdbID}
                onClick={() => selectImdb(item)}
              >
                {item.Title} ({item.Year})
              </ResultItem>
            ))}
          </SearchResults>
        )}

        <InputGroup>
          <Label>IMDb ID</Label>
          <Input
            value={movieData.imdb}
            onChange={(e) =>
              setMovieData({ ...movieData, imdb: e.target.value })
            }
          />
        </InputGroup>

        <InputGroup>
          <Label>Director</Label>
          <Input
            value={movieData.director}
            onChange={(e) =>
              setMovieData({ ...movieData, director: e.target.value })
            }
          />
        </InputGroup>

        <InputGroup>
          <Label>Year</Label>
          <Input
            value={movieData.year}
            onChange={(e) =>
              setMovieData({ ...movieData, year: e.target.value })
            }
          />
        </InputGroup>

        <InputGroup>
          <Label>Date</Label>
          <Input
            type="date"
            value={movieData.watchTime}
            onChange={(e) =>
              setMovieData({
                ...movieData,
                watchTime: e.target.value,
              })
            }
          />
        </InputGroup>

        <InputGroup>
          <Label>Comment</Label>
          <TextArea
            value={movieData.comment}
            onChange={(e) =>
              setMovieData({
                ...movieData,
                comment: e.target.value,
              })
            }
          />
        </InputGroup>

        <BottomButtons>
          <Button type="submit" disabled={isLoading}>
            <CirclePlus size={16} style={{ marginRight: 6 }} />
            {isLoading ? "Updating..." : "Update"}
          </Button>

          <Button type="button" onClick={handleDelete} disabled={isDeleting}>
            <Trash2 size={16} style={{ marginRight: 6 }} />
            {isDeleting ? "Deleting..." : "Delete"}
          </Button>

          <Button type="button" onClick={() => router.back()}>
            <ArrowLeft size={16} style={{ marginRight: 6 }} />
            Go Back
          </Button>
        </BottomButtons>
      </Form>
    </Container>
  );
}