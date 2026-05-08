function formatTmdbPoster(path, size = "w500") {
	if (!path) return null;
	return `https://image.tmdb.org/t/p/${size}${path}`;
}

async function fetchJson(url, options = {}) {
	const response = await fetch(url, options);

	if (!response.ok) {
		throw new Error(`Request failed: ${response.status}`);
	}

	return response.json();
}

async function getImageSizeBytes(url) {
	if (!url) return null;

	try {
		const response = await fetch(url, {
			method: "HEAD",
		});

		if (!response.ok) return null;

		const contentLength = response.headers.get("content-length");

		return contentLength ? Number(contentLength) : null;
	} catch {
		return null;
	}
}

export default async function handler(req, res) {
	if (req.method !== "POST") {
		return res.status(405).json({
			error: "Method not allowed",
		});
	}

	const { imdbId } = req.body;

	if (!imdbId) {
		return res.status(400).json({
			error: "Missing imdbId",
		});
	}

	const cleanImdbId = String(imdbId).trim();

	const candidates = [];

	try {
		const omdbApiKey = process.env.OMDB_API_KEY;

		if (omdbApiKey) {
			try {
				const omdbData = await fetchJson(
					`https://www.omdbapi.com/?i=${encodeURIComponent(
						cleanImdbId
					)}&apikey=${omdbApiKey}`
				);

				if (
					omdbData?.Response === "True" &&
					omdbData?.Poster &&
					omdbData.Poster !== "N/A"
				) {
					candidates.push({
						source: "OMDb",
						variant: "default",
						url: omdbData.Poster,
					});
				}
			} catch (error) {
				console.warn("OMDb poster fetch failed:", error.message);
			}
		}

		const tmdbToken = process.env.TMDB_READ_ACCESS_TOKEN;

		if (tmdbToken) {
			try {
				const tmdbFindData = await fetchJson(
					`https://api.themoviedb.org/3/find/${encodeURIComponent(
						cleanImdbId
					)}?external_source=imdb_id`,
					{
						headers: {
							Authorization: `Bearer ${tmdbToken}`,
							Accept: "application/json",
						},
					}
				);

				const movie = tmdbFindData?.movie_results?.[0];

				if (movie?.poster_path) {
					candidates.push({
						source: "TMDb",
						variant: "w342",
						url: formatTmdbPoster(movie.poster_path, "w342"),
					});

					candidates.push({
						source: "TMDb",
						variant: "w500",
						url: formatTmdbPoster(movie.poster_path, "w500"),
					});
				}
			} catch (error) {
				console.warn("TMDb poster fetch failed:", error.message);
			}
		}

		const candidatesWithSize = await Promise.all(
			candidates.map(async (candidate) => ({
				...candidate,
				sizeBytes: await getImageSizeBytes(candidate.url),
			}))
		);

		return res.status(200).json({
			imdbId: cleanImdbId,
			candidates: candidatesWithSize,
		});
	} catch (error) {
		console.error("Poster sources error:", error);

		return res.status(500).json({
			error: error.message || "Failed to fetch poster sources",
		});
	}
}