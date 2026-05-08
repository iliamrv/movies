import { buildMovieSearchText } from "../../src/utils/buildMovieSearchText";
import supabase from "../../src/supabase";

const TABLE_NAME = "movies_2024";

function chunkArray(array, size) {
	const chunks = [];

	for (let i = 0; i < array.length; i += size) {
		chunks.push(array.slice(i, i + size));
	}

	return chunks;
}

export default async function handler(req, res) {
	if (req.method !== "POST") {
		return res.status(405).json({
			error: "Method not allowed",
		});
	}

	try {
		const { data: movies, error: fetchError } = await supabase
			.from(TABLE_NAME)
			.select(
				`
        id,
        title,
        director,
        comment,
        tags,
        external_meta
      `
			)
			.eq("watched_mark", true)
			.limit(1000);

		if (fetchError) {
			throw fetchError;
		}

		const rows = (movies || []).map((movie) => ({
			id: movie.id,
			search_text: buildMovieSearchText(movie),
		}));

		const chunks = chunkArray(rows, 50);

		let updated = 0;
		const errors = [];

		for (const chunk of chunks) {
			const results = await Promise.all(
				chunk.map(async (row) => {
					const { error } = await supabase
						.from(TABLE_NAME)
						.update({
							search_text: row.search_text,
						})
						.eq("id", row.id);

					if (error) {
						return {
							id: row.id,
							error: error.message,
						};
					}

					return null;
				})
			);

			const chunkErrors = results.filter(Boolean);

			if (chunkErrors.length > 0) {
				errors.push(...chunkErrors);
			}

			updated += chunk.length - chunkErrors.length;
		}

		return res.status(200).json({
			total: rows.length,
			updated,
			chunks: chunks.length,
			errors,
		});
	} catch (error) {
		console.error("Backfill search_text error:", error);

		return res.status(500).json({
			error: error.message || "Backfill failed",
		});
	}
}