import { useEffect, useState } from "react";
import styled from "styled-components";
import { Table2, ArrowLeft } from "lucide-react";
import { useRouter } from "next/router";

import Loading from "./loading";
import Table from "../components/Table";
import { Button } from "../styles/globalStyles";
import { getWatchedMovies } from "../src/api/movies";

export default function LibraryPage() {
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(false);
  const [movies, setMovies] = useState([]);

  useEffect(() => {
    fetchMovies();
  }, []);

  const fetchMovies = async () => {
    setIsLoading(true);

    const { data, error } = await getWatchedMovies(5000);

    if (!error) {
      setMovies(data || []);
    }

    setIsLoading(false);
  };

  return (
    <PageWrap>
      <Header>
        <TitleWrap>
          <PageTitle>
            <Table2 size={20} />
            Full Library
          </PageTitle>
          <PageText>
            Full watched database in table view with search and old data
          </PageText>
        </TitleWrap>

        <Button type="button" onClick={() => router.push("/")}>
          <ArrowLeft size={16} />
          Back to cards
        </Button>
      </Header>

      {isLoading ? <Loading /> : <Table newItems={movies} />}
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
  display: flex;
  align-items: center;
  gap: 8px;
`;

const PageText = styled.p`
  color: #6b7280;
  margin-top: 6px;
`;