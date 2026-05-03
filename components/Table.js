import { useMemo, useState } from "react";
import Link from "next/link";
import styled from "styled-components";
import { ChevronLeft, ChevronRight } from "lucide-react";

const PAGE_SIZE = 25;

const QUICK_FILTERS = [
  { value: "all", label: "All" },
  { value: "no_rating", label: "No rating" },

  { value: "imdb_missing", label: "IMDb missing" },
  { value: "tmdb_missing", label: "TMDb missing" },
  { value: "high_rated", label: "High rated 8+" },
  { value: "no_watch_date", label: "No watch date" },
];

function getTmdbYear(item) {
  const releaseDate = item.external_meta?.tmdb?.releaseDate;

  if (!releaseDate) return "—";

  const match = String(releaseDate).match(/\d{4}/);

  return match ? match[0] : "—";
}

function normalizeSearchText(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/ё/g, "е")
    .replace(/[“”«»]/g, '"')
    .replace(/[’‘]/g, "'")
    .replace(/[^a-zа-я0-9\s'-]/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getTmdbMeta(item) {
  return item.external_meta?.tmdb || {};
}

function getAlternativeTitles(tmdb) {
  if (!Array.isArray(tmdb.alternativeTitles)) {
    return [];
  }

  return tmdb.alternativeTitles
    .map((item) => item?.title)
    .filter(Boolean);
}

function getRuAlternativeTitles(tmdb) {
  if (!Array.isArray(tmdb.ruAlternativeTitles)) {
    return [];
  }

  return tmdb.ruAlternativeTitles.filter(Boolean);
}

function getGenres(tmdb) {
  return Array.isArray(tmdb.genres) ? tmdb.genres.filter(Boolean) : [];
}

function getDirectorsFromTmdb(tmdb) {
  if (!Array.isArray(tmdb.directors)) {
    return [];
  }

  return tmdb.directors
    .flatMap((person) => [person?.name, person?.originalName])
    .filter(Boolean);
}

function getCastFromTmdb(tmdb) {
  if (!Array.isArray(tmdb.cast)) {
    return [];
  }

  return tmdb.cast
    .flatMap((person) => [
      person?.name,
      person?.originalName,
      person?.character,
    ])
    .filter(Boolean);
}

function getStrictSearchText(item) {
  return [
    item.title,
    item.director,
    item.year,
    item.imdb,
  ]
    .filter(Boolean)
    .map(normalizeSearchText)
    .join(" ");
}

function getExtendedSearchText(item) {
  const tmdb = getTmdbMeta(item);

  return [
    item.title,
    item.director,
    item.year,
    item.rating,
    item.watchTime,
    item.comment,
    item.imdb,

    tmdb.titles?.ru,
    tmdb.titles?.en,
    tmdb.titles?.original,

    tmdb.overview?.ru,
    tmdb.overview?.en,

    tmdb.releaseDate,
    tmdb.originalLanguage,
    tmdb.runtime,

    ...getAlternativeTitles(tmdb),
    ...getRuAlternativeTitles(tmdb),
    ...getGenres(tmdb),
    ...getDirectorsFromTmdb(tmdb),
    ...getCastFromTmdb(tmdb),
  ]
    .filter(Boolean)
    .map(normalizeSearchText)
    .join(" ");
}

function hasNoRating(item) {
  return item.rating === null || item.rating === undefined || item.rating === "";
}

function hasNoWatchDate(item) {
  return !item.watchTime;
}



function applyQuickFilter(items, quickFilter) {
  if (quickFilter === "no_rating") {
    return items.filter(hasNoRating);
  }



  if (quickFilter === "imdb_missing") {
    return items.filter((item) => !item.imdb);
  }

  if (quickFilter === "tmdb_missing") {
    return items.filter((item) => !item.external_meta?.tmdb);
  }

  if (quickFilter === "high_rated") {
    return items.filter((item) => Number(item.rating) >= 8);
  }

  if (quickFilter === "no_watch_date") {
    return items.filter(hasNoWatchDate);
  }

  return items;
}

function getSecondaryTitle(item) {
  const tmdb = getTmdbMeta(item);
  const currentTitle = normalizeSearchText(item.title);

  const ruTitle = tmdb.titles?.ru || "";
  const enTitle = tmdb.titles?.en || "";
  const originalTitle = tmdb.titles?.original || "";

  const candidates = [ruTitle, originalTitle, enTitle].filter(Boolean);

  return (
    candidates.find((title) => normalizeSearchText(title) !== currentTitle) ||
    ""
  );
}

function getTitleMetaLine(item) {
  const tmdb = getTmdbMeta(item);

  const secondaryTitle = getSecondaryTitle(item);
  const genres = getGenres(tmdb).slice(0, 2);
  const cast = Array.isArray(tmdb.cast)
    ? tmdb.cast
      .slice(0, 2)
      .map((person) => person?.name)
      .filter(Boolean)
    : [];

  const parts = [
    secondaryTitle,
    genres.length ? genres.join(", ") : "",
    cast.length ? cast.join(", ") : "",
  ].filter(Boolean);

  return parts.join(" · ");
}

export default function Table({ newItems = [] }) {
  const [search, setSearch] = useState("");
  const [searchMode, setSearchMode] = useState("strict");
  const [quickFilter, setQuickFilter] = useState("all");
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

  function handleSearchChange(e) {
    setSearch(e.target.value);
    setPage(1);
  }

  function handleSearchModeChange(mode) {
    setSearchMode(mode);
    setPage(1);
  }

  function handleQuickFilterChange(filter) {
    setQuickFilter(filter);
    setPage(1);
  }

  const filtered = useMemo(() => {
    const query = normalizeSearchText(search);

    let items = [...newItems];

    if (query) {
      items = items.filter((item) => {
        const searchText =
          searchMode === "extended"
            ? getExtendedSearchText(item)
            : getStrictSearchText(item);

        return searchText.includes(query);
      });
    }

    items = applyQuickFilter(items, quickFilter);

    items.sort((a, b) => {
      let aValue = a?.[sortKey];
      let bValue = b?.[sortKey];

      if (sortKey === "title" || sortKey === "director") {
        aValue = String(aValue || "").toLowerCase();
        bValue = String(bValue || "").toLowerCase();
      }

      if (sortKey === "year") {
        aValue = Number(getTmdbYear(a));
        bValue = Number(getTmdbYear(b));

        aValue = Number.isNaN(aValue) ? -Infinity : aValue;
        bValue = Number.isNaN(bValue) ? -Infinity : bValue;
      }

      if (sortKey === "rating") {
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
  }, [newItems, search, searchMode, quickFilter, sortKey, sortDirection]);

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

  return (
    <Wrapper>
      <TopBar>
        <SearchInput
          placeholder={
            searchMode === "extended"
              ? "Extended search: title, RU title, cast, genre, comment..."
              : "Strict search: title, director, year, IMDb..."
          }
          value={search}
          onChange={handleSearchChange}
        />

        <ResultCount>
          {filtered.length} {filtered.length === 1 ? "movie" : "movies"}
        </ResultCount>
      </TopBar>

      <Toolbar>
        <ToolbarGroup>
          <ToolbarLabel>Search mode</ToolbarLabel>

          <SegmentedControl>
            <SegmentButton
              type="button"
              $active={searchMode === "strict"}
              onClick={() => handleSearchModeChange("strict")}
            >
              Strict
            </SegmentButton>

            <SegmentButton
              type="button"
              $active={searchMode === "extended"}
              onClick={() => handleSearchModeChange("extended")}
            >
              Extended
            </SegmentButton>
          </SegmentedControl>
        </ToolbarGroup>

        <ToolbarGroup>
          <ToolbarLabel>Quick filters</ToolbarLabel>

          <FilterChips>
            {QUICK_FILTERS.map((filter) => (
              <FilterChip
                key={filter.value}
                type="button"
                $active={quickFilter === filter.value}
                onClick={() => handleQuickFilterChange(filter.value)}
              >
                {filter.label}
              </FilterChip>
            ))}
          </FilterChips>
        </ToolbarGroup>
      </Toolbar>

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
            {paginated.map((item) => {
              const titleMetaLine = getTitleMetaLine(item);

              return (
                <TableRow key={item.id}>
                  <TitleCell>
                    <MovieLink href={`/movies/${item.id}`}>
                      {item.title || "—"}
                    </MovieLink>

                    {titleMetaLine && (
                      <TitleMetaLine>{titleMetaLine}</TitleMetaLine>
                    )}
                  </TitleCell>

                  <td>{item.director || "—"}</td>
                  <td>{getTmdbYear(item)}</td>
                  <td>{renderRating(item.rating)}</td>
                  <td>{item.watchTime || "—"}</td>
                </TableRow>
              );
            })}
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
  margin-bottom: 12px;

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

const Toolbar = styled.div`
  display: grid;
  gap: 10px;
  margin-bottom: 14px;
`;

const ToolbarGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
`;

const ToolbarLabel = styled.div`
  color: #64748b;
  font-size: 13px;
  font-weight: 600;
  min-width: 88px;
`;

const SegmentedControl = styled.div`
  display: inline-flex;
  padding: 3px;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  background: #f8fafc;
`;

const SegmentButton = styled.button`
  padding: 7px 11px;
  border: 0;
  border-radius: 9px;
  background: ${({ $active }) => ($active ? "#111827" : "transparent")};
  color: ${({ $active }) => ($active ? "#fff" : "#475569")};
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;

  &:hover {
    background: ${({ $active }) => ($active ? "#111827" : "#eef2f7")};
  }
`;

const FilterChips = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
`;

const FilterChip = styled.button`
  padding: 7px 10px;
  border: 1px solid ${({ $active }) => ($active ? "#111827" : "#e5e7eb")};
  border-radius: 999px;
  background: ${({ $active }) => ($active ? "#111827" : "#fff")};
  color: ${({ $active }) => ($active ? "#fff" : "#475569")};
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;

  &:hover {
    border-color: #111827;
  }
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
  &:hover {
    background: #fafafa;
  }
`;

const TitleCell = styled.td`
  font-weight: 500;
  max-width: 380px;
  word-break: break-word;
`;

const MovieLink = styled(Link)`
  display: inline-block;
  color: inherit;
  text-decoration: none;
  font-weight: 650;
  line-height: 1.35;

  &:hover {
    text-decoration: underline;
  }
`;

const TitleMetaLine = styled.div`
  margin-top: 4px;
  color: #64748b;
  font-size: 12.5px;
  line-height: 1.35;
  font-weight: 400;
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