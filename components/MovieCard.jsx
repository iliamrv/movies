import { useState } from "react";
import Link from "next/link";
import styled from "styled-components";
import { Film, Flame, Star, Clock3, Trash2, Copy } from "lucide-react";

export default function MovieCard({
  item,
  onEdit,
  onRemove,
  onPriorityChange,
  showActions = true,
}) {
  const [failedPosterSrc, setFailedPosterSrc] = useState("");
  const [copied, setCopied] = useState(false);

  function getDisplayTitle() {
    const ruTitle = item.external_meta?.tmdb?.titles?.ru;
    return ruTitle || item.title || "";
  }

  function getOriginalTitle() {
    const displayTitle = getDisplayTitle();

    const originalTitle =
      item.external_meta?.tmdb?.titles?.original ||
      item.external_meta?.tmdb?.titles?.en ||
      item.title ||
      "";

    if (!originalTitle || originalTitle === displayTitle) {
      return "";
    }

    return originalTitle;
  }

  function getDisplayDirector() {
    const tmdbDirectors = item.external_meta?.tmdb?.directors;

    if (Array.isArray(tmdbDirectors) && tmdbDirectors.length > 0) {
      return tmdbDirectors
        .map((director) => director.name)
        .filter(Boolean)
        .join(", ");
    }

    return item.Director || item.director || "—";
  }

  function isValidPosterUrl(value) {
    if (!value || value === "N/A") return false;
    return /^https?:\/\//i.test(String(value));
  }

  function getPosterSrc() {
    const omdbPoster = item.Poster;
    const tmdbPoster = item.external_meta?.tmdb?.posterUrl;

    if (isValidPosterUrl(omdbPoster) && failedPosterSrc !== omdbPoster) {
      return omdbPoster;
    }

    if (isValidPosterUrl(tmdbPoster) && failedPosterSrc !== tmdbPoster) {
      return tmdbPoster;
    }

    return "";
  }

  function getPrimaryGenre() {
    if (item.Genre && item.Genre !== "N/A") {
      return item.Genre.split(",")[0]?.trim() || "";
    }

    const tmdbGenres = item.external_meta?.tmdb?.genres;

    if (Array.isArray(tmdbGenres) && tmdbGenres.length > 0) {
      return tmdbGenres[0];
    }

    return "";
  }

  function getImdbRating() {
    if (!item.imdbRating || item.imdbRating === "N/A") return "";
    return item.imdbRating;
  }

  function getRotten() {
    if (!Array.isArray(item.Ratings)) return "";

    const rottenRating = item.Ratings.find(
      (rating) => rating.Source === "Rotten Tomatoes"
    );

    return rottenRating?.Value || "";
  }

  function getDaysAgo() {
    if (!item.watchTime) return "?";

    const diff = Date.now() - new Date(item.watchTime).getTime();

    if (Number.isNaN(diff)) return "?";

    return Math.floor(diff / (1000 * 60 * 60 * 24));
  }

  async function handleCopyMovieInfo(e) {
    e.preventDefault();
    e.stopPropagation();

    const displayTitle = getDisplayTitle();
    const originalTitle = getOriginalTitle();
    const director = getDisplayDirector();
    const year = item.year || item.Year || "";
    const comment = item.comment || "";

    const titlePart = originalTitle
      ? `${displayTitle} / ${originalTitle}`
      : displayTitle;

    const textToCopy = [titlePart, director, year, comment]
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
    const currentPosterSrc = getPosterSrc();

    if (currentPosterSrc) {
      setFailedPosterSrc(currentPosterSrc);
    }

    item.onPosterError?.();
  }

  const posterSrc = getPosterSrc();
  const displayTitle = getDisplayTitle();
  const originalTitle = getOriginalTitle();
  const displayDirector = getDisplayDirector();

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
          {getPrimaryGenre() && <Badge>{getPrimaryGenre()}</Badge>}
          {getImdbRating() && <Badge>IMDb {getImdbRating()}</Badge>}
          {getRotten() && <Badge>RT {getRotten()}</Badge>}
        </Badges>

        <Meta>Added {getDaysAgo()} days ago</Meta>

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
  height: 300px;
  background: #f3f4f6;
  cursor: pointer;
  text-decoration: none;
  color: inherit;
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