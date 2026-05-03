import supabase from "../../src/supabase";
import { findImdbIdByMovieFields } from "../../src/api/tmdb";

function sleep(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

function hasValidImdb(value) {
	return /^tt\d{6,10}$/.test(String(value || "").trim());
}

export default async function handler(req, res) {
	if (req.method !== "POST") {
		return res.status(405).json({ error: "Method not allowed" });
	}

	try {
		const secretFromEnv = process.env.BATCH_SECRET;
		const secretFromRequest =
			req.headers["x-batch-secret"] || req.body?.secret || "";

		if (secretFromEnv && secretFromRequest !== secretFromEnv) {
			return res.status(401).json({ error: "Unauthorized" });
		}

		const limitFromBody = Number(req.body?.limit || 10);
		const limit = Math.min(Math.max(limitFromBody, 1), 25);

		const delayMsFromBody = Number(req.body?.delayMs || 1000);
		const delayMs = Math.min(Math.max(delayMsFromBody, 300), 4000);

		const dryRun = Boolean(req.body?.dryRun);
		const retryNotFound = Boolean(req.body?.retryNotFound);
		const retryFailed = Boolean(req.body?.retryFailed);
		const minScore = Number(req.body?.minScore || 35);

		const onlyWatchedMark = req.body?.watchedMark;

		const statuses = ["pending"];

		if (retryNotFound) {
			statuses.push("not_found");
		}

		if (retryFailed) {
			statuses.push("failed");
		}

		let query = supabase
			.from("movies_2024")
			.select(
				"id, title, director, year, imdb, watched_mark, imdb_lookup_status"
			)
			.or("imdb.is.null,imdb.eq.")
			.in("imdb_lookup_status", statuses)
			.order("id", { ascending: true })
			.limit(limit);

		if (typeof onlyWatchedMark === "boolean") {
			query = query.eq("watched_mark", onlyWatchedMark);
		}

		const { data: movies, error } = await query;

		if (error) {
			return res.status(500).json({ error: error.message });
		}

		const candidates = (movies || []).filter(
			(movie) => !hasValidImdb(movie.imdb)
		);

		if (dryRun) {
			return res.status(200).json({
				ok: true,
				dryRun: true,
				limit,
				minScore,
				statuses,
				found: candidates.length,
				candidates: candidates.map((movie) => ({
					id: movie.id,
					title: movie.title,
					director: movie.director,
					year: movie.year,
					watched_mark: movie.watched_mark,
					imdb: movie.imdb || "",
					imdb_lookup_status: movie.imdb_lookup_status,
				})),
			});
		}

		const results = [];

		for (const movie of candidates) {
			try {
				const found = await findImdbIdByMovieFields({
					title: movie.title,
					director: movie.director,
					year: movie.year,
					minScore,
				});

				if (!found?.imdbId) {
					const bestCandidate = Array.isArray(found?.checked)
						? found.checked
							.sort((a, b) => Number(b.score || 0) - Number(a.score || 0))
							.slice(0, 3)
						: [];

					const errorText = bestCandidate.length
						? `No confident match. Best: ${bestCandidate
							.map(
								(item) =>
									`${item.title || item.originalTitle || "unknown"} (${item.releaseDate || "no date"
									}) score=${item.score || 0} imdb=${item.imdbId || "none"}`
							)
							.join(" | ")}`
						: "No TMDb candidates found";

					await supabase
						.from("movies_2024")
						.update({
							imdb_lookup_status: "not_found",
							imdb_lookup_checked_at: new Date().toISOString(),
							imdb_lookup_error: errorText,
						})
						.eq("id", movie.id);

					results.push({
						id: movie.id,
						title: movie.title,
						director: movie.director,
						year: movie.year,
						status: "not_found",
						error: errorText,
						checked: bestCandidate,
					});

					await sleep(delayMs);
					continue;
				}

				const { error: updateError } = await supabase
					.from("movies_2024")
					.update({
						imdb: found.imdbId,
						imdb_lookup_status: "done",
						imdb_lookup_checked_at: new Date().toISOString(),
						imdb_lookup_error: null,
					})
					.eq("id", movie.id);

				if (updateError) {
					await supabase
						.from("movies_2024")
						.update({
							imdb_lookup_status: "failed",
							imdb_lookup_checked_at: new Date().toISOString(),
							imdb_lookup_error: updateError.message,
						})
						.eq("id", movie.id);

					results.push({
						id: movie.id,
						title: movie.title,
						status: "update_error",
						imdbId: found.imdbId,
						error: updateError.message,
					});
				} else {
					results.push({
						id: movie.id,
						title: movie.title,
						director: movie.director,
						year: movie.year,
						status: "updated",
						imdbId: found.imdbId,
						tmdbId: found.tmdbId,
						score: found.score,
						matchedTitle: found.matchedTitle,
						matchedOriginalTitle: found.matchedOriginalTitle,
						matchedReleaseDate: found.matchedReleaseDate,
						language: found.language,
					});
				}

				await sleep(delayMs);
			} catch (movieError) {
				const message = movieError.message || "Unknown error";

				await supabase
					.from("movies_2024")
					.update({
						imdb_lookup_status: "failed",
						imdb_lookup_checked_at: new Date().toISOString(),
						imdb_lookup_error: message,
					})
					.eq("id", movie.id);

				results.push({
					id: movie.id,
					title: movie.title,
					status: "failed",
					error: message,
				});

				await sleep(delayMs);
			}
		}

		return res.status(200).json({
			ok: true,
			dryRun: false,
			limit,
			delayMs,
			minScore,
			statuses,
			processed: results.length,
			updated: results.filter((item) => item.status === "updated").length,
			notFound: results.filter((item) => item.status === "not_found").length,
			failed: results.filter((item) => item.status === "failed").length,
			updateErrors: results.filter((item) => item.status === "update_error")
				.length,
			results,
		});
	} catch (error) {
		console.error("BATCH_FILL_IMDB_FROM_TMDB_ERROR", error);

		return res.status(500).json({
			error: error.message || "Unexpected server error",
		});
	}
}