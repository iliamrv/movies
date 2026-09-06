import {
  normalizeSearchText,
  getTmdbMeta,
  getMovieGenres,
  hasNoRating,
  hasNoWatchDate,
  hasImdb,
  hasTmdb,
} from "./movieUtils";

const SEARCH_ALIASES = [
  ["melville", "мельвиль"],
];

function getQueryTokenVariants(token) {
  const variants = new Set([token]);

  SEARCH_ALIASES.forEach((aliasGroup) => {
    if (aliasGroup.includes(token)) {
      aliasGroup.forEach((alias) => variants.add(alias));
    }
  });

  return Array.from(variants);
}

export function matchesMovieSearchQuery(searchText, query) {
  const normalizedSearchText = normalizeSearchText(searchText);
  const normalizedQuery = normalizeSearchText(query);

  if (!normalizedQuery) return true;

  return normalizedQuery
    .split(" ")
    .filter(Boolean)
    .every((token) =>
      getQueryTokenVariants(token).some((variant) =>
        normalizedSearchText.includes(variant)
      )
    );
}

function getDirectorsFromTmdb(tmdb) {
  if (!Array.isArray(tmdb.directors)) return [];

  return tmdb.directors
    .flatMap((person) => [person?.name, person?.originalName])
    .filter(Boolean);
}

function getCastFromTmdb(tmdb) {
  if (!Array.isArray(tmdb.cast)) return [];

  return tmdb
    .cast
    .flatMap((person) => [person?.name, person?.originalName])
    .filter(Boolean);
}

export function getStrictSearchText(item) {
  const tmdb = getTmdbMeta(item);

  return [
    item.title,
    item.director,
    item.year,
    item.imdb,
    tmdb.titles?.ru,
    tmdb.titles?.en,
    tmdb.titles?.original,
  ]
    .filter(Boolean)
    .map(normalizeSearchText)
    .join(" ");
}

export function getExtendedSearchText(item) {
  const tmdb = getTmdbMeta(item);

  return [
    item.title,
    item.director,
    item.year,
    item.rating,
    item.watchTime,
    item.comment,
    item.imdb,
    item.rewatch_mark ? "rewatch пересмотреть" : "",
    tmdb.titles?.ru,
    tmdb.titles?.en,
    tmdb.titles?.original,
    tmdb.releaseDate,
    tmdb.originalLanguage,
    tmdb.runtime,
    ...getMovieGenres(item),
    ...getDirectorsFromTmdb(tmdb),
    ...getCastFromTmdb(tmdb),
  ]
    .filter(Boolean)
    .map(normalizeSearchText)
    .join(" ");
}

export function applyQuickFilter(items, quickFilter) {
  if (quickFilter === "no_rating") {
    return items.filter(hasNoRating);
  }

  if (quickFilter === "imdb_missing") {
    return items.filter((item) => !hasImdb(item));
  }

  if (quickFilter === "tmdb_missing") {
    return items.filter((item) => !hasTmdb(item));
  }

  if (quickFilter === "high_rated") {
    return items.filter((item) => Number(item.rating) >= 8);
  }

  if (quickFilter === "no_watch_date") {
    return items.filter(hasNoWatchDate);
  }

  if (quickFilter === "rewatch") {
    return items.filter((item) => item.rewatch_mark === true);
  }

  return items;
}
