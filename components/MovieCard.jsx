import styled from "styled-components";
import { Film, Flame, Star, Clock3, Trash2 } from "lucide-react";

export default function MovieCard({
  item,
  onEdit,
  onRemove,
  onPriorityChange,
}) {
  function getPrimaryGenre() {
    if (!item.Genre || item.Genre === "N/A") return "";
    return item.Genre.split(",")[0]?.trim() || "";
  }

  function getImdbRating() {
    if (!item.imdbRating || item.imdbRating === "N/A") return "";
    return item.imdbRating;
  }

  function getRotten() {
    if (!Array.isArray(item.Ratings)) return "";
    const r = item.Ratings.find(
      (x) => x.Source === "Rotten Tomatoes"
    );
    return r?.Value || "";
  }

  function getDaysAgo() {
    if (!item.watchTime) return "?";
    const diff = Date.now() - new Date(item.watchTime).getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  }

  return (
    <Card>
      <Poster onClick={onEdit}>
        {item.Poster && item.Poster !== "N/A" && !item.posterError ? (
          <PosterImage
            src={item.Poster}
            onError={() => item.onPosterError?.()}
          />
        ) : (
          <Placeholder>
            <Film size={34} />
          </Placeholder>
        )}
      </Poster>

      <Body>
        <Title onClick={onEdit}>
          {item.title} {item.year ? `(${item.year})` : ""}
        </Title>

        <Meta>{item.Director || item.director || "—"}</Meta>

        <Badges>
          {getPrimaryGenre() && <Badge>{getPrimaryGenre()}</Badge>}
          {getImdbRating() && <Badge>IMDb {getImdbRating()}</Badge>}
          {getRotten() && <Badge>RT {getRotten()}</Badge>}
        </Badges>

        <Meta>Added {getDaysAgo()} days ago</Meta>

        <Row>
          <Btn
            $active={item.priority === "high"}
            onClick={() => onPriorityChange("high")}
          >
            <Flame size={16} />
          </Btn>

          <Btn
            $active={item.priority === "medium" || !item.priority}
            onClick={() => onPriorityChange("medium")}
          >
            <Star size={16} />
          </Btn>

          <Btn
            $active={item.priority === "low"}
            onClick={() => onPriorityChange("low")}
          >
            <Clock3 size={16} />
          </Btn>

          <Remove onClick={onRemove}>
            <Trash2 size={16} />
          </Remove>
        </Row>
      </Body>
    </Card>
  );
}

const Card = styled.div`
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  overflow: hidden;
  background: white;

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
`;

const Remove = styled(Btn)`
  color: #dc2626;
`;