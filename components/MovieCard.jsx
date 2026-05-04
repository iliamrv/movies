import { useState } from "react";
import Link from "next/link";
import styled from "styled-components";
import { Film, Flame, Star, Clock3, Trash2, Copy } from "lucide-react";

import {
  getMovieTitle,
  getMovieOriginalTitle,
  getMovieDirector,
  getPrimaryGenre,
  getMoviePoster,
  getImdbRating,
  getRottenTomatoesRating,
  getDaysAgo,
} from "../src/utils/movieUtils";

export default function MovieCard({
  item,
  onEdit,
  onRemove,
  onPriorityChange,
  showActions = true,
}) {
  const [failedPosterSrc, setFailedPosterSrc] = useState("");
  const [copied, setCopied] = useState(false);

  const displayTitle = getMovieTitle(item);
  const originalTitle = getMovieOriginalTitle(item);
  const displayDirector = getMovieDirector(item);
  const primaryGenre = getPrimaryGenre(item);
  const imdbRating = getImdbRating(item);
  const rottenRating = getRottenTomatoesRating(item);

  const posterSrc = getMoviePoster({
    ...item,
    Poster:
      item?.Poster && item.Poster !== failedPosterSrc ? item.Poster : undefined,
    poster:
      item?.poster && item.poster !== failedPosterSrc ? item.poster : undefined,
    poster_url:
      item?.poster_url && item.poster_url !== failedPosterSrc
        ? item.poster_url
        : undefined,
    external_meta: {
      ...(item?.external_meta || {}),
      tmdb: {
        ...(item?.external_meta?.tmdb || {}),
        posterUrl:
          item?.external_meta?.tmdb?.posterUrl !== failedPosterSrc
            ? item?.external_meta?.tmdb?.posterUrl
            : undefined,
      },
    },
  });

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
    if (posterSrc) {
      setFailedPosterSrc(posterSrc);
    }

    item.onPosterError?.();
  }

  const daysAgo = getDaysAgo(item.watchTime);

  return (
    <Card>
      <PosterLink href={`/movies/${item.id}`}>
        {posterSrc ? (
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
          {imdbRating && <Badge>IMDb {imdbRating}</Badge>}
          {rottenRating && <Badge>RT {rottenRating}</Badge>}
        </Badges>

        {daysAgo !== null && <Meta>Added {daysAgo} days ago</Meta>}

        {showActions && (
          <Row>
            <Btn
              type="button"
              $active={item.priority === "high"}
              onClick={() => onPriorityChange?.("high")}
            >
              <Flame size={16} />
            </Btn>

            <Btn
              type="button"
              $active={item.priority === "medium" || !item.priority}
              onClick={() => onPriorityChange?.("medium")}
            >
              <Star size={16} />
            </Btn>

            <Btn
              type="button"
              $active={item.priority === "low"}
              onClick={() => onPriorityChange?.("low")}
            >
              <Clock3 size={16} />
            </Btn>

            <Remove type="button" onClick={onRemove}>
              <Trash2 size={16} />
            </Remove>
          </Row>
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

const Row = styled.div`
  display: flex;
  gap: 6px;
  margin-top: 10px;
`;

const Btn = styled.button`
  padding: 8px;
  border-radius: 8px;
  border: 1px solid #ddd;
  background: ${(p) => (p.$active ? "#111827" : "#fff")};
  color: ${(p) => (p.$active ? "#fff" : "#111827")};
  cursor: pointer;
`;

const Remove = styled(Btn)`
  color: #dc2626;
`;