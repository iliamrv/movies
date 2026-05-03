import supabase from "../../src/supabase";
import { fetchTmdbMetaByImdbId } from "../../src/api/tmdb";

export default async function handler(req, res) {
	if (req.method !== "POST") {
		return res.status(405).json({ error: "Method not allowed" });
	}

	try {
		const { movieId } = req.body || {};

		if (!movieId) {
			return res.status(400).json({ error: "movieId is required" });
		}

		const { data: movie, error: movieError } = await supabase
			.from("movies_2024")
			.select("id, title, imdb, external_meta")
			.eq("id", movieId)
			.single();

		if (movieError || !movie) {
			return res.status(404).json({ error: "Movie not found" });
		}

		if (!movie.imdb) {
			return res.status(400).json({ error: "Movie has no IMDb ID" });
		}

		const tmdbMeta = await fetchTmdbMetaByImdbId(movie.imdb);

		if (!tmdbMeta) {
			return res
				.status(404)
				.json({ error: "No TMDb movie or TV show found for this IMDb ID" });
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
			})
			.eq("id", movie.id);

		if (updateError) {
			return res.status(500).json({ error: updateError.message });
		}

		return res.status(200).json({
			ok: true,
			movieId: movie.id,
			external_meta: nextExternalMeta,
		});
	} catch (error) {
		console.error("FETCH_TMDB_META_ERROR", error);

		return res.status(500).json({
			error: error?.message || "Unexpected server error",
		});
	}
}