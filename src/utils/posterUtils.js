export function getTmdbPosterUrl(movie, size = "w500") {
	const tmdb = movie?.external_meta?.tmdb;

	if (tmdb?.posterUrl) {
		return tmdb.posterUrl;
	}

	if (tmdb?.posterPath) {
		return `https://image.tmdb.org/t/p/${size}${tmdb.posterPath}`;
	}

	return "";
}

export function getOmdbPosterUrl(movie) {
	if (movie?.Poster && movie.Poster !== "N/A") {
		return movie.Poster;
	}

	if (movie?.poster && movie.poster !== "N/A") {
		return movie.poster;
	}

	return "";
}

export function getPosterCandidates(movie) {
	const omdbPoster = getOmdbPosterUrl(movie);
	const tmdbPoster = getTmdbPosterUrl(movie, "w500");

	return [
		{
			source: "omdb",
			url: omdbPoster,
		},
		{
			source: "tmdb",
			url: tmdbPoster,
		},
	].filter((candidate) => candidate.url);
}