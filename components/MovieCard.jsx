import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import styled from "styled-components";
import { Film, Trash2, Copy } from "lucide-react";

import { getPosterCandidates } from "../src/utils/posterUtils";

import {
  getMovieTitle,
  getMovieOriginalTitle,
  getMovieDirector,
  getPrimaryGenre,
  getImdbRating,
  getRottenTomatoesRating,
  getMovieRating,
  getDaysAgo,
} from "../src/utils/movieUtils";

export default function MovieCard({
  item,
  onEdit,
  onRemove,
  onPriorityChange,
  showActions = true,
  showPersonalRating = false,
}) {
  const [posterIndex, setPosterIndex] = useState(0);
  const [posterFailed, setPosterFailed] = useState(false);
  const [copied, setCopied] = useState(false);

  const displayTitle = getMovieTitle(item);
  const originalTitle = getMovieOriginalTitle(item);
  const displayDirector = getMovieDirector(item);
  const primaryGenre = getPrimaryGenre(item);
  const imdbRating = getImdbRating(item);
  const rottenRating = getRottenTomatoesRating(item);
  const personalRating = getMovieRating(item);

  const posterCandidates = useMemo(() => getPosterCandidates(item), [item]);
  const posterSrc = posterCandidates[posterIndex]?.url || "";

  useEffect(() => {
    setPosterIndex(0);
    setPosterFailed(false);
  }, [item?.id, posterCandidates.length]);

  async function handleCopyMovieInfo(e) {
    e.preventDefault();
    e.stopPropagation();

    const year = item.year || item.Year || "";
    const comment = item.comment || "";

    const titlePart = originalTitle
      ? `${displayTitle} / ${originalTitle}`
      : displayTitle;

    const textToCopy = [titlePart, displayDirector, year, comment]
      .filter(Boolean)
      .join(" - ");

    try {
      await navigator.clipboard.writeText(textToCopy);

      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 1200);
    } catch (error) {
      console.error("Failed to copy movie info:", error);
    }
  }

  function handlePosterError() {
    const nextIndex = posterIndex + 1;

    if (nextIndex < posterCandidates.length) {
      setPosterIndex(nextIndex);
      return;
    }

    setPosterFailed(true);
    item.onPosterError?.();
  }

  const daysAgo = getDaysAgo(item.watchTime);

  return (
    <Card>
      <PosterLink href={`/movies/${item.id}`}>
        {posterSrc && !posterFailed ? (
          <PosterImage
            src={posterSrc}
            alt={displayTitle || "Movie poster"}
            onError={handlePosterError}
          />
        ) : (
          <Placeholder>
            <Film size={34} />
          </Placeholder>
        )}
      </PosterLink>

      <Body>
        <TitleRow>
          <TitleBlock>
            <TitleLink href={`/movies/${item.id}`}>
              {displayTitle} {item.year ? `(${item.year})` : ""}
            </TitleLink>

            {originalTitle && <OriginalTitle>{originalTitle}</OriginalTitle>}
          </TitleBlock>

          <CopyWrap>
            <CopyButton
              type="button"
              onClick={handleCopyMovieInfo}
              aria-label="Copy movie info"
              title="Copy movie info"
            >
              <Copy size={15} />
            </CopyButton>

            {copied && <CopiedBadge>Copied</CopiedBadge>}
          </CopyWrap>
        </TitleRow>

        <Meta>{displayDirector}</Meta>

        <Badges>
          {primaryGenre && <Badge>{primaryGenre}</Badge>}
          {showPersonalRating && personalRating !== "" && (
            <PersonalBadge>My {personalRating}/10</PersonalBadge>
          )}
          {imdbRating && <Badge>IMDb {imdbRating}</Badge>}
          {rottenRating && <Badge>RT {rottenRating}</Badge>}
        </Badges>

        {daysAgo !== null && <Meta>Added {daysAgo} days ago</Meta>}

        {showActions && (
      <PriorityRow>
  <PriorityDotButton
    type="button"
    $tone="high"
    $active={item.priority === "high"}
    onClick={() => onPriorityChange?.("high")}
    title="High priority"
    aria-label="High priority"
  >
    <PriorityDot $tone="high" $active={item.priority === "high"} />
  </PriorityDotButton>

  <PriorityDotButton
    type="button"
    $tone="medium"
    $active={item.priority === "medium" || !item.priority}
    onClick={() => onPriorityChange?.("medium")}
    title="Medium priority"
    aria-label="Medium priority"
  >
    <PriorityDot
      $tone="medium"
      $active={item.priority === "medium" || !item.priority}
    />
  </PriorityDotButton>

  <PriorityDotButton
    type="button"
    $tone="low"
    $active={item.priority === "low"}
    onClick={() => onPriorityChange?.("low")}
    title="Low priority"
    aria-label="Low priority"
  >
    <PriorityDot $tone="low" $active={item.priority === "low"} />
  </PriorityDotButton>

  <Remove type="button" onClick={onRemove} title="Remove">
    <Trash2 size={16} />
  </Remove>
</PriorityRow>
        )}
      </Body>
    </Card>
  );
}

const Card = styled.div`
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  overflow: hidden;
  background: white;
  transition: transform 0.15s ease, box-shadow 0.15s ease;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 6px 14px rgba(15, 23, 42, 0.05);
  }
`;

const PosterLink = styled(Link)`
  display: block;
  aspect-ratio: 2 / 3;
  background: #f3f4f6;
  cursor: pointer;
  text-decoration: none;
  color: inherit;
`;

const PosterImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
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

const TitleRow = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
`;

const TitleBlock = styled.div`
  min-width: 0;
`;

const TitleLink = styled(Link)`
  font-weight: 600;
  color: inherit;
  text-decoration: none;
  line-height: 1.35;

  &:hover {
    text-decoration: underline;
  }
`;

const OriginalTitle = styled.div`
  margin-top: 2px;
  color: #6b7280;
  font-size: 0.8rem;
  line-height: 1.25;
`;

const CopyWrap = styled.div`
  position: relative;
  flex-shrink: 0;
`;

const CopyButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #fff;
  color: #6b7280;
  cursor: pointer;

  &:hover {
    background: #f9fafb;
    color: #111827;
  }
`;

const CopiedBadge = styled.div`
  position: absolute;
  top: -28px;
  right: 0;
  padding: 4px 7px;
  border-radius: 999px;
  background: #111827;
  color: #fff;
  font-size: 11px;
  font-weight: 500;
  white-space: nowrap;
  pointer-events: none;
`;

const Meta = styled.div`
  font-size: 0.9rem;
  color: #6b7280;
  margin-top: 4px;
`;

const Badges = styled.div`
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin-top: 8px;
`;

const Badge = styled.div`
  font-size: 0.8rem;
  padding: 4px 8px;
  border-radius: 999px;
  border: 1px solid #e5e7eb;
`;

const PersonalBadge = styled(Badge)`
  border-color: #111827;
  background: #111827;
  color: #fff;
  font-weight: 700;
`;

const PriorityRow = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 10px;
  flex-wrap: wrap;
`;

const Remove = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 999px;
  border: 1px solid #fee2e2;
  background: #fff;
  color: #dc2626;
  cursor: pointer;

  &:hover {
    background: #fef2f2;
    border-color: #fecaca;
  }
`;

const PriorityDotButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  padding: 0;
  border-radius: 999px;
  border: 1px solid
    ${({ $active, $tone }) => {
      if (!$active) return "#e5e7eb";
      if ($tone === "high") return "#86efac";
      if ($tone === "medium") return "#fcd34d";
      return "#cbd5e1";
    }};
  background: ${({ $active, $tone }) => {
    if (!$active) return "#fff";
    if ($tone === "high") return "#f0fdf4";
    if ($tone === "medium") return "#fffbeb";
    return "#f8fafc";
  }};
  cursor: pointer;
  box-shadow: none;
  transition: border-color 0.15s ease, background 0.15s ease;

  &:hover {
    border-color: ${({ $tone }) => {
      if ($tone === "high") return "#4ade80";
      if ($tone === "medium") return "#fbbf24";
      return "#94a3b8";
    }};
  }
`;

const PriorityDot = styled.span`
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: ${({ $tone }) => {
    if ($tone === "high") return "#22c55e";
    if ($tone === "medium") return "#f59e0b";
    return "#94a3b8";
  }};
  opacity: ${({ $active }) => ($active ? 1 : 0.28)};
  flex: 0 0 auto;
`;
