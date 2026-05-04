import {
	normalizeSearchText,
	getTmdbMeta,
	getMovieGenres,
	hasNoRating,
	hasNoWatchDate,
	hasImdb,
	hasTmdb,
} from "./movieUtils";

function getAlternativeTitles(tmdb) {
	if (!Array.isArray(tmdb.alternativeTitles)) return [];

	return tmdb.alternativeTitles
		.map((item) => item?.title)
		.filter(Boolean);
}

function getRuAlternativeTitles(tmdb) {
	if (!Array.isArray(tmdb.ruAlternativeTitles)) return [];
	return tmdb.ruAlternativeTitles.filter(Boolean);
}

function getDirectorsFromTmdb(tmdb) {
	if (!Array.isArray(tmdb.directors)) return [];

	return tmdb.directors
		.flatMap((person) => [person?.name, person?.originalName])
		.filter(Boolean);
}

function getCastFromTmdb(tmdb) {
	if (!Array.isArray(tmdb.cast)) return [];

	return tmdb.cast
		.flatMap((person) => [
			person?.name,
			person?.originalName,
			person?.character,
		])
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

	return items;
}