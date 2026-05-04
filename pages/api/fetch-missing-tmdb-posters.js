import supabase from "../../src/supabase";
import { fetchTmdbMetaByImdbId } from "../../src/api/tmdb";

function sleep(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

function hasPosterUrl(movie) {
	return Boolean(movie?.external_meta?.tmdb?.posterUrl);
}

export default async function handler(req, res) {
	if (req.method !== "POST") {
		return res.status(405).json({ error: "Method not allowed" });
	}

	try {
		const { batchSize = 50, maxBatches = 20 } = req.body || {};

		let scanned = 0;
		let checkedMissing = 0;
		let updated = 0;
		let skipped = 0;
		const failed = [];

		for (let batch = 0; batch < maxBatches; batch++) {
			const from = batch * batchSize;
			const to = from + batchSize - 1;

			const { data: movies, error } = await supabase
				.from("movies_2024")
				.select("id, title, imdb, external_meta")
				.not("imdb", "is", null)
				.range(from, to);

			if (error) throw error;
			if (!movies || movies.length === 0) break;

			scanned += movies.length;

			const moviesWithoutPoster = movies.filter((movie) => !hasPosterUrl(movie));
			checkedMissing += moviesWithoutPoster.length;

			for (const movie of moviesWithoutPoster) {
				try {
					const tmdbMeta = await fetchTmdbMetaByImdbId(movie.imdb);

					if (!tmdbMeta?.tmdb?.posterUrl) {
						skipped++;
						continue;
					}

					const nextExternalMeta = {
						...(movie.external_meta || {}),
						tmdb: tmdbMeta.tmdb,
						sources: {
							...(movie.external_meta?.sources || {}),
							tmdb: {
								fetchedAt: tmdbMeta.fetchedAt,
							},
						},
					};

					const { error: updateError } = await supabase
						.from("movies_2024")
						.update({ external_meta: nextExternalMeta })
						.eq("id", movie.id);

					if (updateError) {
						failed.push({
							id: movie.id,
							title: movie.title,
							error: updateError.message,
						});
					} else {
						updated++;
					}

					await sleep(250);
				} catch (error) {
					failed.push({
						id: movie.id,
						title: movie.title,
						error: error.message,
					});
				}
			}
		}

		return res.status(200).json({
			ok: true,
			scanned,
			withoutPoster: checkedMissing,
			updated,
			skipped,
			failedCount: failed.length,
			failed: failed.slice(0, 20),
		});
	} catch (error) {
		console.error("FETCH_MISSING_TMDB_POSTERS_ERROR", error);

		return res.status(500).json({
			error: error?.message || "Unexpected server error",
		});
	}
}