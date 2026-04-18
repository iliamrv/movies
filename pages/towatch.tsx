import { useEffect, useState } from "react";
import styled from "styled-components";
import supabase from "../src/supabase";
import Loading from "./loading";
import { useRouter } from "next/router";
import {
  Film,
  Flame,
  Star,
  Clock3,
  Trash2,
  RefreshCcw,
} from "lucide-react";

export default function Page() {
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(false);
  const [movies, setMovies] = useState([]);

  useEffect(() => {
    fetchMovies();
  }, []);

  function getMovieWeight(movie) {
    if (movie.priority === "high") return 6;
    if (movie.priority === "medium") return 3;
    if (movie.priority === "low") return 1;
    return 2;
  }

  function getWeightedRandomMovies(items, count = 8) {
    const result = [];
    const pool = [...items];

    while (result.length < count && pool.length > 0) {
      const totalWeight = pool.reduce(
        (sum, item) => sum + getMovieWeight(item),
        0
      );

      let random = Math.random() * totalWeight;

      for (let i = 0; i < pool.length; i++) {
        random -= getMovieWeight(pool[i]);

        if (random <= 0) {
          result.push(pool[i]);
          pool.splice(i, 1);
          break;
        }
      }
    }

    return result;
  }

  const fetchMovies = async () => {
    setIsLoading(true);

    const { data, error } = await supabase
      .from("movies_2024")
      .select("*")
      .eq("watched_mark", false);

    if (!error && data) {
      const selected = getWeightedRandomMovies(data, 8);

      const enriched = await Promise.all(
        selected.map(async (movie) => {
          if (!movie.imdb) return movie;

          try {
            const res = await fetch(
              `https://www.omdbapi.com/?i=${movie.imdb}&apikey=8aab931f`
            );
            const imdbData = await res.json();

            if (imdbData.Response === "True") {
              return { ...movie, ...imdbData, posterError: false };
            }
          } catch (e) {}

          return { ...movie, posterError: false };
        })
      );

      setMovies(enriched);
    }

    setIsLoading(false);
  };

  function getDaysAgo(date) {
    if (!date) return "?";
    const diff = Date.now() - new Date(date).getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  }

  function isStale(movie) {
    const days = getDaysAgo(movie.watchTime);
    return typeof days === "number" && days > 180;
  }

  function getPrimaryGenre(item) {
    if (!item.Genre || item.Genre === "N/A") return "";
    return item.Genre.split(",")[0]?.trim() || "";
  }

  function getImdbRating(item) {
    if (!item.imdbRating || item.imdbRating === "N/A") return "";
    return item.imdbRating;
  }

  function getRottenTomatoesRating(item) {
    if (!Array.isArray(item.Ratings)) return "";
    const rotten = item.Ratings.find(
      (rating) => rating.Source === "Rotten Tomatoes"
    );
    return rotten?.Value || "";
  }

  function markPosterError(id) {
    setMovies((prev) =>
      prev.map((movie) =>
        movie.id === id ? { ...movie, posterError: true } : movie
      )
    );
  }

  async function updatePriority(id, priority) {
    const { error } = await supabase
      .from("movies_2024")
      .update({ priority })
      .eq("id", id);

    if (error) return;

    setMovies((prev) =>
      prev.map((m) => (m.id === id ? { ...m, priority } : m))
    );
  }

  async function removeMovie(id) {
    const { error } = await supabase
      .from("movies_2024")
      .delete()
      .eq("id", id);

    if (error) return;

    setMovies((prev) => prev.filter((m) => m.id !== id));
  }

  const goToEdit = (id) => {
    router.push(`/edit-movie/${id}`);
  };

  return (
    <PageWrap>
      <Header>
        <TitleWrap>
          <PageTitle>To Watch</PageTitle>
          <PageText>8 random unwatched films from your database</PageText>
        </TitleWrap>

        <Reload onClick={fetchMovies} type="button">
          <RefreshCcw size={16} />
          New picks
        </Reload>
      </Header>

      {isLoading ? (
        <Loading />
      ) : (
        <Grid>
          {movies.map((item) => (
            <Card key={item.id}>
              <Poster onClick={() => goToEdit(item.id)} title={item.comment || ""}>
                {item.Poster &&
                item.Poster !== "N/A" &&
                !item.posterError ? (
                  <PosterImage
                    src={item.Poster}
                    alt={item.title || "Poster"}
                    onError={() => markPosterError(item.id)}
                  />
                ) : (
                  <Placeholder>
                    <Film size={34} />
                  </Placeholder>
                )}
              </Poster>

              <Body>
                <Title onClick={() => goToEdit(item.id)} title={item.comment || ""}>
                  {item.title} {item.year ? `(${item.year})` : ""}
                </Title>

                <Meta>{item.Director || item.director || "—"}</Meta>

                <BadgesRow>
                  {getPrimaryGenre(item) && (
                    <InfoBadge>{getPrimaryGenre(item)}</InfoBadge>
                  )}

                  {getImdbRating(item) && (
                    <InfoBadge>IMDb {getImdbRating(item)}</InfoBadge>
                  )}

                  {getRottenTomatoesRating(item) && (
                    <InfoBadge>RT {getRottenTomatoesRating(item)}</InfoBadge>
                  )}
                </BadgesRow>

                <Meta>Added {getDaysAgo(item.watchTime)} days ago</Meta>

                {isStale(item) && <Stale>Old item</Stale>}

                <PriorityRow>
                  <Btn
                    type="button"
                    $active={item.priority === "high"}
                    onClick={() => updatePriority(item.id, "high")}
                    title="High priority"
                  >
                    <Flame size={16} />
                  </Btn>

                  <Btn
                    type="button"
                    $active={item.priority === "medium" || !item.priority}
                    onClick={() => updatePriority(item.id, "medium")}
                    title="Medium priority"
                  >
                    <Star size={16} />
                  </Btn>

                  <Btn
                    type="button"
                    $active={item.priority === "low"}
                    onClick={() => updatePriority(item.id, "low")}
                    title="Low priority"
                  >
                    <Clock3 size={16} />
                  </Btn>

                  <RemoveBtn
                    type="button"
                    onClick={() => removeMovie(item.id)}
                    title="Remove movie"
                  >
                    <Trash2 size={16} />
                  </RemoveBtn>
                </PriorityRow>
              </Body>
            </Card>
          ))}
        </Grid>
      )}
    </PageWrap>
  );
}

const PageWrap = styled.div`
  padding: 20px;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 16px;

  @media (max-width: 700px) {
    flex-direction: column;
  }
`;

const TitleWrap = styled.div``;

const PageTitle = styled.h1`
  margin: 0;
`;

const PageText = styled.p`
  color: #6b7280;
  margin-top: 6px;
`;

const Reload = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #111827;
  color: white;
  padding: 8px 12px;
  border-radius: 10px;
  border: none;
  cursor: pointer;
  font-size: 14px;
  line-height: 1;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 16px;
`;

const Card = styled.div`
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  overflow: hidden;
  background: white;
  transition: transform 0.14s ease, box-shadow 0.14s ease;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 6px 14px rgba(15, 23, 42, 0.05);
  }
`;

const Poster = styled.div`
  height: 300px;
  background: #f3f4f6;
  cursor: pointer;
`;

const PosterImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
`;

const Placeholder = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #9ca3af;
`;

const Body = styled.div`
  padding: 12px;
`;

const Title = styled.div`
  font-weight: 600;
  cursor: pointer;
  line-height: 1.35;

  &:hover {
    text-decoration: underline;
    text-underline-offset: 2px;
  }
`;

const Meta = styled.div`
  font-size: 0.9rem;
  color: #6b7280;
  margin-top: 4px;
`;

const BadgesRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 8px;
`;

const InfoBadge = styled.div`
  display: inline-flex;
  align-items: center;
  min-height: 26px;
  padding: 4px 8px;
  border-radius: 999px;
  background: #f8fafc;
  border: 1px solid #e5e7eb;
  color: #475569;
  font-size: 0.82rem;
  line-height: 1;
`;

const Stale = styled.div`
  color: #dc2626;
  margin-top: 6px;
  font-size: 0.9rem;
`;

const PriorityRow = styled.div`
  display: flex;
  gap: 6px;
  margin-top: 10px;
`;

const Btn = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px;
  border-radius: 8px;
  border: 1px solid #ddd;
  background: ${(p) => (p.$active ? "#111827" : "#fff")};
  color: ${(p) => (p.$active ? "#fff" : "#111827")};
  cursor: pointer;
`;

const RemoveBtn = styled(Btn)`
  border: 1px solid rgba(220, 38, 38, 0.2);
  color: #dc2626;
  background: #fff;

  &:hover {
    background: #dc2626;
    color: #fff;
    border-color: #dc2626;
  }
`;