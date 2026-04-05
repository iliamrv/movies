import OpenAI from "openai";
import supabase from "../../src/supabase";

const openai = new OpenAI({
	apiKey: process.env.OPENAI_API_KEY,
});

function safeJsonParse(text) {
	try {
		return JSON.parse(text);
	} catch {
		return null;
	}
}

export default async function handler(req, res) {
	if (req.method !== "POST") {
		return res.status(405).json({ error: "Method not allowed" });
	}

	try {
		const { query } = req.body || {};

		if (!query || !query.trim()) {
			return res.status(400).json({ error: "Query is required" });
		}

		// 1. Забираем просмотренные фильмы с оценками
		const { data: watchedMovies, error: watchedError } = await supabase
			.from("movies_2024")
			.select("*")
			.eq("watched_mark", true)
			.order("rating", { ascending: false });

		if (watchedError) {
			return res.status(500).json({ error: watchedError.message });
		}

		// 2. Забираем текущий to-watch, чтобы не рекомендовать дубли
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

Below is a list of movies the user liked from their own database.
Use it to infer taste and recommend movies they may enjoy.

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
      "why_this": "A concrete 2-4 sentence explanation. Mention exact films from the user's liked list that this recommendation connects to. Mention the exact director if relevant. Be specific, not generic.",
      "similar_to": ["Exact liked movie title 1", "Exact liked movie title 2"],
      "match_factors": ["tone", "pacing", "dialogue", "melancholy", "urban mood"],
      "because_you_like_director": "Exact director name if this is part of the reason, otherwise empty string"
    }
  ]
}

Rules:
- Recommend up to 10 movies
- Do not use vague phrases like "close to your favorites", "you may enjoy this", or "similar to films you like" without naming exact titles
- If you mention similarity, name 1-3 exact films from the user's liked list
- If director matters, explicitly name the director
- Explanations must be concrete and personalized
- Avoid generic mainstream picks unless they strongly fit
- No markdown
- No explanation outside JSON
`;

		const completion = await openai.chat.completions.create({
			model: "gpt-5.4-mini",
			messages: [
				{
					role: "developer",
					content:
						"You generate highly specific movie recommendations as strict JSON only. Never give vague reasons. Always name exact films from the user's liked list when explaining similarity. Always name the director if relevant.",
				},
				{
					role: "user",
					content: prompt,
				},
			],
			temperature: 0.9,
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
		return res.status(500).json({
			error: error.message || "Unexpected server error",
		});
	}
}