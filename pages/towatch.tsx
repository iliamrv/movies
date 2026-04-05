import { useState, useEffect } from "react";
import styled from "styled-components";
import supabase from "../src/supabase";
import Table from "../components/Table";
import Loading from "./loading";

export default function Page() {
  const db_name = `random_movies_2024`;

  const [isLoading, setIsLoading] = useState(false);
  const [newItems, setNewItems] = useState([]);

  const [prompt, setPrompt] = useState("Show me comedy films I will probably like");
  const [aiLoading, setAiLoading] = useState(false);
  const [tasteSummary, setTasteSummary] = useState("");
  const [recommendations, setRecommendations] = useState([]);
  const [aiError, setAiError] = useState("");

  
  useEffect(function () {
    async function getLPitems() {
      setIsLoading(true);

      const { data: movies, error } = await supabase
        .from(db_name)
        .select("*")
        .eq("watched_mark", false)
        .order("id", { ascending: false });

      if (!error) {
        setNewItems(movies || []);
      }

      setIsLoading(false);
    }

    getLPitems();
  }, []);

  async function handleFindRecommendations() {
    setAiLoading(true);
    setAiError("");
    setTasteSummary("");
    setRecommendations([]);

    try {
      const res = await fetch("/api/recommendations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query: prompt }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to get recommendations");
      }

      setTasteSummary(data.taste_summary || "");
      setRecommendations(data.recommendations || []);
    } catch (error: any) {
      setAiError(error.message || "Something went wrong");
    } finally {
      setAiLoading(false);
    }
  }

  return (
    <PageWrap>
      <AiBlock>
        <AiTitle>AI recommendations</AiTitle>
        <AiText>
          Ask for films based on your ratings and taste profile.
        </AiText>

        <AiRow>
          <AiInput
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Show me melancholic comedies from the 70s that I may like"
          />
          <AiButton onClick={handleFindRecommendations} disabled={aiLoading}>
            {aiLoading ? "Searching..." : "Find"}
          </AiButton>
        </AiRow>

        {aiError ? <AiError>{aiError}</AiError> : null}

        {tasteSummary ? (
          <TasteBox>
            <strong>Your taste:</strong> {tasteSummary}
          </TasteBox>
        ) : null}

        {recommendations.length > 0 ? (
          <RecoList>
         {recommendations.map((item, index) => (
  <RecoCard key={`${item.title}-${index}`}>
    <RecoTitle>
      {item.title}
      {item.year ? ` (${item.year})` : ""}
    </RecoTitle>

    {item.director ? (
      <RecoMeta>Director: {item.director}</RecoMeta>
    ) : null}

    {item.because_you_like_director ? (
      <RecoLine>
        <strong>Director match:</strong> {item.because_you_like_director}
      </RecoLine>
    ) : null}

    {item.similar_to?.length ? (
      <RecoLine>
        <strong>Closest in your collection:</strong>{" "}
        {item.similar_to.join(", ")}
      </RecoLine>
    ) : null}

    {item.match_factors?.length ? (
      <RecoLine>
        <strong>Why it fits:</strong>{" "}
        {item.match_factors.join(", ")}
      </RecoLine>
    ) : null}

    {item.why_this ? <RecoReason>{item.why_this}</RecoReason> : null}
  </RecoCard>
))}
          </RecoList>
        ) : null}
      </AiBlock>

      {isLoading ? <Loading /> : <Table newItems={newItems} />}
    </PageWrap>
  );
}

const PageWrap = styled.div`
  padding: 24px;
`;

const AiBlock = styled.div`
  margin-bottom: 28px;
  padding: 22px;
  border: 1px solid #e5e7eb;
  border-radius: 18px;
  background: #fff;
  box-shadow: 0 10px 30px rgba(17, 24, 39, 0.05);
`;

const AiTitle = styled.h2`
  margin: 0 0 8px;
  font-size: 1.35rem;
  color: #111827;
`;

const AiText = styled.p`
  margin: 0 0 16px;
  color: #6b7280;
`;

const AiRow = styled.div`
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
`;

const AiInput = styled.input`
  flex: 1;
  min-width: 280px;
  height: 46px;
  padding: 0 14px;
  border: 1px solid #d7dee8;
  border-radius: 12px;
  outline: none;

  &:focus {
    border-color: #b8c7dc;
    box-shadow: 0 0 0 4px rgba(191, 208, 229, 0.25);
  }
`;

const RecoLine = styled.div`
  margin-bottom: 8px;
  color: #475569;
  line-height: 1.45;
`;

const AiButton = styled.button`
  height: 46px;
  padding: 0 18px;
  border: 0;
  border-radius: 12px;
  background: #111827;
  color: #fff;
  font-weight: 600;
  cursor: pointer;

  &:disabled {
    opacity: 0.65;
    cursor: default;
  }
`;

const AiError = styled.div`
  margin-top: 14px;
  color: #b91c1c;
`;

const TasteBox = styled.div`
  margin-top: 18px;
  padding: 14px 16px;
  border-radius: 12px;
  background: #f8fafc;
  color: #334155;
  line-height: 1.5;
`;

const RecoList = styled.div`
  margin-top: 18px;
  display: grid;
  gap: 14px;
`;

const RecoCard = styled.div`
  padding: 16px;
  border: 1px solid #eef2f7;
  border-radius: 14px;
  background: #fcfcfd;
`;

const RecoTitle = styled.h3`
  margin: 0 0 8px;
  color: #111827;
  font-size: 1.05rem;
`;

const RecoMeta = styled.div`
  margin-bottom: 8px;
  color: #64748b;
  font-size: 0.95rem;
`;

const RecoReason = styled.p`
  margin: 0;
  color: #374151;
  line-height: 1.5;
`;