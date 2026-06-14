import { useState } from "react";
import styled from "styled-components";
import { useRouter } from "next/router";
import { CirclePlus, Search, Film, ArrowLeft } from "lucide-react";

import supabase from "../src/supabase";
import { Button } from "../styles/globalStyles";
import {
  buildWatchDatePayload,
  fetchMovieByImdbId,
} from "../src/utils/movieFormUtils";

export default function CreateMovie() {
  const router = useRouter();

  const [imdbID, setImdbID] = useState("");
  const [movieData, setMovieData] = useState({
    title: "",
    director: "",
    year: "",
    personalRating: "",
    comment: "",
    watchTime: new Date().toISOString().slice(0, 10),
    watchDatePrecision: "exact",
    watchYear: new Date().getFullYear().toString(),
    tags: [],
  });
  const [extraDetails, setExtraDetails] = useState({
    runtime: "",
    genre: "",
    ratings: [],
  });
  const [poster, setPoster] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  function updateField(field, value) {
    setMovieData((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  async function fetchMovieData() {
    setIsLoading(true);
    setError("");
    setSuccessMessage("");

    try {
      const cleanImdbID = imdbID.trim();
      const data = await fetchMovieByImdbId(cleanImdbID);

      if (!data) {
        setError("Movie not found");
        setIsLoading(false);
        return;
      }

      setMovieData((prev) => ({
        ...prev,
        title: data.Title || "",
        director: data.Director && data.Director !== "N/A" ? data.Director : "",
        year: data.Year || "",
        personalRating: "",
        comment: "",
        watchTime: prev.watchTime || new Date().toISOString().slice(0, 10),
        watchYear:
          prev.watchYear || data.Year || new Date().getFullYear().toString(),
      }));

      setExtraDetails({
        runtime: data.Runtime || "",
        genre: data.Genre || "",
        ratings: data.Ratings || [],
      });

      setPoster(data.Poster || "");
    } catch (fetchError) {
      console.error(fetchError);
      setError("Failed to fetch movie details");
    } finally {
      setIsLoading(false);
    }
  }

  function removeTag(tag) {
    setMovieData((prev) => ({
      ...prev,
      tags: prev.tags.filter((item) => item !== tag),
    }));
  }

  function addTagFromInput(value) {
    const cleanTag = String(value || "").trim().toLowerCase();

    if (!cleanTag) return;

    setMovieData((prev) => ({
      ...prev,
      tags: Array.from(new Set([...(prev.tags || []), cleanTag])),
    }));
  }

  async function handleSave() {
    setIsSaving(true);
    setError("");
    setSuccessMessage("");

    const cleanImdbID = imdbID.trim();
    const nextWatchTime = buildWatchDatePayload({
      watchDatePrecision: movieData.watchDatePrecision,
      watchTime: movieData.watchTime,
      watchYear: movieData.watchYear,
    });

    const movieEntry = {
      title: movieData.title.trim(),
      director: movieData.director.trim() || null,
      year: movieData.year ? Number(movieData.year) : null,
      watchTime: nextWatchTime,
      watch_date_precision: movieData.watchDatePrecision,
      imdb: cleanImdbID || null,
      comment: movieData.comment.trim() || null,
      rating:
        movieData.personalRating.trim() !== ""
          ? Math.round(Number(movieData.personalRating))
          : null,
      watched_mark: true,
      tags: Array.isArray(movieData.tags) ? movieData.tags : [],
    };

    try {
      const { data, error: insertError } = await supabase
        .from("movies_2024")
        .insert([movieEntry])
        .select("id, imdb")
        .single();

      if (insertError) {
        setError(insertError.message);
        setIsSaving(false);
        return;
      }

      if (data?.id && cleanImdbID) {
        try {
          const tmdbResponse = await fetch("/api/fetch-tmdb-meta", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              movieId: data.id,
            }),
          });

          const tmdbData = await tmdbResponse.json();

          if (!tmdbResponse.ok) {
            console.warn("TMDb meta fetch failed:", tmdbData);
          }
        } catch (tmdbError) {
          console.warn("TMDb meta fetch failed:", tmdbError);
        }
      }

      setSuccessMessage("Movie added successfully!");

      setTimeout(() => {
        if (data?.id) {
          router.push(`/movies/${data.id}`);
        } else {
          router.push("/");
        }
      }, 900);
    } catch (saveError) {
      console.error(saveError);
      setError("Failed to save movie details");
    } finally {
      setIsSaving(false);
    }
  }

  const canSave = movieData.title.trim() && !isSaving;

  return (
    <PageWrap>
      <Header>
        <TitleWrap>
          <BackButton type="button" onClick={() => router.push("/")}>
            <ArrowLeft size={16} />
            Back to Library
          </BackButton>

          <PageTitle>Add New Movie</PageTitle>
          <PageText>
            Fetch details from IMDb, adjust the fields, then save the movie to
            your library.
          </PageText>
        </TitleWrap>
      </Header>

      <Layout>
        <MainColumn>
          <Card>
            <CardHeader>
              <CardIcon>
                <Search size={18} />
              </CardIcon>

              <div>
                <CardTitle>Fetch by IMDb ID</CardTitle>
                <CardText>
                  Example: `tt0071360`. You can edit all fields before saving.
                </CardText>
              </div>
            </CardHeader>

            <InlineSearch>
              <Input
                type="text"
                placeholder="IMDb ID"
                value={imdbID}
                onChange={(e) => setImdbID(e.target.value)}
              />

              <PrimaryButton
                type="button"
                onClick={fetchMovieData}
                disabled={isLoading || !imdbID.trim()}
              >
                {isLoading ? "Fetching..." : "Fetch"}
              </PrimaryButton>
            </InlineSearch>
          </Card>

          <Card>
            <CardHeader>
              <CardIcon>
                <Film size={18} />
              </CardIcon>

              <div>
                <CardTitle>Movie details</CardTitle>
                <CardText>
                  Basic information saved to your movie database.
                </CardText>
              </div>
            </CardHeader>

            <FormGrid>
              <Field>
                <Label>Title</Label>
                <Input
                  type="text"
                  value={movieData.title}
                  onChange={(e) => updateField("title", e.target.value)}
                  placeholder="Movie title"
                />
              </Field>

              <Field>
                <Label>Director</Label>
                <Input
                  type="text"
                  value={movieData.director}
                  onChange={(e) => updateField("director", e.target.value)}
                  placeholder="Director"
                />
              </Field>

              <Field>
                <Label>Year</Label>
                <Input
                  type="text"
                  value={movieData.year}
                  onChange={(e) => {
                    updateField("year", e.target.value);

                    if (movieData.watchDatePrecision === "year") {
                      updateField("watchYear", e.target.value);
                    }
                  }}
                  placeholder="Year"
                />
              </Field>

              <Field>
                <Label>Your rating</Label>
                <Input
                  type="number"
                  min="0"
                  max="10"
                  value={movieData.personalRating}
                  onChange={(e) =>
                    updateField("personalRating", e.target.value)
                  }
                  placeholder="0-10"
                />
              </Field>

              <FullField>
                <Label>Watch date</Label>

                <ApproxDateCard
                  type="button"
                  $active={movieData.watchDatePrecision === "year"}
                  onClick={() => {
                    const nextIsYear =
                      movieData.watchDatePrecision !== "year";

                    setMovieData((prev) => ({
                      ...prev,
                      watchDatePrecision: nextIsYear ? "year" : "exact",
                      watchYear: nextIsYear
                        ? prev.watchYear ||
                          (prev.watchTime
                            ? String(prev.watchTime).slice(0, 4)
                            : "") ||
                          (prev.year ? String(prev.year) : "")
                        : prev.watchYear,
                    }));
                  }}
                >
                  <ApproxCheckbox
                    $active={movieData.watchDatePrecision === "year"}
                  >
                    {movieData.watchDatePrecision === "year" ? "✓" : ""}
                  </ApproxCheckbox>

                  <ApproxTextWrap>
                    <ApproxTitle>I do not remember the exact date</ApproxTitle>
                    <ApproxHint>I only want to save the watch year</ApproxHint>
                  </ApproxTextWrap>
                </ApproxDateCard>

                {movieData.watchDatePrecision === "year" ? (
                  <Input
                    type="number"
                    min="1900"
                    max="2100"
                    value={movieData.watchYear}
                    onChange={(e) => updateField("watchYear", e.target.value)}
                    placeholder={movieData.year ? String(movieData.year) : "2024"}
                  />
                ) : (
                  <Input
                    type="date"
                    value={movieData.watchTime}
                    onChange={(e) => {
                      updateField("watchTime", e.target.value);
                      updateField(
                        "watchYear",
                        e.target.value
                          ? e.target.value.slice(0, 4)
                          : movieData.watchYear
                      );
                    }}
                  />
                )}
              </FullField>

              <FullField>
                <Label>Comment</Label>
                <TextArea
                  value={movieData.comment}
                  onChange={(e) => updateField("comment", e.target.value)}
                  placeholder="Short personal note..."
                />
              </FullField>

              <FullField>
                <Label>Tags</Label>
                <TagInput
                  type="text"
                  placeholder="Add tag and press Enter"
                  onKeyDown={(event) => {
                    if (event.key !== "Enter") return;
                    event.preventDefault();
                    addTagFromInput(event.currentTarget.value);
                    event.currentTarget.value = "";
                  }}
                />

                {movieData.tags.length > 0 ? (
                  <CurrentTags>
                    {movieData.tags.map((tag) => (
                      <CurrentTag key={tag}>
                        {tag}
                        <RemoveTagButton
                          type="button"
                          onClick={() => removeTag(tag)}
                        >
                          ×
                        </RemoveTagButton>
                      </CurrentTag>
                    ))}
                  </CurrentTags>
                ) : (
                  <TagsHint>No tags yet</TagsHint>
                )}
              </FullField>
            </FormGrid>

            <Actions>
              <SaveButton type="button" onClick={handleSave} disabled={!canSave}>
                <CirclePlus size={16} />
                {isSaving ? "Saving..." : "Save Movie"}
              </SaveButton>
            </Actions>

            <Messages>
              {error && <ErrorMessage>{error}</ErrorMessage>}
              {successMessage && (
                <SuccessMessage>{successMessage}</SuccessMessage>
              )}
            </Messages>
          </Card>
        </MainColumn>

        <SideColumn>
          <PreviewCard>
            {poster && poster !== "N/A" ? (
              <Poster src={poster} alt="Movie poster" />
            ) : (
              <PosterPlaceholder>
                <Film size={34} />
                <span>No poster loaded</span>
              </PosterPlaceholder>
            )}

            <PreviewInfo>
              <PreviewTitle>{movieData.title || "Movie preview"}</PreviewTitle>

              <PreviewMeta>
                {[movieData.year, extraDetails.runtime]
                  .filter(Boolean)
                  .join(" · ") || "Fetch IMDb data to see details"}
              </PreviewMeta>

              <DetailsList>
                <DetailRow>
                  <span>Genre</span>
                  <strong>{extraDetails.genre || "-"}</strong>
                </DetailRow>

                <DetailRow>
                  <span>Director</span>
                  <strong>{movieData.director || "-"}</strong>
                </DetailRow>

                {extraDetails.ratings.map((rating, index) => (
                  <DetailRow key={`${rating.Source}-${index}`}>
                    <span>{rating.Source}</span>
                    <strong>{rating.Value}</strong>
                  </DetailRow>
                ))}
              </DetailsList>
            </PreviewInfo>
          </PreviewCard>
        </SideColumn>
      </Layout>
    </PageWrap>
  );
}

const PageWrap = styled.div`
  padding: 20px;
`;

const Header = styled.div`
  margin-bottom: 16px;
`;

const TitleWrap = styled.div``;

const BackButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 0;
  margin-bottom: 12px;
  border: 0;
  background: transparent;
  color: #64748b;
  font-size: 14px;
  cursor: pointer;

  &:hover {
    color: #111827;
  }
`;

const PageTitle = styled.h1`
  margin: 0;
`;

const PageText = styled.p`
  color: #6b7280;
  margin-top: 6px;
`;

const Layout = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) 280px;
  gap: 16px;
  align-items: start;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`;

const MainColumn = styled.div`
  display: grid;
  gap: 16px;
`;

const SideColumn = styled.div`
  position: sticky;
  top: 20px;

  @media (max-width: 900px) {
    position: static;
  }
`;

const Card = styled.div`
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  padding: 18px;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.04);
`;

const CardHeader = styled.div`
  display: flex;
  gap: 12px;
  align-items: flex-start;
  margin-bottom: 16px;
`;

const CardIcon = styled.div`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border-radius: 12px;
  background: #f1f5f9;
  color: #111827;
  flex: 0 0 auto;
`;

const CardTitle = styled.h2`
  margin: 0;
  font-size: 17px;
  line-height: 1.3;
`;

const CardText = styled.p`
  margin: 4px 0 0;
  color: #64748b;
  font-size: 14px;
  line-height: 1.45;
`;

const InlineSearch = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 10px;

  @media (max-width: 620px) {
    grid-template-columns: 1fr;
  }
`;

const Field = styled.div`
  display: grid;
  gap: 6px;
`;

const FullField = styled(Field)`
  grid-column: 1 / -1;
`;

const FormGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;

  @media (max-width: 620px) {
    grid-template-columns: 1fr;
  }
`;

const Label = styled.label`
  color: #475569;
  font-size: 13px;
  font-weight: 700;
`;

const Input = styled.input`
  width: 100%;
  padding: 11px 12px;
  border: 1px solid #d7dee8;
  border-radius: 12px;
  background: #fff;
  color: #111827;
  font-size: 14px;
  outline: none;

  &:focus {
    border-color: #b8c7dc;
    box-shadow: 0 0 0 4px rgba(191, 208, 229, 0.25);
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  min-height: 110px;
  padding: 11px 12px;
  border: 1px solid #d7dee8;
  border-radius: 12px;
  background: #fff;
  color: #111827;
  font-size: 14px;
  line-height: 1.5;
  resize: vertical;
  outline: none;
  font-family: inherit;

  &:focus {
    border-color: #b8c7dc;
    box-shadow: 0 0 0 4px rgba(191, 208, 229, 0.25);
  }
`;

const TagInput = styled(Input)``;

const ApproxDateCard = styled.button`
  display: flex;
  align-items: flex-start;
  gap: 10px;
  width: 100%;
  padding: 12px;
  margin-bottom: 8px;
  border-radius: 14px;
  border: 1px solid ${({ $active }) => ($active ? "#111827" : "#e5e7eb")};
  background: ${({ $active }) => ($active ? "#f8fafc" : "#fff")};
  color: inherit;
  text-align: left;
  cursor: pointer;

  &:hover {
    border-color: #111827;
  }
`;

const ApproxCheckbox = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: 7px;
  border: 1px solid ${({ $active }) => ($active ? "#111827" : "#cbd5e1")};
  background: ${({ $active }) => ($active ? "#111827" : "#fff")};
  color: #fff;
  font-size: 13px;
  font-weight: 800;
  flex: 0 0 auto;
`;

const ApproxTextWrap = styled.span`
  display: grid;
  gap: 2px;
`;

const ApproxTitle = styled.span`
  color: #111827;
  font-size: 14px;
  font-weight: 750;
`;

const ApproxHint = styled.span`
  color: #64748b;
  font-size: 13px;
`;

const CurrentTags = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
  margin-top: 10px;
`;

const CurrentTag = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 9px;
  border-radius: 999px;
  background: #eef2f7;
  color: #334155;
  font-size: 12px;
  font-weight: 700;
`;

const RemoveTagButton = styled.button`
  border: 0;
  background: transparent;
  color: #64748b;
  cursor: pointer;
  font-size: 15px;
  line-height: 1;
  padding: 0;

  &:hover {
    color: #111827;
  }
`;

const TagsHint = styled.div`
  color: #94a3b8;
  font-size: 13px;
  margin-top: 10px;
`;

const Actions = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-top: 18px;

  @media (max-width: 620px) {
    justify-content: stretch;
  }
`;

const PrimaryButton = styled(Button)`
  white-space: nowrap;
`;

const SaveButton = styled(Button)`
  display: inline-flex;
  align-items: center;
  gap: 8px;

  @media (max-width: 620px) {
    width: 100%;
    justify-content: center;
  }
`;

const Messages = styled.div`
  display: grid;
  gap: 8px;
  margin-top: 14px;
`;

const Message = styled.div`
  padding: 12px 14px;
  border-radius: 12px;
  font-size: 14px;
  line-height: 1.4;
`;

const SuccessMessage = styled(Message)`
  background: #dcfce7;
  color: #166534;
`;

const ErrorMessage = styled(Message)`
  background: #fef3c7;
  color: #92400e;
`;

const PreviewCard = styled.div`
  overflow: hidden;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.04);
`;

const Poster = styled.img`
  display: block;
  width: 100%;
  aspect-ratio: 2 / 3;
  object-fit: cover;
  background: #f1f5f9;
`;

const PosterPlaceholder = styled.div`
  display: grid;
  place-items: center;
  gap: 8px;
  width: 100%;
  aspect-ratio: 2 / 3;
  background: #f8fafc;
  color: #94a3b8;
  font-size: 14px;
  text-align: center;
`;

const PreviewInfo = styled.div`
  padding: 14px;
`;

const PreviewTitle = styled.div`
  color: #111827;
  font-weight: 750;
  line-height: 1.35;
`;

const PreviewMeta = styled.div`
  margin-top: 4px;
  color: #64748b;
  font-size: 13px;
  line-height: 1.35;
`;

const DetailsList = styled.div`
  display: grid;
  gap: 9px;
  margin-top: 14px;
`;

const DetailRow = styled.div`
  display: grid;
  gap: 4px;
  padding-top: 9px;
  border-top: 1px solid #f1f5f9;

  span {
    color: #94a3b8;
    font-size: 12px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }

  strong {
    color: #334155;
    font-size: 13px;
    font-weight: 650;
    line-height: 1.35;
  }
`;
