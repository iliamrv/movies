import { useState } from "react";
import { useRouter } from "next/router";
import styled from "styled-components";
import {
  CirclePlus,
  ArrowLeft,
  Database,
  Film,
  Star,
  Clock3,
} from "lucide-react";

import { Button, StyledButtons } from "../styles/globalStyles";
import supabase from "../src/supabase";

const TODAY = new Date().toISOString().slice(0, 10);

function extractImdbId(value) {
  const match = String(value || "").match(/tt\d{7,9}/);
  return match ? match[0] : "";
}

export default function CreateMovie() {
  const router = useRouter();

  const [mode, setMode] = useState("towatch");
  const [imdbInput, setImdbInput] = useState("");

  const [movieData, setMovieData] = useState({
    title: "",
    director: "",
    year: "",
    personalRating: "",
    comment: "",
    recommendedBy: "",
    priority: "medium",
    watchTime: TODAY,
  });

  const [extraDetails, setExtraDetails] = useState({
    runtime: "",
    genre: "",
    ratings: [],
    plot: "",
  });

  const [poster, setPoster] = useState("");
  const [omdbData, setOmdbData] = useState(null);

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [tmdbMessage, setTmdbMessage] = useState("");

  const isTowatch = mode === "towatch";

  function updateField(key, value) {
    setMovieData((prev) => ({
      ...prev,
      [key]: value,
    }));
  }

  function buildComment() {
    return [
      movieData.recommendedBy
        ? `Recommended by: ${movieData.recommendedBy}`
        : "",
      movieData.comment?.trim() || "",
    ]
      .filter(Boolean)
      .join("\n\n");
  }

  async function fetchMovieData() {
    const imdbID = extractImdbId(imdbInput);

    if (!imdbID) {
      setError("Enter a valid IMDb ID or IMDb URL");
      return;
    }

    setIsLoading(true);
    setError("");
    setSuccessMessage("");
    setTmdbMessage("");

    try {
      const response = await fetch(
        `https://www.omdbapi.com/?i=${imdbID}&apikey=8aab931f`
      );

      const data = await response.json();

      if (data.Response !== "True") {
        setError(data.Error || "Movie not found");
        return;
      }

      setOmdbData(data);

      setMovieData((prev) => ({
        ...prev,
        title: data.Title || "",
        director: data.Director && data.Director !== "N/A" ? data.Director : "",
        year: data.Year && data.Year !== "N/A" ? data.Year.slice(0, 4) : "",
      }));

      setExtraDetails({
        runtime: data.Runtime && data.Runtime !== "N/A" ? data.Runtime : "",
        genre: data.Genre && data.Genre !== "N/A" ? data.Genre : "",
        ratings: Array.isArray(data.Ratings) ? data.Ratings : [],
        plot: data.Plot && data.Plot !== "N/A" ? data.Plot : "",
      });

      setPoster(data.Poster && data.Poster !== "N/A" ? data.Poster : "");
    } catch (err) {
      setError("Failed to fetch movie details");
    } finally {
      setIsLoading(false);
    }
  }

  async function fetchTmdbMeta(movieId) {
    try {
      const response = await fetch("/api/fetch-tmdb-meta", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ movieId }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.warn("TMDb meta fetch failed:", data);
        setTmdbMessage("Movie saved, but TMDb metadata was not fetched.");
        return;
      }

      setTmdbMessage("TMDb metadata fetched successfully.");
    } catch (error) {
      console.warn("TMDb meta fetch failed:", error);
      setTmdbMessage("Movie saved, but TMDb metadata was not fetched.");
    }
  }

  async function handleSave(e) {
    e.preventDefault();

    if (!movieData.title.trim()) {
      setError("Title is required");
      return;
    }

    setIsSaving(true);
    setError("");
    setSuccessMessage("");
    setTmdbMessage("");

    const cleanImdbID = extractImdbId(imdbInput) || omdbData?.imdbID || "";

    const movieEntry = {
      title: movieData.title.trim(),
      director: movieData.director.trim() || null,
      year: movieData.year ? Number(movieData.year) : null,

      watched_mark: !isTowatch,
      watchTime: isTowatch ? TODAY : movieData.watchTime || TODAY,
      rating: isTowatch
        ? null
        : movieData.personalRating.trim() !== ""
        ? Number(movieData.personalRating)
        : null,
      priority: isTowatch ? movieData.priority : null,

      imdb: cleanImdbID || null,
      comment: buildComment() || null,

      Poster: poster || null,
      Genre: extraDetails.genre || null,
      Plot: extraDetails.plot || null,
      Runtime: extraDetails.runtime || null,
      imdbRating:
        omdbData?.imdbRating && omdbData.imdbRating !== "N/A"
          ? omdbData.imdbRating
          : null,
      Ratings: extraDetails.ratings.length ? extraDetails.ratings : null,
    };

    try {
      const { data, error } = await supabase
        .from("movies_2024")
        .insert([movieEntry])
        .select("id, imdb")
        .single();

      if (error) {
        setError(error.message);
        setIsSaving(false);
        return;
      }

      if (data?.id && cleanImdbID) {
        await fetchTmdbMeta(data.id);
      }

      setSuccessMessage("Movie added successfully!");

      setTimeout(() => {
        router.push(isTowatch ? "/towatch" : `/movies/${data.id}`);
      }, 800);
    } catch (error) {
      setError("Failed to save movie details");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <PageWrap>
      <Card>
        <Header>
          <div>
            <PageTitle>Add Movie</PageTitle>
            <PageText>
              Fetch data from IMDb, then save as watched or to your watchlist.
            </PageText>
          </div>

          <Button type="button" onClick={() => router.back()}>
            <ArrowLeft size={16} />
            Back
          </Button>
        </Header>

        <ModeSwitch>
          <ModeButton
            type="button"
            $active={isTowatch}
            onClick={() => setMode("towatch")}
          >
            <Clock3 size={16} />
            To Watch
          </ModeButton>

          <ModeButton
            type="button"
            $active={!isTowatch}
            onClick={() => setMode("watched")}
          >
            <Star size={16} />
            Watched
          </ModeButton>
        </ModeSwitch>

        <MainGrid>
          <Form onSubmit={handleSave}>
            <Section>
              <SectionTitle>IMDb fetch</SectionTitle>

              <FetchRow>
                <Input
                  type="text"
                  placeholder="tt0076740 or IMDb URL"
                  value={imdbInput}
                  onChange={(e) => setImdbInput(e.target.value)}
                />

                <Button
                  type="button"
                  onClick={fetchMovieData}
                  disabled={isLoading || !imdbInput.trim()}
                >
                  <Database size={16} />
                  {isLoading ? "Fetching..." : "Fetch IMDb"}
                </Button>
              </FetchRow>
            </Section>

            <Section>
              <SectionTitle>Movie info</SectionTitle>

              <Field>
                <Label>Title *</Label>
                <Input
                  value={movieData.title}
                  onChange={(e) => updateField("title", e.target.value)}
                  placeholder="Sorcerer / Колдун"
                />
              </Field>

              <Grid>
                <Field>
                  <Label>Director</Label>
                  <Input
                    value={movieData.director}
                    onChange={(e) => updateField("director", e.target.value)}
                    placeholder="William Friedkin"
                  />
                </Field>

                <Field>
                  <Label>Year</Label>
                  <Input
                    value={movieData.year}
                    onChange={(e) => updateField("year", e.target.value)}
                    placeholder="1977"
                    inputMode="numeric"
                  />
                </Field>
              </Grid>
            </Section>

            {isTowatch ? (
              <Section>
                <SectionTitle>Watchlist details</SectionTitle>

                <Field>
                  <Label>Recommended by</Label>
                  <Input
                    value={movieData.recommendedBy}
                    onChange={(e) =>
                      updateField("recommendedBy", e.target.value)
                    }
                    placeholder="Book, friend, article, Telegram..."
                  />
                </Field>

                <Field>
                  <Label>Priority</Label>
                  <SegmentedControl>
                    {["low", "medium", "high"].map((value) => (
                      <SegmentButton
                        key={value}
                        type="button"
                        $active={movieData.priority === value}
                        onClick={() => updateField("priority", value)}
                      >
                        {value}
                      </SegmentButton>
                    ))}
                  </SegmentedControl>
                </Field>
              </Section>
            ) : (
              <Section>
                <SectionTitle>Watched details</SectionTitle>

                <Grid>
                  <Field>
                    <Label>My rating</Label>
                    <Input
                      value={movieData.personalRating}
                      onChange={(e) =>
                        updateField("personalRating", e.target.value)
                      }
                      placeholder="8"
                      inputMode="numeric"
                    />
                  </Field>

                  <Field>
                    <Label>Watch date</Label>
                    <Input
                      type="date"
                      value={movieData.watchTime}
                      onChange={(e) => updateField("watchTime", e.target.value)}
                    />
                  </Field>
                </Grid>
              </Section>
            )}

            <Section>
              <Field>
                <Label>Comment / source URL</Label>
                <Textarea
                  value={movieData.comment}
                  onChange={(e) => updateField("comment", e.target.value)}
                  placeholder="Why interested, source link, notes..."
                />
              </Field>
            </Section>

            {error && <ErrorMessage>{error}</ErrorMessage>}
            {tmdbMessage && <TmdbMessage>{tmdbMessage}</TmdbMessage>}
            {successMessage && <SuccessMessage>{successMessage}</SuccessMessage>}

            <StyledButtons>
              <Button type="submit" disabled={isSaving}>
                <CirclePlus size={16} />
                {isSaving
                  ? "Saving..."
                  : isTowatch
                  ? "Add to To Watch"
                  : "Save Watched Movie"}
              </Button>
            </StyledButtons>
          </Form>

          <PreviewPanel>
            {poster ? (
              <Poster src={poster} alt={movieData.title || "Movie poster"} />
            ) : (
              <PosterPlaceholder>
                <Film size={36} />
                <span>No poster yet</span>
              </PosterPlaceholder>
            )}

            <PreviewTitle>{movieData.title || "Movie preview"}</PreviewTitle>

            <PreviewMeta>
              {movieData.year || "Year"} · {movieData.director || "Director"}
            </PreviewMeta>

            <InfoList>
              <InfoItem>
                <span>Runtime</span>
                <strong>{extraDetails.runtime || "—"}</strong>
              </InfoItem>

              <InfoItem>
                <span>Genre</span>
                <strong>{extraDetails.genre || "—"}</strong>
              </InfoItem>

              {extraDetails.ratings.map((rating) => (
                <InfoItem key={rating.Source}>
                  <span>{rating.Source}</span>
                  <strong>{rating.Value}</strong>
                </InfoItem>
              ))}
            </InfoList>
          </PreviewPanel>
        </MainGrid>
      </Card>
    </PageWrap>
  );
}

const PageWrap = styled.div`
  padding: 24px;
`;

const Card = styled.div`
  max-width: 1050px;
  margin: 0 auto;
  padding: 22px;
  border: 1px solid #e5e7eb;
  border-radius: 18px;
  background: #fff;
  box-shadow: 0 10px 30px rgba(17, 24, 39, 0.05);
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 18px;

  @media (max-width: 700px) {
    flex-direction: column;
  }
`;

const PageTitle = styled.h1`
  margin: 0;
  color: #111827;
`;

const PageText = styled.p`
  margin: 6px 0 0;
  color: #6b7280;
`;

const ModeSwitch = styled.div`
  display: inline-flex;
  padding: 4px;
  margin-bottom: 20px;
  border-radius: 14px;
  background: #f3f4f6;
`;

const ModeButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 7px;
  border: none;
  border-radius: 11px;
  padding: 9px 14px;
  cursor: pointer;
  background: ${({ $active }) => ($active ? "#111827" : "transparent")};
  color: ${({ $active }) => ($active ? "#fff" : "#4b5563")};
  font-weight: 650;
`;

const MainGrid = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) 280px;
  gap: 22px;
  align-items: start;

  @media (max-width: 860px) {
    grid-template-columns: 1fr;
  }
`;

const Form = styled.form`
  display: grid;
  gap: 16px;
`;

const Section = styled.section`
  display: grid;
  gap: 12px;
  padding: 16px;
  border: 1px solid #eef2f7;
  border-radius: 16px;
  background: #fcfcfd;
`;

const SectionTitle = styled.h2`
  margin: 0;
  font-size: 1rem;
  color: #111827;
`;

const FetchRow = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 10px;

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

const Field = styled.label`
  display: grid;
  gap: 7px;
`;

const Label = styled.span`
  color: #374151;
  font-size: 0.9rem;
  font-weight: 650;
`;

const Input = styled.input`
  width: 100%;
  padding: 11px 12px;
  border: 1px solid #d7dee8;
  border-radius: 12px;
  outline: none;
  font-size: 0.95rem;

  &:focus {
    border-color: #b8c7dc;
    box-shadow: 0 0 0 4px rgba(191, 208, 229, 0.25);
  }
`;

const Textarea = styled.textarea`
  width: 100%;
  min-height: 115px;
  padding: 11px 12px;
  border: 1px solid #d7dee8;
  border-radius: 12px;
  outline: none;
  resize: vertical;
  font-size: 0.95rem;
  line-height: 1.5;

  &:focus {
    border-color: #b8c7dc;
    box-shadow: 0 0 0 4px rgba(191, 208, 229, 0.25);
  }
`;

const SegmentedControl = styled.div`
  display: inline-flex;
  width: fit-content;
  padding: 4px;
  border-radius: 12px;
  background: #f3f4f6;
`;

const SegmentButton = styled.button`
  text-transform: capitalize;
  border: none;
  border-radius: 9px;
  padding: 8px 12px;
  cursor: pointer;
  background: ${({ $active }) => ($active ? "#111827" : "transparent")};
  color: ${({ $active }) => ($active ? "#fff" : "#4b5563")};
  font-size: 0.9rem;
`;

const PreviewPanel = styled.aside`
  position: sticky;
  top: 96px;
  padding: 14px;
  border: 1px solid #eef2f7;
  border-radius: 16px;
  background: #fcfcfd;

  @media (max-width: 860px) {
    position: static;
  }
`;

const Poster = styled.img`
  width: 100%;
  aspect-ratio: 2 / 3;
  object-fit: cover;
  object-position: center;
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

const PreviewTitle = styled.h3`
  margin: 12px 0 4px;
  color: #111827;
`;

const PreviewMeta = styled.div`
  color: #6b7280;
  font-size: 0.9rem;
`;

const InfoList = styled.div`
  display: grid;
  gap: 8px;
  margin-top: 14px;
`;

const InfoItem = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 10px;
  border-radius: 10px;
  background: #fff;
  font-size: 0.85rem;

  span {
    color: #6b7280;
  }

  strong {
    color: #111827;
    text-align: right;
  }
`;

const SuccessMessage = styled.div`
  padding: 12px 14px;
  border-radius: 12px;
  background: #dcfce7;
  color: #166534;
`;

const TmdbMessage = styled.div`
  padding: 12px 14px;
  border-radius: 12px;
  background: #dbeafe;
  color: #1e3a8a;
`;

const ErrorMessage = styled.div`
  padding: 12px 14px;
  border-radius: 12px;
  background: #fef3c7;
  color: #92400e;
`;