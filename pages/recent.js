import { useEffect, useState } from "react";
import styled from "styled-components";
import { RefreshCcw, Table2 } from "lucide-react";
import { useRouter } from "next/router";

import Loading from "./loading";
import MovieCard from "../components/MovieCard";
import { Button } from "../styles/globalStyles";

import {

  getWatchedMovies,
} from "../src/api/movies";


export default function Page() {
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(false);
  const [movies, setMovies] = useState([]);

  useEffect(() => {
    fetchMovies();
  }, []);

  const fetchMovies = async () => {
    setIsLoading(true);

    const { data, error } = await getWatchedMovies(20);

    if (!error && data) {
      const enriched = data.map((movie) => ({
        ...movie,
        posterError: false,
      }));

      setMovies(enriched);
    }

    setIsLoading(false);
  };

  function markPosterError(id) {
    setMovies((prev) =>
      prev.map((movie) =>
        movie.id === id ? { ...movie, posterError: true } : movie
      )
    );
  }






  return (
    <PageWrap>
      <Header>
        <TitleWrap>
          <PageTitle>Watched Movies</PageTitle>
          <PageText>Last 20 watched movies in card view</PageText>
        </TitleWrap>

        <Controls>
          <Button type="button" onClick={() => router.push("/")}>
            <Table2 size={16} />
            Back to library
          </Button>

          <Reload onClick={fetchMovies} type="button">
            <RefreshCcw size={16} />
            Reload
          </Reload>
        </Controls>
      </Header>

      {isLoading ? (
        <Loading />
      ) : (
        <Grid>
          {movies.map((item) => (
            <MovieCard
              key={item.id}
              item={{
                ...item,
                onPosterError: () => markPosterError(item.id),
              }}
              showActions={false}
            />
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

const Controls = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
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