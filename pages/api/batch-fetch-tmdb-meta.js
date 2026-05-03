import supabase from "../../src/supabase";
import { fetchTmdbMetaByImdbId } from "../../src/api/tmdb";

function sleep(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

function isValidImdb(value) {
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
		const limit = Math.min(Math.max(limitFromBody, 1), 30);

		const delayMsFromBody = Number(req.body?.delayMs || 700);
		const delayMs = Math.min(Math.max(delayMsFromBody, 300), 3000);

		const dryRun = Boolean(req.body?.dryRun);
		const retryFailed = Boolean(req.body?.retryFailed);

		let query = supabase
			.from("movies_2024")
			.select("id, title, imdb, external_meta, tmdb_meta_status")
			.not("imdb", "is", null)
			.neq("imdb", "")
			.or("external_meta.is.null,external_meta->tmdb.is.null")
			.order("id", { ascending: true })
			.limit(limit);

		if (retryFailed) {
			query = query.in("tmdb_meta_status", ["pending", "failed", "not_found"]);
		}

		const { data: movies, error } = await query;

		if (error) {
			return res.status(500).json({ error: error.message });
		}

		const candidates = (movies || []).filter((movie) =>
			isValidImdb(movie.imdb)
		);

		if (dryRun) {
			return res.status(200).json({
				ok: true,
				dryRun: true,
				limit,
				found: candidates.length,
				movies: candidates.map((movie) => ({
					id: movie.id,
					title: movie.title,
					imdb: movie.imdb,
					tmdb_meta_status: movie.tmdb_meta_status,
					alreadyHasTmdb: Boolean(movie.external_meta?.tmdb),
				})),
			});
		}

		const results = [];

		for (const movie of candidates) {
			try {
				const tmdbMeta = await fetchTmdbMetaByImdbId(movie.imdb);

				if (!tmdbMeta?.tmdb) {
					const { error: updateError } = await supabase
						.from("movies_2024")
						.update({
							tmdb_meta_status: "not_found",
							tmdb_meta_fetched_at: new Date().toISOString(),
							tmdb_meta_error: "No TMDb movie or TV show found for this IMDb ID",
						})
						.eq("id", movie.id);

					results.push({
						id: movie.id,
						title: movie.title,
						imdb: movie.imdb,
						status: updateError ? "update_error" : "not_found",
						error: updateError?.message || null,
					});

					await sleep(delayMs);
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
					.update({
						external_meta: nextExternalMeta,
						tmdb_meta_status: "done",
						tmdb_meta_fetched_at: tmdbMeta.fetchedAt,
						tmdb_meta_error: null,
					})
					.eq("id", movie.id);

				if (updateError) {
					results.push({
						id: movie.id,
						title: movie.title,
						imdb: movie.imdb,
						status: "update_error",
						error: updateError.message,
					});
				} else {
					results.push({
						id: movie.id,
						title: movie.title,
						imdb: movie.imdb,
						status: "updated",
						mediaType: tmdbMeta.tmdb.mediaType || "movie",
						tmdbId: tmdbMeta.tmdb.id,
						ruTitle: tmdbMeta.tmdb.titles?.ru || "",
						originalTitle: tmdbMeta.tmdb.titles?.original || "",
					});
				}

				await sleep(delayMs);
			} catch (movieError) {
				const message = movieError?.message || "Unknown error";

				await supabase
					.from("movies_2024")
					.update({
						tmdb_meta_status: "failed",
						tmdb_meta_fetched_at: new Date().toISOString(),
						tmdb_meta_error: message,
					})
					.eq("id", movie.id);

				results.push({
					id: movie.id,
					title: movie.title,
					imdb: movie.imdb,
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
			processed: results.length,
			updated: results.filter((item) => item.status === "updated").length,
			notFound: results.filter((item) => item.status === "not_found").length,
			failed: results.filter((item) => item.status === "failed").length,
			updateErrors: results.filter((item) => item.status === "update_error")
				.length,
			results,
		});
	} catch (error) {
		console.error("BATCH_FETCH_TMDB_META_ERROR", error);

		return res.status(500).json({
			error: error?.message || "Unexpected server error",
		});
	}
}