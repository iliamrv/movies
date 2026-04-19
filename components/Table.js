import { useMemo, useState } from "react";
import styled from "styled-components";
import { useRouter } from "next/router";
import { ChevronLeft, ChevronRight } from "lucide-react";

const PAGE_SIZE = 25;

export default function Table({ newItems = [] }) {
  const router = useRouter();

  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState("watchTime");
  const [sortDirection, setSortDirection] = useState("desc");
  const [page, setPage] = useState(1);

  function handleSort(key) {
    setPage(1);

    if (sortKey === key) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
      return;
    }

    setSortKey(key);
    setSortDirection("asc");
  }

  function getSortIndicator(key) {
    if (sortKey !== key) return "⇅";
    return sortDirection === "asc" ? "↑" : "↓";
  }

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    let items = !query
      ? [...newItems]
      : newItems.filter((item) => {
        const title = String(item.title || "").toLowerCase();
        const director = String(item.director || "").toLowerCase();
        const year = String(item.year || "").toLowerCase();

        return (
          title.includes(query) ||
          director.includes(query) ||
          year.includes(query)
        );
      });

    items.sort((a, b) => {
      let aValue = a?.[sortKey];
      let bValue = b?.[sortKey];

      if (sortKey === "title" || sortKey === "director") {
        aValue = String(aValue || "").toLowerCase();
        bValue = String(bValue || "").toLowerCase();
      }

      if (sortKey === "year" || sortKey === "rating") {
        aValue =
          aValue === null || aValue === undefined || aValue === ""
            ? -Infinity
            : Number(aValue);
        bValue =
          bValue === null || bValue === undefined || bValue === ""
            ? -Infinity
            : Number(bValue);
      }

      if (sortKey === "watchTime") {
        aValue = aValue ? new Date(aValue).getTime() : -Infinity;
        bValue = bValue ? new Date(bValue).getTime() : -Infinity;
      }

      if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });

    return items;
  }, [newItems, search, sortKey, sortDirection]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);

  const paginated = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    const end = start + PAGE_SIZE;
    return filtered.slice(start, end);
  }, [filtered, currentPage]);

  function renderRating(value) {
    if (value === null || value === undefined || value === "") {
      return <MutedPill>—</MutedPill>;
    }

    const rating = Number(value);

    if (Number.isNaN(rating)) {
      return <MutedPill>{String(value)}</MutedPill>;
    }

    if (rating >= 8) {
      return <RatingPill $tone="good">{rating}</RatingPill>;
    }

    if (rating <= 4) {
      return <RatingPill $tone="bad">{rating}</RatingPill>;
    }

    return <RatingPill $tone="neutral">{rating}</RatingPill>;
  }

  function openMovie(id) {
    router.push(`/movies/${id}`);
  }

  function handleSearchChange(e) {
    setSearch(e.target.value);
    setPage(1);
  }

  return (
    <Wrapper>
      <TopBar>
        <SearchInput
          placeholder="Search by title, director, year..."
          value={search}
          onChange={handleSearchChange}
        />

        <ResultCount>
          {filtered.length} {filtered.length === 1 ? "movie" : "movies"}
        </ResultCount>
      </TopBar>

      <TableContainer>
        <TableWrap>
          <thead>
            <tr>
              <SortableTh onClick={() => handleSort("title")}>
                Title <SortMark>{getSortIndicator("title")}</SortMark>
              </SortableTh>

              <SortableTh onClick={() => handleSort("director")}>
                Director <SortMark>{getSortIndicator("director")}</SortMark>
              </SortableTh>

              <SortableTh onClick={() => handleSort("year")}>
                Year <SortMark>{getSortIndicator("year")}</SortMark>
              </SortableTh>

              <SortableTh onClick={() => handleSort("rating")}>
                Rating <SortMark>{getSortIndicator("rating")}</SortMark>
              </SortableTh>

              <SortableTh onClick={() => handleSort("watchTime")}>
                Watch Time <SortMark>{getSortIndicator("watchTime")}</SortMark>
              </SortableTh>
            </tr>
          </thead>

          <tbody>
            {paginated.map((item) => (
              <TableRow key={item.id} onClick={() => openMovie(item.id)}>
                <TitleCell>{item.title || "—"}</TitleCell>
                <td>{item.director || "—"}</td>
                <td>{item.year || "—"}</td>
                <td>{renderRating(item.rating)}</td>
                <td>{item.watchTime || "—"}</td>
              </TableRow>
            ))}
          </tbody>
        </TableWrap>
      </TableContainer>

      <PaginationBar>
        <PageInfo>
          Page {currentPage} of {totalPages}
        </PageInfo>

        <PaginationControls>
          <PageButton
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft size={16} />
            Prev
          </PageButton>

          <PageButton
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            Next
            <ChevronRight size={16} />
          </PageButton>
        </PaginationControls>
      </PaginationBar>
    </Wrapper>
  );
}

const Wrapper = styled.div`
  width: 100%;
`;

const TopBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;

  @media (max-width: 700px) {
    flex-direction: column;
    align-items: stretch;
  }
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 12px 14px;
  border-radius: 12px;
  border: 1px solid #d7dee8;
  background: #fff;
  font-size: 14px;
  outline: none;

  &:focus {
    border-color: #b8c7dc;
    box-shadow: 0 0 0 4px rgba(191, 208, 229, 0.25);
  }
`;

const ResultCount = styled.div`
  white-space: nowrap;
  color: #64748b;
  font-size: 14px;
`;

const TableContainer = styled.div`
  width: 100%;
  max-height: 70vh;
  overflow: auto;
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  background: #fff;
`;

const TableWrap = styled.table`
  width: 100%;
  min-width: 760px;
  border-collapse: collapse;

  thead {
    background: #f9fafb;
  }

  th {
    position: sticky;
    top: 0;
    z-index: 2;
    background: #f9fafb;
  }

  td {
    padding: 14px 12px;
    font-size: 14px;
    color: #0f172a;
    border-bottom: 1px solid #f1f5f9;
    vertical-align: middle;
  }

  tbody tr:last-child td {
    border-bottom: none;
  }
`;

const SortableTh = styled.th`
  text-align: left;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.04em;
  color: #64748b;
  padding: 14px 12px;
  border-bottom: 1px solid #e5e7eb;
  text-transform: uppercase;
  cursor: pointer;
  user-select: none;
  white-space: nowrap;

  &:hover {
    background: #f3f4f6;
  }
`;

const SortMark = styled.span`
  margin-left: 6px;
  color: #94a3b8;
`;

const TableRow = styled.tr`
  cursor: pointer;

  &:hover {
    background: #fafafa;
  }
`;

const TitleCell = styled.td`
  font-weight: 500;
  max-width: 320px;
  word-break: break-word;
`;

const BasePill = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 34px;
  min-height: 28px;
  padding: 0 10px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 700;
`;

const RatingPill = styled(BasePill)`
  background: ${({ $tone }) => {
    if ($tone === "good") return "#b7e4c7";
    if ($tone === "bad") return "#f6c1c1";
    return "#e5e7eb";
  }};
  color: ${({ $tone }) => {
    if ($tone === "good") return "#083344";
    if ($tone === "bad") return "#7f1d1d";
    return "#334155";
  }};
`;

const MutedPill = styled(BasePill)`
  background: #f1f5f9;
  color: #94a3b8;
  font-weight: 600;
`;

const PaginationBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 14px;

  @media (max-width: 700px) {
    flex-direction: column;
    align-items: stretch;
  }
`;

const PageInfo = styled.div`
  color: #64748b;
  font-size: 14px;
`;

const PaginationControls = styled.div`
  display: flex;
  gap: 8px;
`;

const PageButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border-radius: 10px;
  border: 1px solid #d7dee8;
  background: #fff;
  color: #111827;
  cursor: pointer;
  font-size: 14px;

  &:disabled {
    opacity: 0.45;
    cursor: default;
  }
`;