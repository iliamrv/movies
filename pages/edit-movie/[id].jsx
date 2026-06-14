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
import { fetchOmdbById, searchOmdb, mergeMovieData } from "../../src/api/omdb";
import { buildMovieSearchText } from "../../src/utils/buildMovieSearchText";
import { getMovieDirector } from "../../src/utils/movieUtils";
import { buildWatchDatePayload } from "../../src/utils/movieFormUtils";

export default function EditMovie() {
  const router = useRouter();
  const { id } = router.query;
  const today = new Date().toISOString().slice(0, 10);

  const [movieData, setMovieData] = useState({
    title: "",
    imdb: "",
    director: "",
    year: "",
    personalRating: "",
    comment: "",
    watchTime: "",
    watchDatePrecision: "exact",
    watchYear: "",
    tags: [],
    watchDates: [],
    external_meta: null,
  });
  const [rewatchDate, setRewatchDate] = useState(today);
  const [tagInput, setTagInput] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (id) fetchMovie(id);
  }, [id]);

  async function fetchMovie(movieId) {
    const { data, error: fetchError } = await getMovieById(movieId);

    if (fetchError) {
      setError("Failed to load movie");
      return;
    }

    const savedPrecision = data.watch_date_precision || "exact";
    const savedWatchYear = data.watchTime
      ? String(data.watchTime).slice(0, 4)
      : data.year
        ? String(data.year)
        : "";

    const director = getMovieDirector(data);

    setMovieData({
      title: data.title || "",
      imdb: data.imdb || "",
      director: director === "-" ? "" : director,
      year: data.year || "",
      personalRating: data.rating || "",
      comment: data.comment || "",
      watchTime: data.watchTime || "",
      watchDatePrecision: savedPrecision,
      watchYear: savedWatchYear,
      tags: Array.isArray(data.tags) ? data.tags : [],
      watchDates: Array.isArray(data.watch_dates) ? data.watch_dates : [],
      external_meta: data.external_meta || null,
    });

    setRewatchDate(today);
  }

  async function handleFetchFromImdb() {
    if (!movieData.imdb) return;

    const imdbData = await fetchOmdbById(movieData.imdb);

    if (!imdbData) {
      setError("Failed to fetch from IMDb");
      return;
    }

    const merged = mergeMovieData(movieData, imdbData);

    setMovieData((prev) => ({
      ...prev,
      title: merged.title,
      year: merged.year,
      director: merged.director && merged.director !== "N/A" ? merged.director : "",
    }));
  }

  async function handleSearch() {
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
  }

  async function handleSelect(item) {
    setMovieData((prev) => ({
      ...prev,
      imdb: item.imdbID,
    }));

    const imdbData = await fetchOmdbById(item.imdbID);

    if (!imdbData) return;

    const merged = mergeMovieData(movieData, imdbData);

    setMovieData((prev) => ({
      ...prev,
      imdb: item.imdbID,
      title: merged.title,
      year: merged.year,
      director: merged.director && merged.director !== "N/A" ? merged.director : "",
    }));

    setSearchResults([]);
  }

  function removeTag(tagToRemove) {
    setMovieData((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }));
  }

  function addTag() {
    const cleanTag = String(tagInput || "").trim().toLowerCase();

    if (!cleanTag) return;

    setMovieData((prev) => ({
      ...prev,
      tags: Array.from(new Set([...(prev.tags || []), cleanTag])),
    }));
    setTagInput("");
  }

  function addRewatchDate() {
    if (!rewatchDate) {
      setError("Choose a rewatch date");
      return;
    }

    setError("");

    setMovieData((prev) => {
      const currentDates = Array.isArray(prev.watchDates) ? prev.watchDates : [];

      if (currentDates.includes(rewatchDate)) {
        return prev;
      }

      return {
        ...prev,
        watchDates: [...currentDates, rewatchDate].sort((a, b) =>
          b.localeCompare(a)
        ),
      };
    });
  }

  async function handleUpdate(event) {
    event.preventDefault();
    setIsLoading(true);
    setError("");

    const nextWatchTime = buildWatchDatePayload({
      watchDatePrecision: movieData.watchDatePrecision,
      watchTime: movieData.watchTime,
      watchYear: movieData.watchYear,
    });

    const payload = {
      title: movieData.title,
      imdb: movieData.imdb || null,
      director: movieData.director || null,
      year: movieData.year ? Number(movieData.year) : null,
      rating: movieData.personalRating
        ? Math.round(Number(movieData.personalRating))
        : null,
      comment: movieData.comment || null,
      watchTime: nextWatchTime,
      watch_date_precision: movieData.watchDatePrecision,
      tags: Array.isArray(movieData.tags) ? movieData.tags : [],
      watch_dates: Array.isArray(movieData.watchDates)
        ? movieData.watchDates
        : [],
    };

    payload.search_text = buildMovieSearchText({
      ...payload,
      external_meta: movieData.external_meta,
    });

    const { error: updateError } = await updateMovieById(id, payload);

    setIsLoading(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    router.push("/");
  }

  async function handleDelete() {
    const confirmed = window.confirm("Delete this movie?");
    if (!confirmed) return;

    setIsDeleting(true);

    const { error: deleteError } = await deleteMovieById(id);

    setIsDeleting(false);

    if (deleteError) {
      setError("Delete failed");
      return;
    }

    router.push("/");
  }

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
              <ResultItem key={item.imdbID} onClick={() => handleSelect(item)}>
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

        <DateBlock>
          <DateHeader>
            <Label>Date</Label>
          </DateHeader>

          <ApproxDateCard
            type="button"
            $active={movieData.watchDatePrecision === "year"}
            onClick={() => {
              const nextIsYear = movieData.watchDatePrecision !== "year";

              setMovieData((prev) => ({
                ...prev,
                watchDatePrecision: nextIsYear ? "year" : "exact",
                watchYear: nextIsYear
                  ? prev.watchYear ||
                    (prev.watchTime ? String(prev.watchTime).slice(0, 4) : "") ||
                    (prev.year ? String(prev.year) : "")
                  : prev.watchYear,
              }));
            }}
          >
            <ApproxCheckbox $active={movieData.watchDatePrecision === "year"}>
              {movieData.watchDatePrecision === "year" ? "✓" : ""}
            </ApproxCheckbox>

            <ApproxTextWrap>
              <ApproxTitle>I do not remember the exact date</ApproxTitle>
              <ApproxHint>I only want to save the watch year</ApproxHint>
            </ApproxTextWrap>
          </ApproxDateCard>

          {movieData.watchDatePrecision === "year" ? (
            <YearInput
              type="number"
              min="1900"
              max="2100"
              value={movieData.watchYear}
              onChange={(e) =>
                setMovieData((prev) => ({
                  ...prev,
                  watchYear: e.target.value,
                }))
              }
              placeholder={movieData.year ? String(movieData.year) : "2024"}
            />
          ) : (
            <Input
              type="date"
              value={movieData.watchTime}
              onChange={(e) =>
                setMovieData((prev) => ({
                  ...prev,
                  watchTime: e.target.value,
                  watchYear: e.target.value
                    ? e.target.value.slice(0, 4)
                    : prev.watchYear,
                }))
              }
            />
          )}
        </DateBlock>

        <RewatchBlock>
          <RewatchTop>
            <div>
              <Label>Rewatch dates</Label>
              <RewatchHint>
                Add extra watch dates here. Your main watch date above stays as-is.
              </RewatchHint>
            </div>
          </RewatchTop>

          <RewatchControls>
            <SmallDateInput
              type="date"
              value={rewatchDate}
              onChange={(e) => setRewatchDate(e.target.value)}
            />

            <SecondaryButton type="button" onClick={addRewatchDate}>
              Add date
            </SecondaryButton>
          </RewatchControls>

          {movieData.watchDates.length > 0 ? (
            <WatchDatesList>
              {movieData.watchDates.map((date) => (
                <WatchDateChip key={date}>{date}</WatchDateChip>
              ))}
            </WatchDatesList>
          ) : (
            <TagHint>No rewatch dates yet</TagHint>
          )}
        </RewatchBlock>

        <CommentBlock>
          <CommentTop>
            <CommentTitleWrap>
              <Label>Comment</Label>
              <CommentHint>Short personal note about the movie.</CommentHint>
            </CommentTitleWrap>
          </CommentTop>

          <CommentTextArea
            value={movieData.comment}
            onChange={(e) =>
              setMovieData({ ...movieData, comment: e.target.value })
            }
            placeholder="Short personal note..."
          />
        </CommentBlock>

        <TagsBlock>
          <Label>Tags</Label>

          <TagInputRow>
            <TagInput
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              placeholder="Add tag"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addTag();
                }
              }}
            />
            <SecondaryButton type="button" onClick={addTag}>
              Add tag
            </SecondaryButton>
          </TagInputRow>

          {movieData.tags.length > 0 ? (
            <CurrentTags>
              {movieData.tags.map((tag) => (
                <CurrentTag key={tag}>
                  {tag}
                  <RemoveTagButton type="button" onClick={() => removeTag(tag)}>
                    ×
                  </RemoveTagButton>
                </CurrentTag>
              ))}
            </CurrentTags>
          ) : (
            <TagHint>No tags yet</TagHint>
          )}
        </TagsBlock>

        <BottomButtons>
          <Button type="submit" disabled={isLoading}>
            <CirclePlus size={16} />
            {isLoading ? "Updating..." : "Update"}
          </Button>

          <Button type="button" onClick={handleDelete} disabled={isDeleting}>
            <Trash2 size={16} /> {isDeleting ? "Deleting..." : "Delete"}
          </Button>

          <Button type="button" onClick={() => router.back()}>
            <ArrowLeft size={16} /> Back
          </Button>
        </BottomButtons>
      </Form>
    </Container>
  );
}

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  max-width: 720px;
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
  width: 100%;
  box-sizing: border-box;
  padding: 11px 12px;
  border-radius: 10px;
  border: 1px solid #d1d5db;
  font-family: inherit;
  font-size: 14px;
  outline: none;

  &:focus {
    border-color: #111827;
    box-shadow: 0 0 0 4px rgba(17, 24, 39, 0.06);
  }
`;

const Label = styled.label`
  font-size: 14px;
  margin-bottom: 6px;
  font-weight: 600;
`;

const SearchResults = styled.div`
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  margin-top: 10px;
  margin-bottom: 20px;
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
  color: #b91c1c;
  margin: 10px 0 16px;
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
`;

const RatingHint = styled.div`
  margin-top: 8px;
  color: #64748b;
  font-size: 13px;
`;

const DateBlock = styled.div`
  margin-bottom: 22px;
`;

const DateHeader = styled.div`
  margin-bottom: 8px;
`;

const ApproxDateCard = styled.button`
  width: 100%;
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
  padding: 12px 14px;
  border-radius: 14px;
  border: 1px solid ${({ $active }) => ($active ? "#111827" : "#d7dee8")};
  background: ${({ $active }) => ($active ? "#f8fafc" : "#fff")};
  color: #111827;
  cursor: pointer;
  text-align: left;

  &:hover {
    border-color: #111827;
    background: #f8fafc;
  }
`;

const ApproxCheckbox = styled.span`
  width: 22px;
  height: 22px;
  flex: 0 0 22px;
  border-radius: 7px;
  border: 1px solid ${({ $active }) => ($active ? "#111827" : "#cbd5e1")};
  background: ${({ $active }) => ($active ? "#111827" : "#fff")};
  color: #fff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 800;
`;

const ApproxTextWrap = styled.span`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const ApproxTitle = styled.span`
  font-size: 14px;
  font-weight: 700;
  color: #111827;
`;

const ApproxHint = styled.span`
  font-size: 13px;
  color: #64748b;
`;

const YearInput = styled.input`
  width: 100%;
  box-sizing: border-box;
  padding: 11px 12px;
  border-radius: 10px;
  border: 1px solid #d1d5db;
  background: #fff;
  color: #111827;
  font-family: inherit;
  font-size: 14px;
  outline: none;
`;

const RewatchBlock = styled.div`
  margin-bottom: 24px;
  padding: 16px;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  background: #fcfcfd;
`;

const RewatchTop = styled.div`
  margin-bottom: 12px;
`;

const RewatchHint = styled.div`
  margin-top: 4px;
  color: #64748b;
  font-size: 13px;
  line-height: 1.4;
`;

const RewatchControls = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
`;

const SmallDateInput = styled.input`
  min-height: 38px;
  padding: 0 12px;
  border-radius: 10px;
  border: 1px solid #d1d5db;
  background: #fff;
  color: #111827;
  font-family: inherit;
  font-size: 14px;
  outline: none;
`;

const WatchDatesList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 14px;
`;

const WatchDateChip = styled.span`
  display: inline-flex;
  align-items: center;
  min-height: 32px;
  padding: 0 10px;
  border-radius: 999px;
  background: #eef2f7;
  color: #334155;
  font-size: 13px;
  font-weight: 700;
`;

const CommentBlock = styled.div`
  margin-bottom: 24px;
  padding: 16px;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  background: #fcfcfd;
`;

const CommentTop = styled.div`
  margin-bottom: 10px;
`;

const CommentTitleWrap = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const CommentHint = styled.div`
  color: #64748b;
  font-size: 13px;
  line-height: 1.4;
`;

const CommentTextArea = styled.textarea`
  width: 100%;
  min-height: 150px;
  padding: 14px 16px;
  border-radius: 14px;
  border: 1px solid #d1d5db;
  background: #fff;
  color: #111827;
  font-size: 15px;
  line-height: 1.6;
  resize: vertical;
  box-sizing: border-box;
  outline: none;
  font-family: inherit;
`;

const TagsBlock = styled.div`
  margin-bottom: 20px;
`;

const TagInputRow = styled.div`
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 8px;
`;

const TagInput = styled(Input)`
  flex: 1 1 220px;
`;

const CurrentTags = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
  margin-top: 8px;
`;

const CurrentTag = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 9px;
  border-radius: 999px;
  background: #eef2f7;
  color: #334155;
  font-size: 13px;
  font-weight: 700;
`;

const RemoveTagButton = styled.button`
  border: 0;
  background: transparent;
  color: #64748b;
  font-size: 16px;
  line-height: 1;
  cursor: pointer;
`;

const TagHint = styled.div`
  margin-top: 8px;
  color: #94a3b8;
  font-size: 13px;
`;

const SecondaryButton = styled.button`
  min-height: 36px;
  padding: 0 14px;
  border: 1px solid #d1d5db;
  border-radius: 999px;
  background: #fff;
  color: #111827;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
`;
