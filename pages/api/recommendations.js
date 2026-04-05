import OpenAI from "openai";
import supabase from "../../src/supabase";

function safeJsonParse(text) {
	if (!text) return null;

	try {
		return JSON.parse(text);
	} catch {
		const match = text.match(/\{[\s\S]*\}$/);
		if (!match) return null;

		try {
			return JSON.parse(match[0]);
		} catch {
			return null;
		}
	}
}

export default async function handler(req, res) {
	if (req.method !== "POST") {
		return res.status(405).json({ error: "Method not allowed" });
	}

	try {
		if (!process.env.OPENAI_API_KEY) {
			return res.status(500).json({ error: "Missing OPENAI_API_KEY" });
		}

		const openai = new OpenAI({
			apiKey: process.env.OPENAI_API_KEY,
		});

		const { query } = req.body || {};

		if (!query || !query.trim()) {
			return res.status(400).json({ error: "Query is required" });
		}

		const { data: watchedMovies, error: watchedError } = await supabase
			.from("movies_2024")
			.select("*")
			.eq("watched_mark", true)
			.order("rating", { ascending: false });

		if (watchedError) {
			return res.status(500).json({ error: watchedError.message });
		}

		const { data: toWatchMovies, error: toWatchError } = await supabase
			.from("random_movies_2024")
			.select("*")
			.eq("watched_mark", false);

		if (toWatchError) {
			return res.status(500).json({ error: toWatchError.message });
		}

		const likedMovies = (watchedMovies || [])
			.filter((movie) => Number(movie.rating || 0) >= 7)
			.slice(0, 40);

		const existingTitles = new Set(
			[...(watchedMovies || []), ...(toWatchMovies || [])]
				.map((movie) => String(movie.title || "").trim().toLowerCase())
				.filter(Boolean)
		);

		const likedSummary = likedMovies.map((movie) => ({
			title: movie.title || "",
			rating: movie.rating || null,
			director: movie.director || "",
			year: movie.year || movie.released || "",
			genre: movie.genre || "",
			note: movie.note || movie.notes || movie.comment || "",
		}));

		const prompt = `
You are a highly specific personal movie recommendation assistant.

User request:
"${query}"

Liked movies:
${JSON.stringify(likedSummary, null, 2)}

Return ONLY valid JSON in this exact format:
{
  "taste_summary": "short paragraph",
  "recommendations": [
    {
      "title": "Movie title",
      "year": 1994,
      "director": "Director name",
      "why_this": "Concrete explanation with exact liked titles",
      "similar_to": ["Film 1", "Film 2"],
      "match_factors": ["tone", "pacing"],
      "because_you_like_director": "Director name or empty string"
    }
  ]
}
`;

		const completion = await openai.chat.completions.create({
			model: "gpt-5.4-mini",
			response_format: { type: "json_object" },
			messages: [
				{
					role: "system",
					content:
						"You generate highly specific movie recommendations as strict JSON only. Never use vague reasons.",
				},
				{
					role: "user",
					content: prompt,
				},
			],
			temperature: 0.7,
		});

		const content = completion.choices?.[0]?.message?.content || "";
		const parsed = safeJsonParse(content);

		if (!parsed) {
			return res.status(500).json({
				error: "Model returned invalid JSON",
				raw: content,
			});
		}

		const cleanedRecommendations = (parsed.recommendations || [])
			.filter((item) => item?.title)
			.filter(
				(item) => !existingTitles.has(String(item.title).trim().toLowerCase())
			)
			.slice(0, 10)
			.map((item) => ({
				title: item.title || "",
				year: item.year || "",
				director: item.director || "",
				why_this: item.why_this || "",
				similar_to: Array.isArray(item.similar_to) ? item.similar_to : [],
				match_factors: Array.isArray(item.match_factors) ? item.match_factors : [],
				because_you_like_director: item.because_you_like_director || "",
			}));

		return res.status(200).json({
			taste_summary: parsed.taste_summary || "",
			recommendations: cleanedRecommendations,
		});
	} catch (error) {
		console.error("RECOMMENDATIONS_API_ERROR", error);

		return res.status(500).json({
			error: error?.message || "Unexpected server error",
			type: error?.type || null,
			status: error?.status || null,
		});
	}
}