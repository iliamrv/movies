import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import styled from "styled-components";

import { Search, Zap, CirclePlus, Trash2, ArrowLeft } from "lucide-react";
import { Button } from "../../styles/globalStyles";

import {
  getMovieById,
  updateMovieById,
  deleteMovieById,
} from "../../src/api/movies";

import {
  fetchOmdbById,
  searchOmdb,
  mergeMovieData,
} from "../../src/api/omdb";

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



const [movieData, setMovieData] = useState({
  title: "",
  imdb: "",
  director: "",
  year: "",
  personalRating: "",
  comment: "",
  watchTime: "",
});

  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (id) fetchMovie(id);
  }, [id]);

  const fetchMovie = async (movieId) => {
    const { data, error } = await getMovieById(movieId);

    if (error) {
      setError("Failed to load movie");
      return;
    }

 setMovieData({
  title: data.title || "",
  imdb: data.imdb || "",
  director: data.director || "",
  year: data.year || "",
  personalRating: data.rating || "",
  comment: data.comment || "",
  watchTime: data.watchTime || "", // ✅ тут ок
});
  };

  const handleFetchFromImdb = async () => {
    if (!movieData.imdb) return;

    const imdbData = await fetchOmdbById(movieData.imdb);

    if (!imdbData) {
      setError("Failed to fetch from IMDb");
      return;
    }

    const merged = mergeMovieData(movieData, imdbData);

    setMovieData({
      ...movieData,
      title: merged.title,
      year: merged.year,
      director: merged.director,
    });
  };

  const handleSearch = async () => {
    if (!movieData.title.trim()) {
      setError("Enter title");
      return;
    }

    setIsSearching(true);
    setSearchResults([]);
    setError("");

    const results = await searchOmdb(movieData.title, movieData.year);

    setSearchResults(results);
    setIsSearching(false);
  };

  const handleSelect = async (item) => {
    setMovieData((prev) => ({
      ...prev,
      imdb: item.imdbID,
    }));

    const imdbData = await fetchOmdbById(item.imdbID);

    if (!imdbData) return;

    const merged = mergeMovieData(movieData, imdbData);

    setMovieData({
      ...movieData,
      imdb: item.imdbID,
      title: merged.title,
      year: merged.year,
      director: merged.director,
    });

    setSearchResults([]);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
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

    const { error } = await updateMovieById(id, payload);

    setIsLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    router.push("/");
  };

  const handleDelete = async () => {
    const confirmed = window.confirm("Delete this movie?");
    if (!confirmed) return;

    setIsDeleting(true);

    const { error } = await deleteMovieById(id);

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
            <Button type="button" onClick={handleFetchFromImdb}>
              <Zap size={16} /> Fetch Movie Data
            </Button>
          ) : (
            <Button type="button" onClick={handleSearch}>
              <Search size={16} /> Find IMDb
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
                onClick={() => handleSelect(item)}
              >
                {item.Title} ({item.Year})
              </ResultItem>
            ))}
          </SearchResults>
        )}

        <InputGroup>
          <Label>IMDb</Label>
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

<RatingGroup>
  <Label>Rating</Label>

  <RatingButtons>
    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((rating) => (
      <RatingButton
        key={rating}
        type="button"
        $active={String(movieData.personalRating) === String(rating)}
        onClick={() =>
          setMovieData({
            ...movieData,
            personalRating:
              String(movieData.personalRating) === String(rating)
                ? ""
                : String(rating),
          })
        }
      >
        {rating}
      </RatingButton>
    ))}
  </RatingButtons>

  <RatingHint>
    {movieData.personalRating
      ? `Your rating: ${movieData.personalRating}/10`
      : "No rating"}
  </RatingHint>
</RatingGroup>

        <InputGroup>
          <Label>Date</Label>
          <Input
            type="date"
            value={movieData.watchTime}
            onChange={(e) =>
              setMovieData({ ...movieData, watchTime: e.target.value })
            }
          />
        </InputGroup>

        <InputGroup>
          <Label>Comment</Label>
          <TextArea
            value={movieData.comment}
            onChange={(e) =>
              setMovieData({ ...movieData, comment: e.target.value })
            }
          />
        </InputGroup>

        <BottomButtons>
          <Button type="submit" disabled={isLoading}>
            <CirclePlus size={16} />
            {isLoading ? "Updating..." : "Update"}
          </Button>

          <Button type="button" onClick={handleDelete}>
            <Trash2 size={16} /> Delete
          </Button>

          <Button type="button" onClick={() => router.back()}>
            <ArrowLeft size={16} /> Back
          </Button>
        </BottomButtons>
      </Form>
    </Container>
  );
}

const RatingGroup = styled.div`
  margin-bottom: 20px;
`;

const RatingButtons = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 6px;
`;

const RatingButton = styled.button`
  width: 42px;
  height: 38px;
  border-radius: 999px;
  border: 1px solid ${({ $active }) => ($active ? "#111827" : "#d7dee8")};
  background: ${({ $active }) => ($active ? "#111827" : "#fff")};
  color: ${({ $active }) => ($active ? "#fff" : "#111827")};
  font-weight: 700;
  cursor: pointer;

  &:hover {
    border-color: #111827;
    background: ${({ $active }) => ($active ? "#111827" : "#f8fafc")};
  }
`;

const RatingHint = styled.div`
  margin-top: 8px;
  color: #64748b;
  font-size: 13px;
`;