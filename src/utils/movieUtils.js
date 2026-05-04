export function normalizeSearchText(value) {
	return String(value || "")
		.toLowerCase()
		.replace(/ё/g, "е")
		.replace(/[“”«»]/g, '"')
		.replace(/[’‘]/g, "'")
		.replace(/[^a-zа-я0-9\s'-]/gi, " ")
		.replace(/\s+/g, " ")
		.trim();
}

export function getTmdbMeta(movie) {
	return movie?.external_meta?.tmdb || {};
}

export function isValidPosterUrl(value) {
	if (!value || value === "N/A") return false;
	return /^https?:\/\//i.test(String(value));
}

export function getMoviePoster(movie) {
	const candidates = [
		movie?.external_meta?.tmdb?.posterUrl,
		movie?.external_meta?.tmdb?.poster_url,
		movie?.poster_url,
		movie?.poster,
		movie?.Poster,
	];

	return candidates.find(isValidPosterUrl) || "";
}

export function getMovieTitle(movie, options = {}) {
	const { preferRu = true } = options;
	const tmdb = getTmdbMeta(movie);

	if (preferRu) {
		return tmdb.titles?.ru || movie?.title || "—";
	}

	return movie?.title || tmdb.titles?.en || tmdb.titles?.original || "—";
}

export function getMovieOriginalTitle(movie) {
	const tmdb = getTmdbMeta(movie);
	const mainTitle = normalizeSearchText(getMovieTitle(movie));

	const candidates = [
		tmdb.titles?.original,
		tmdb.titles?.en,
		movie?.title,
	].filter(Boolean);

	return (
		candidates.find((title) => normalizeSearchText(title) !== mainTitle) || ""
	);
}

export function getMovieDirector(movie) {
	const tmdb = getTmdbMeta(movie);

	if (Array.isArray(tmdb.directors) && tmdb.directors.length > 0) {
		return tmdb.directors
			.map((director) => director?.name)
			.filter(Boolean)
			.join(", ");
	}

	return movie?.director || movie?.Director || "—";
}

export function getMovieGenres(movie) {
	const tmdb = getTmdbMeta(movie);

	if (Array.isArray(tmdb.genres) && tmdb.genres.length > 0) {
		return tmdb.genres.filter(Boolean);
	}

	if (movie?.Genre && movie.Genre !== "N/A") {
		return movie.Genre.split(",").map((genre) => genre.trim()).filter(Boolean);
	}

	return [];
}

export function getPrimaryGenre(movie) {
	return getMovieGenres(movie)[0] || "";
}

export function getMovieYear(movie) {
	const tmdb = getTmdbMeta(movie);
	const releaseDate = tmdb.releaseDate;

	if (releaseDate) {
		const match = String(releaseDate).match(/\d{4}/);
		if (match) return match[0];
	}

	return movie?.year || movie?.Year || "—";
}

export function getMovieRuntime(movie) {
	const tmdb = getTmdbMeta(movie);

	if (tmdb.runtime) return `${tmdb.runtime} min`;
	if (movie?.Runtime && movie.Runtime !== "N/A") return movie.Runtime;

	return "";
}

export function getMovieDescription(movie) {
	const tmdb = getTmdbMeta(movie);

	return (
		tmdb.overview?.ru ||
		tmdb.overview?.en ||
		(movie?.Plot && movie.Plot !== "N/A" ? movie.Plot : "") ||
		""
	);
}

export function getMovieRating(movie) {
	if (
		movie?.rating === null ||
		movie?.rating === undefined ||
		movie?.rating === ""
	) {
		return "";
	}

	return movie.rating;
}

export function getImdbRating(movie) {
	if (!movie?.imdbRating || movie.imdbRating === "N/A") return "";
	return movie.imdbRating;
}

export function getRottenTomatoesRating(movie) {
	if (!Array.isArray(movie?.Ratings)) return "";

	const rating = movie.Ratings.find(
		(item) => item.Source === "Rotten Tomatoes"
	);

	return rating?.Value || "";
}

export function hasImdb(movie) {
	return Boolean(movie?.imdb);
}

export function hasTmdb(movie) {
	return Boolean(movie?.external_meta?.tmdb?.id);
}

export function hasNoRating(movie) {
	return (
		movie?.rating === null ||
		movie?.rating === undefined ||
		movie?.rating === ""
	);
}

export function hasNoWatchDate(movie) {
	return !movie?.watchTime;
}

export function getDaysAgo(dateValue) {
	if (!dateValue) return null;

	const diff = Date.now() - new Date(dateValue).getTime();

	if (Number.isNaN(diff)) return null;

	return Math.floor(diff / (1000 * 60 * 60 * 24));
}

export function formatMovieDate(value) {
	if (!value) return "—";

	const date = new Date(value);

	if (Number.isNaN(date.getTime())) return value;

	return date.toLocaleDateString("en-US", {
		month: "short",
		day: "numeric",
		year: "numeric",
	});
}

export function getMovieCast(movie, limit = 5) {
	const tmdb = getTmdbMeta(movie);

	if (!Array.isArray(tmdb.cast)) return [];

	return tmdb.cast.slice(0, limit).filter(Boolean);
}