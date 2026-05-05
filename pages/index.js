import { useEffect, useState } from "react";
import styled from "styled-components";
import { useRouter } from "next/router";

import Loading from "./loading";
import Table from "../components/Table";
import { Button } from "../styles/globalStyles";
import { getWatchedMovies } from "../src/api/movies";
const CACHE_KEY = "moviebase_watched_movies_cache";

export default function LibraryPage() {
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(false);
  const [movies, setMovies] = useState([]);


  function loadCachedMovies() {
    if (typeof window === "undefined") return;

    const cached = localStorage.getItem(CACHE_KEY);

    if (!cached) return;

    try {
      const parsed = JSON.parse(cached);

      if (Array.isArray(parsed)) {
        setMovies(parsed);
      }
    } catch (error) {
      console.warn("Failed to read movies cache:", error);
    }
  }

  useEffect(() => {
    loadCachedMovies();
    fetchMovies();
  }, []);

  async function fetchMovies() {
    setIsLoading(true);

    const { data, error } = await getWatchedMovies(5000);

    if (!error && data) {
      setMovies(data);

      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(data));
      } catch (error) {
        console.warn("Failed to save movies cache:", error);
      }
    }

    setIsLoading(false);
  }

  return (
    <PageWrap>
      <Header>
        <TitleWrap>
          <PageTitle>Movie Library</PageTitle>
          <PageText>Search, filter, and manage your watched movies</PageText>
        </TitleWrap>

        <Button type="button" onClick={() => router.push("/recent")}>
          Recently watched
        </Button>
      </Header>

      {isLoading && movies.length === 0 ? (
        <Loading />
      ) : (
        <TableArea $loading={isLoading}>
          <Table newItems={movies} />

          {isLoading && movies.length > 0 && (
            <SmallStatus>Updating...</SmallStatus>
          )}
        </TableArea>
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

const TableArea = styled.div`
  position: relative;
  opacity: ${({ $loading }) => ($loading ? 0.75 : 1)};
  transition: opacity 0.15s ease;
`;

const SmallStatus = styled.div`
  position: absolute;
  top: 12px;
  right: 12px;
  z-index: 5;
  padding: 6px 10px;
  border-radius: 999px;
  background: #111827;
  color: #fff;
  font-size: 12px;
  font-weight: 600;
  pointer-events: none;
`;