import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import styled from "styled-components";

import {
  Search,
  Zap,
  CirclePlus,
  Trash2,
  ArrowLeft,
  Sparkles,
} from "lucide-react";

import { Button } from "../../styles/globalStyles";

import {
  getMovieById,
  updateMovieById,
  deleteMovieById,
} from "../../src/api/movies";

import { fetchOmdbById, searchOmdb, mergeMovieData } from "../../src/api/omdb";
import { buildMovieSearchText } from "../../src/utils/buildMovieSearchText";

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
    watchDatePrecision: "exact",
    watchYear: "",
    tags: [],
    external_meta: null,
  });

  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");

  const [isImprovingComment, setIsImprovingComment] = useState(false);
  const [aiCommentDraft, setAiCommentDraft] = useState("");
  const [aiTagOptions, setAiTagOptions] = useState([]);
  const [selectedAiTags, setSelectedAiTags] = useState([]);

  useEffect(() => {
    if (id) fetchMovie(id);
  }, [id]);

  async function fetchMovie(movieId) {
    const { data, error } = await getMovieById(movieId);

    if (error) {
      setError("Failed to load movie");
      return;
    }

    const savedPrecision = data.watch_date_precision || "exact";
    const savedWatchYear = data.watchTime
      ? String(data.watchTime).slice(0, 4)
      : data.year
      ? String(data.year)
      : "";

    setMovieData({
      title: data.title || "",
      imdb: data.imdb || "",
      director: data.director || "",
      year: data.year || "",
      personalRating: data.rating || "",
      comment: data.comment || "",
      watchTime: data.watchTime || "",
      watchDatePrecision: savedPrecision,
      watchYear: savedWatchYear,
      tags: Array.isArray(data.tags) ? data.tags : [],
      external_meta: data.external_meta || null,
    });
  }

  async function handleFetchFromImdb() {
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

    setMovieData({
      ...movieData,
      imdb: item.imdbID,
      title: merged.title,
      year: merged.year,
      director: merged.director,
    });

    setSearchResults([]);
  }

  async function handleImproveComment() {
    const rawComment = movieData.comment.trim();

    if (!rawComment) {
      setError("Write a raw comment first");
      return;
    }

    setIsImprovingComment(true);
    setError("");
    setAiCommentDraft("");
    setAiTagOptions([]);
    setSelectedAiTags([]);

    try {
      const response = await fetch("/api/improve-movie-comment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          rawComment,
          movie: {
            title: movieData.title,
            director: movieData.director,
            year: movieData.year,
            rating: movieData.personalRating,
            tags: movieData.tags,
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to improve comment");
      }

      setAiCommentDraft(data.comment || rawComment);

      const cleanTags = Array.isArray(data.tags)
        ? data.tags
            .map((tag) => String(tag).trim().toLowerCase())
            .filter(Boolean)
            .slice(0, 10)
        : [];

      setAiTagOptions(cleanTags);
      setSelectedAiTags(cleanTags.slice(0, 3));
    } catch (error) {
      console.error(error);
      setError("Failed to improve comment");
    } finally {
      setIsImprovingComment(false);
    }
  }

  function toggleAiTag(tag) {
    setSelectedAiTags((prev) => {
      if (prev.includes(tag)) {
        return prev.filter((item) => item !== tag);
      }

      if (prev.length >= 3) {
        return prev;
      }

      return [...prev, tag];
    });
  }

  function applyAiSuggestion() {
    const existingTags = Array.isArray(movieData.tags) ? movieData.tags : [];

    const nextTags = Array.from(
      new Set([
        ...existingTags.map((tag) => String(tag).trim().toLowerCase()),
        ...selectedAiTags.map((tag) => String(tag).trim().toLowerCase()),
      ])
    ).filter(Boolean);

    setMovieData((prev) => ({
      ...prev,
      comment: aiCommentDraft || prev.comment,
      tags: nextTags,
    }));

    setAiCommentDraft("");
    setAiTagOptions([]);
    setSelectedAiTags([]);
  }

  function removeTag(tagToRemove) {
    setMovieData((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }));
  }

  async function handleUpdate(e) {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    let nextWatchTime = null;

    if (movieData.watchDatePrecision === "exact") {
      nextWatchTime = movieData.watchTime || null;
    }

    if (movieData.watchDatePrecision === "year") {
      nextWatchTime = movieData.watchYear ? `${movieData.watchYear}-01-01` : null;
    }

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
    };

    payload.search_text = buildMovieSearchText({
      ...payload,
      external_meta: movieData.external_meta,
    });

    const { error } = await updateMovieById(id, payload);

    setIsLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    router.push("/");
  }

  async function handleDelete() {
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
              <ApproxTitle>Не помню точную дату</ApproxTitle>
              <ApproxHint>Указываю только год просмотра</ApproxHint>
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

        <CommentBlock>
          <CommentTop>
            <CommentTitleWrap>
              <Label>Comment</Label>
              <CommentHint>
                Write a quick raw note — AI can polish it and suggest tags.
              </CommentHint>
            </CommentTitleWrap>
          </CommentTop>

          <CommentTextArea
            value={movieData.comment}
            onChange={(e) =>
              setMovieData({ ...movieData, comment: e.target.value })
            }
            placeholder="Write a raw note, for example: strong atmosphere, a bit slow, great ending..."
          />

          <CommentActions>
            <ImproveButton
              type="button"
              onClick={handleImproveComment}
              disabled={isImprovingComment || !movieData.comment.trim()}
            >
              <Sparkles size={15} />
              {isImprovingComment ? "Improving..." : "Improve with AI"}
            </ImproveButton>
          </CommentActions>

          {aiCommentDraft && (
            <AiSuggestionBox>
              <SuggestionLabel>Suggested comment</SuggestionLabel>

              <CommentTextArea
                value={aiCommentDraft}
                onChange={(e) => setAiCommentDraft(e.target.value)}
              />

              <SuggestionLabel>
                Suggested tags — choose up to 3 ({selectedAiTags.length}/3)
              </SuggestionLabel>

              <TagOptions>
                {aiTagOptions.map((tag) => (
                  <TagOption
                    key={tag}
                    type="button"
                    $active={selectedAiTags.includes(tag)}
                    onClick={() => toggleAiTag(tag)}
                  >
                    {tag}
                  </TagOption>
                ))}
              </TagOptions>

              <SuggestionActions>
                <UseSuggestionButton
                  type="button"
                  onClick={applyAiSuggestion}
                  disabled={!aiCommentDraft.trim()}
                >
                  Use suggestion
                </UseSuggestionButton>

                <SecondaryButton
                  type="button"
                  onClick={() => {
                    setAiCommentDraft("");
                    setAiTagOptions([]);
                    setSelectedAiTags([]);
                  }}
                >
                  Discard
                </SecondaryButton>
              </SuggestionActions>
            </AiSuggestionBox>
          )}
        </CommentBlock>

        <TagsBlock>
          <Label>Tags</Label>

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
  transition: border-color 0.15s ease, background 0.15s ease,
    box-shadow 0.15s ease;

  &:hover {
    border-color: #111827;
    background: #f8fafc;
  }

  &:focus {
    outline: none;
    border-color: #111827;
    box-shadow: 0 0 0 4px rgba(17, 24, 39, 0.06);
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

  &:focus {
    border-color: #111827;
    box-shadow: 0 0 0 4px rgba(17, 24, 39, 0.06);
  }
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

  &:focus {
    border-color: #111827;
    box-shadow: 0 0 0 4px rgba(17, 24, 39, 0.06);
  }

  &::placeholder {
    color: #94a3b8;
  }
`;

const CommentActions = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-top: 12px;

  @media (max-width: 640px) {
    justify-content: stretch;
  }
`;

const ImproveButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-height: 38px;
  padding: 0 14px;
  border: 0;
  border-radius: 999px;
  background: #111827;
  color: #fff;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;

  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }

  @media (max-width: 640px) {
    width: 100%;
  }
`;

const AiSuggestionBox = styled.div`
  margin-top: 14px;
  padding: 14px;
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  background: #f8fafc;
`;

const SuggestionLabel = styled.div`
  margin: 12px 0 8px;
  color: #64748b;
  font-size: 13px;
  font-weight: 700;

  &:first-child {
    margin-top: 0;
  }
`;

const TagOptions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
`;

const TagOption = styled.button`
  padding: 7px 10px;
  border-radius: 999px;
  border: 1px solid ${({ $active }) => ($active ? "#111827" : "#d1d5db")};
  background: ${({ $active }) => ($active ? "#111827" : "#fff")};
  color: ${({ $active }) => ($active ? "#fff" : "#334155")};
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;

  &:hover {
    border-color: #111827;
  }
`;

const SuggestionActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
`;

const UseSuggestionButton = styled.button`
  min-height: 36px;
  padding: 0 14px;
  border: 0;
  border-radius: 999px;
  background: #111827;
  color: #fff;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;

  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }
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

const TagsBlock = styled.div`
  margin-bottom: 20px;
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

  &:hover {
    color: #111827;
  }
`;

const TagHint = styled.div`
  margin-top: 8px;
  color: #94a3b8;
  font-size: 13px;
`;