function getTmdb(movie) {
	return movie?.external_meta?.tmdb || {};
}

function getSecondaryTitle(movie, tmdb) {
	return (
		tmdb.titles?.en ||
		tmdb.titles?.original ||
		movie.title ||
		""
	);
}

function getGenres(tmdb) {
	if (!Array.isArray(tmdb.genres)) return [];
	return tmdb.genres.filter(Boolean).slice(0, 2);
}

function getDirector(movie, tmdb) {
	if (Array.isArray(tmdb.directors) && tmdb.directors.length > 0) {
		return tmdb.directors
			.map((person) => person?.name || person?.originalName)
			.filter(Boolean)
			.join(", ");
	}

	return movie.director || "";
}

export function buildMovieLibraryMeta(movie) {
	const tmdb = getTmdb(movie);

	return {
		secondaryTitle: getSecondaryTitle(movie, tmdb),
		genres: getGenres(tmdb),
		director: getDirector(movie, tmdb),
	};
}