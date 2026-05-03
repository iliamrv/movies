const TMDB_BASE_URL = "https://api.themoviedb.org/3";

function getTmdbHeaders() {
	const token = process.env.TMDB_READ_ACCESS_TOKEN;

	if (!token) {
		throw new Error("Missing TMDB_READ_ACCESS_TOKEN");
	}

	return {
		Authorization: `Bearer ${token}`,
		Accept: "application/json",
	};
}

async function tmdbFetch(path) {
	const response = await fetch(`${TMDB_BASE_URL}${path}`, {
		headers: getTmdbHeaders(),
	});

	const data = await response.json();

	if (!response.ok) {
		throw new Error(
			data?.status_message || `TMDb request failed: ${response.status}`
		);
	}

	return data;
}

export async function fetchTmdbMetaByImdbId(imdbId) {
	if (!imdbId) return null;

	const cleanImdbId = String(imdbId).trim();

	const findData = await tmdbFetch(
		`/find/${encodeURIComponent(cleanImdbId)}?external_source=imdb_id`
	);

	const movieResult = findData?.movie_results?.[0];
	const tvResult = findData?.tv_results?.[0];

	if (movieResult?.id) {
		return fetchTmdbMovieMeta(movieResult.id, cleanImdbId);
	}

	if (tvResult?.id) {
		return fetchTmdbTvMeta(tvResult.id, cleanImdbId);
	}

	return null;
}

async function fetchTmdbMovieMeta(tmdbId, cleanImdbId) {
	const detailsRu = await tmdbFetch(
		`/movie/${tmdbId}?language=ru-RU&append_to_response=credits,alternative_titles,translations`
	);

	const detailsEn = await tmdbFetch(`/movie/${tmdbId}?language=en-US`);

	const posterPath = detailsRu.poster_path || detailsEn.poster_path || "";
	const backdropPath = detailsRu.backdrop_path || detailsEn.backdrop_path || "";

	const topCast = Array.isArray(detailsRu?.credits?.cast)
		? detailsRu.credits.cast.slice(0, 12).map((person) => ({
			id: person.id,
			name: person.name,
			originalName: person.original_name,
			character: person.character,
			order: person.order,
		}))
		: [];

	const directors = Array.isArray(detailsRu?.credits?.crew)
		? detailsRu.credits.crew
			.filter((person) => person.job === "Director")
			.map((person) => ({
				id: person.id,
				name: person.name,
				originalName: person.original_name,
			}))
		: [];

	const alternativeTitles = Array.isArray(detailsRu?.alternative_titles?.titles)
		? detailsRu.alternative_titles.titles.map((item) => ({
			country: item.iso_3166_1,
			title: item.title,
			type: item.type || "",
		}))
		: [];

	const ruAlternativeTitles = alternativeTitles
		.filter((item) => item.country === "RU" || item.country === "SU")
		.map((item) => item.title);

	return {
		source: "tmdb",
		fetchedAt: new Date().toISOString(),

		tmdb: {
			mediaType: "movie",
			id: tmdbId,
			imdbId: cleanImdbId,

			posterPath,
			backdropPath,

			posterUrl: posterPath
				? `https://image.tmdb.org/t/p/w500${posterPath}`
				: "",

			backdropUrl: backdropPath
				? `https://image.tmdb.org/t/p/w1280${backdropPath}`
				: "",

			titles: {
				original: detailsRu.original_title || detailsEn.original_title || "",
				en: detailsEn.title || "",
				ru: detailsRu.title || "",
			},

			overview: {
				en: detailsEn.overview || "",
				ru: detailsRu.overview || "",
			},

			releaseDate: detailsRu.release_date || detailsEn.release_date || "",
			runtime: detailsRu.runtime || detailsEn.runtime || null,

			genres: Array.isArray(detailsRu.genres)
				? detailsRu.genres.map((genre) => genre.name)
				: [],

			originalLanguage: detailsRu.original_language || "",

			productionCountries: Array.isArray(detailsRu.production_countries)
				? detailsRu.production_countries.map((country) => country.name)
				: [],

			directors,
			cast: topCast,

			alternativeTitles,
			ruAlternativeTitles,
		},
	};
}

async function fetchTmdbTvMeta(tmdbId, cleanImdbId) {
	const detailsRu = await tmdbFetch(
		`/tv/${tmdbId}?language=ru-RU&append_to_response=credits,alternative_titles,translations`
	);

	const detailsEn = await tmdbFetch(`/tv/${tmdbId}?language=en-US`);

	const posterPath = detailsRu.poster_path || detailsEn.poster_path || "";
	const backdropPath = detailsRu.backdrop_path || detailsEn.backdrop_path || "";

	const topCast = Array.isArray(detailsRu?.credits?.cast)
		? detailsRu.credits.cast.slice(0, 12).map((person) => ({
			id: person.id,
			name: person.name,
			originalName: person.original_name,
			character: person.character,
			order: person.order,
		}))
		: [];

	const creators = Array.isArray(detailsRu?.created_by)
		? detailsRu.created_by.map((person) => ({
			id: person.id,
			name: person.name,
			originalName: person.original_name,
		}))
		: [];

	const alternativeTitles = Array.isArray(detailsRu?.alternative_titles?.results)
		? detailsRu.alternative_titles.results.map((item) => ({
			country: item.iso_3166_1,
			title: item.title,
			type: item.type || "",
		}))
		: [];

	const ruAlternativeTitles = alternativeTitles
		.filter((item) => item.country === "RU" || item.country === "SU")
		.map((item) => item.title);

	const runtime = Array.isArray(detailsRu.episode_run_time)
		? detailsRu.episode_run_time[0] || null
		: null;

	return {
		source: "tmdb",
		fetchedAt: new Date().toISOString(),

		tmdb: {
			mediaType: "tv",
			id: tmdbId,
			imdbId: cleanImdbId,

			posterPath,
			backdropPath,

			posterUrl: posterPath
				? `https://image.tmdb.org/t/p/w500${posterPath}`
				: "",

			backdropUrl: backdropPath
				? `https://image.tmdb.org/t/p/w1280${backdropPath}`
				: "",

			titles: {
				original: detailsRu.original_name || detailsEn.original_name || "",
				en: detailsEn.name || "",
				ru: detailsRu.name || "",
			},

			overview: {
				en: detailsEn.overview || "",
				ru: detailsRu.overview || "",
			},

			releaseDate: detailsRu.first_air_date || detailsEn.first_air_date || "",
			runtime,

			genres: Array.isArray(detailsRu.genres)
				? detailsRu.genres.map((genre) => genre.name)
				: [],

			originalLanguage: detailsRu.original_language || "",

			productionCountries: Array.isArray(detailsRu.production_countries)
				? detailsRu.production_countries.map((country) => country.name)
				: [],

			directors: creators,
			creators,
			cast: topCast,

			numberOfSeasons: detailsRu.number_of_seasons || null,
			numberOfEpisodes: detailsRu.number_of_episodes || null,
			status: detailsRu.status || "",

			alternativeTitles,
			ruAlternativeTitles,
		},
	};
}

function normalizeText(value) {
	return String(value || "")
		.toLowerCase()
		.replace(/ё/g, "е")
		.replace(/[“”«»]/g, '"')
		.replace(/[’‘]/g, "'")
		.replace(/[^a-zа-я0-9\s'-]/gi, " ")
		.replace(/\s+/g, " ")
		.trim();
}

function getYear(value) {
	const match = String(value || "").match(/\d{4}/);
	return match ? Number(match[0]) : null;
}

async function getTmdbMovieDetailsWithExternalIds(tmdbId) {
	return tmdbFetch(
		`/movie/${tmdbId}?language=en-US&append_to_response=credits,external_ids`
	);
}

function scoreTmdbCandidateSoft(movie, sourceMovie, details, searchLanguage) {
	let score = 0;

	const sourceTitle = normalizeText(sourceMovie.title);
	const sourceDirector = normalizeText(sourceMovie.director);
	const sourceYear = getYear(sourceMovie.year);

	const tmdbTitle = normalizeText(movie.title);
	const tmdbOriginalTitle = normalizeText(movie.original_title);
	const tmdbYear = getYear(movie.release_date);

	if (searchLanguage === "ru-RU") {
		score += 8;
	}

	if (sourceTitle && tmdbTitle && sourceTitle === tmdbTitle) {
		score += 45;
	}

	if (sourceTitle && tmdbOriginalTitle && sourceTitle === tmdbOriginalTitle) {
		score += 45;
	}

	if (
		sourceTitle &&
		tmdbTitle &&
		(tmdbTitle.includes(sourceTitle) || sourceTitle.includes(tmdbTitle))
	) {
		score += 25;
	}

	if (
		sourceTitle &&
		tmdbOriginalTitle &&
		(tmdbOriginalTitle.includes(sourceTitle) ||
			sourceTitle.includes(tmdbOriginalTitle))
	) {
		score += 20;
	}

	if (sourceYear && tmdbYear && sourceYear === tmdbYear) {
		score += 30;
	}

	if (sourceYear && tmdbYear && Math.abs(sourceYear - tmdbYear) === 1) {
		score += 12;
	}

	const directors = Array.isArray(details?.credits?.crew)
		? details.credits.crew
			.filter((person) => person.job === "Director")
			.map((person) => normalizeText(person.name))
		: [];

	if (
		sourceDirector &&
		directors.some(
			(director) =>
				director === sourceDirector ||
				director.includes(sourceDirector) ||
				sourceDirector.includes(director)
		)
	) {
		score += 30;
	}

	if (movie.popularity && movie.popularity > 5) {
		score += 5;
	}

	if (movie.vote_count && movie.vote_count > 100) {
		score += 5;
	}

	return score;
}

export async function findImdbIdByMovieFields({
	title,
	director,
	year,
	minScore = 35,
}) {
	const cleanTitle = String(title || "").trim();

	if (!cleanTitle) {
		return null;
	}

	const cleanYear = getYear(year);

	const searchLanguages = ["ru-RU", "en-US"];

	const queries = [
		cleanTitle,
		cleanYear ? `${cleanTitle} ${cleanYear}` : "",
	].filter(Boolean);

	const uniqueSearches = [];

	for (const language of searchLanguages) {
		for (const query of queries) {
			uniqueSearches.push({
				query,
				language,
			});
		}
	}

	const checked = [];

	for (const search of uniqueSearches) {
		const searchParams = new URLSearchParams({
			query: search.query,
			include_adult: "false",
			language: search.language,
			page: "1",
		});

		if (cleanYear) {
			searchParams.set("year", String(cleanYear));
		}

		const searchData = await tmdbFetch(`/search/movie?${searchParams}`);

		const candidates = Array.isArray(searchData?.results)
			? searchData.results.slice(0, 8)
			: [];

		for (const candidate of candidates) {
			if (!candidate?.id) continue;

			const details = await getTmdbMovieDetailsWithExternalIds(candidate.id);

			const imdbId = details?.external_ids?.imdb_id || "";

			const score = scoreTmdbCandidateSoft(
				candidate,
				{
					title,
					director,
					year,
				},
				details,
				search.language
			);

			checked.push({
				tmdbId: candidate.id,
				title: candidate.title,
				originalTitle: candidate.original_title,
				releaseDate: candidate.release_date,
				imdbId,
				score,
				language: search.language,
			});
		}
	}

	checked.sort((a, b) => b.score - a.score);

	const best = checked[0];

	if (best?.imdbId && best.score >= minScore) {
		return {
			imdbId: best.imdbId,
			tmdbId: best.tmdbId,
			score: best.score,
			matchedTitle: best.title,
			matchedOriginalTitle: best.originalTitle,
			matchedReleaseDate: best.releaseDate,
			language: best.language,
			checked,
		};
	}

	return {
		imdbId: "",
		checked,
	};
}