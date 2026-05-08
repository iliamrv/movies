import { normalizeSearchText } from "./movieUtils";

function getTmdb(movie) {
	return movie?.external_meta?.tmdb || {};
}

function getTmdbTitles(tmdb) {
	return [tmdb.titles?.ru, tmdb.titles?.en, tmdb.titles?.original].filter(
		Boolean
	);
}

function getTmdbDirectors(tmdb) {
	if (!Array.isArray(tmdb.directors)) return [];

	return tmdb.directors
		.flatMap((person) => [person?.name, person?.originalName])
		.filter(Boolean);
}

function getTmdbCast(tmdb) {
	if (!Array.isArray(tmdb.cast)) return [];

	return tmdb.cast
		.slice(0, 10)
		.flatMap((person) => [person?.name, person?.originalName])
		.filter(Boolean);
}

function getTmdbGenres(tmdb) {
	if (!Array.isArray(tmdb.genres)) return [];
	return tmdb.genres.filter(Boolean);
}

export function buildMovieSearchText(movie) {
	const tmdb = getTmdb(movie);

	return [
		movie.title,
		movie.director,
		movie.comment,

		...(Array.isArray(movie.tags) ? movie.tags : []),

		...getTmdbTitles(tmdb),
		...getTmdbDirectors(tmdb),
		...getTmdbCast(tmdb),
		...getTmdbGenres(tmdb),
	]
		.filter(Boolean)
		.map(normalizeSearchText)
		.join(" ");
}