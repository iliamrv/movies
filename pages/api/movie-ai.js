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

function normalizeText(value) {
	return String(value || "").trim().toLowerCase();
}

function uniqStrings(arr = []) {
	return [...new Set(arr.filter(Boolean).map((item) => String(item).trim()))];
}

function toMovieItem(movie) {
	return {
		id: movie.id ?? "",
		title: movie.title || "",
		year: movie.year || movie.released || "",
		director: movie.director || "",
		genre: movie.genre || "",
		rating: movie.rating ?? null,
		note: movie.note || movie.notes || movie.comment || "",
	};
}

function detectMode(query = "") {
	const q = normalizeText(query);

	const hybridHints = [
		"и еще посоветуй",
		"и предложи еще",
		"и добавь еще",
		"plus recommend",
		"also recommend",
		"and recommend",
		"outside my list too",
		"из базы и что-то новое",
		"и что-нибудь новое",
	];

	const externalHints = [
		"посоветуй новое",
		"что еще посмотреть",
		"что посмотреть еще",
		"вне базы",
		"не из моей базы",
		"recommend me something new",
		"recommend new movies",
		"outside my list",
		"outside my database",
		"new recommendations",
	];

	const dbHints = [
		"в моей базе",
		"из моей базы",
		"из просмотренных",
		"среди просмотренных",
		"из моего списка",
		"что у меня есть",
		"в моей коллекции",
		"from my database",
		"from my watched",
		"among my watched",
		"in my list",
		"in my database",
	];

	if (hybridHints.some((hint) => q.includes(hint))) {
		return "hybrid";
	}

	if (externalHints.some((hint) => q.includes(hint))) {
		return "recommend_external";
	}

	if (dbHints.some((hint) => q.includes(hint))) {
		return "search_db";
	}

	return "search_db";
}

function buildDbSearchPrompt({ query, tasteProfile, mainDatabase, maxResults = 10 }) {
	return `
You are a personal AI movie search assistant.

Your task is to search and rank movies ONLY inside the user's MAIN_DATABASE.

You must handle broad, natural, emotional, and subjective requests, for example:
- "find 10 best comedies in my watched list"
- "what have I already seen that is good for rewatch"
- "find something warm, smart, and not too heavy"
- "which movies from my database fit my taste best right now"

RULES:
1. Search ONLY inside MAIN_DATABASE.
2. Never invent, add, or mention titles that are not present in MAIN_DATABASE.
3. Use TASTE_PROFILE to interpret broad, subjective, or underspecified requests.
4. When the request includes words like "best", "interesting", "rewatchable", "for tonight", "comfort", "smart", "light", "atmospheric",
   infer them using:
   - rating
   - genre
   - notes/comments
   - director patterns
   - similarity to favorite titles in TASTE_PROFILE
5. Prefer movies that match BOTH:
   - the user's explicit request
   - the user's known taste
6. Return fewer results if matches are weak.
7. Keep reasons concrete and specific.
8. Return ONLY valid JSON.

USER REQUEST:
"${query}"

TASTE_PROFILE:
${JSON.stringify(tasteProfile, null, 2)}

MAIN_DATABASE:
${JSON.stringify(mainDatabase, null, 2)}

Return JSON in this exact format:
{
  "mode": "search_db",
  "interpreted_request": {
    "primary_goal": "short explanation",
    "filters": ["filter 1", "filter 2"],
    "ranking_logic": ["logic 1", "logic 2"]
  },
  "taste_summary": "short paragraph relevant to this query",
  "results": [
    {
      "id": "movie id",
      "title": "Movie title",
      "year": 1994,
      "director": "Director name",
      "match_score": 0.0,
      "why_it_matches": "specific reason",
      "why_it_fits_your_taste": "specific reason based on taste profile",
      "match_factors": ["factor 1", "factor 2"],
      "similar_to_your_likes": ["Film 1", "Film 2"]
    }
  ]
}

Return at most ${maxResults} results.
`.trim();
}

function buildExternalPrompt({
	query,
	tasteProfile,
	existingTitles,
	maxResults = 10,
}) {
	return `
You are a personal AI movie recommendation assistant.

Your task is to recommend NEW movies outside the user's database.

RULES:
1. Do NOT recommend or mention movies already present in USER_EXISTING_TITLES.
2. Use TASTE_PROFILE heavily to infer style, tone, pacing, directors, eras, and genres.
3. Be specific and concrete in explanations.
4. Avoid generic mainstream filler if better, more precise matches exist.
5. Return fewer results if matches are weak.
6. Return ONLY valid JSON.

USER REQUEST:
"${query}"

TASTE_PROFILE:
${JSON.stringify(tasteProfile, null, 2)}

USER_EXISTING_TITLES:
${JSON.stringify(existingTitles, null, 2)}

Return JSON in this exact format:
{
  "mode": "recommend_external",
  "taste_summary": "short paragraph",
  "results": [
    {
      "title": "Movie title",
      "year": 1994,
      "director": "Director name",
      "why_it_matches": "specific reason",
      "similar_to_your_likes": ["Film 1", "Film 2"],
      "match_factors": ["factor 1", "factor 2"]
    }
  ]
}

Return at most ${maxResults} results.
`.trim();
}

function buildHybridPrompt({
	query,
	tasteProfile,
	mainDatabase,
	existingTitles,
	dbResultsCount = 7,
	externalResultsCount = 3,
}) {
	return `
You are a personal AI movie assistant working in HYBRID mode.

You must do BOTH:
1. Search inside the user's MAIN_DATABASE
2. Recommend a few NEW movies outside the database

RULES FOR DB RESULTS:
1. Search ONLY inside MAIN_DATABASE
2. Never invent DB titles not present in MAIN_DATABASE
3. Use TASTE_PROFILE to rank and interpret broad requests

RULES FOR EXTERNAL RESULTS:
4. Recommend only titles NOT present in USER_EXISTING_TITLES
5. Use TASTE_PROFILE heavily
6. Keep explanations concrete and specific

GENERAL RULES:
7. The user's request can be broad, emotional, or subjective
8. Return fewer results if matches are weak
9. Return ONLY valid JSON

USER REQUEST:
"${query}"

TASTE_PROFILE:
${JSON.stringify(tasteProfile, null, 2)}

MAIN_DATABASE:
${JSON.stringify(mainDatabase, null, 2)}

USER_EXISTING_TITLES:
${JSON.stringify(existingTitles, null, 2)}

Return JSON in this exact format:
{
  "mode": "hybrid",
  "interpreted_request": {
    "primary_goal": "short explanation",
    "filters": ["filter 1", "filter 2"],
    "ranking_logic": ["logic 1", "logic 2"]
  },
  "taste_summary": "short paragraph",
  "db_results": [
    {
      "id": "movie id",
      "title": "Movie title",
      "year": 1994,
      "director": "Director name",
      "match_score": 0.0,
      "why_it_matches": "specific reason",
      "why_it_fits_your_taste": "specific reason based on taste profile",
      "match_factors": ["factor 1", "factor 2"],
      "similar_to_your_likes": ["Film 1", "Film 2"]
    }
  ],
  "external_suggestions": [
    {
      "title": "Movie title",
      "year": 1994,
      "director": "Director name",
      "why_it_matches": "specific reason",
      "similar_to_your_likes": ["Film 1", "Film 2"],
      "match_factors": ["factor 1", "factor 2"]
    }
  ]
}

Return at most ${dbResultsCount} db_results and at most ${externalResultsCount} external_suggestions.
`.trim();
}

function cleanDbResults(parsedResults, mainDatabase, maxResults = 10) {
	const dbById = new Map(mainDatabase.map((movie) => [String(movie.id), movie]));
	const dbByTitle = new Map(
		mainDatabase.map((movie) => [normalizeText(movie.title), movie])
	);

	return (parsedResults || [])
		.filter((item) => item?.title || item?.id)
		.map((item) => {
			const byId = item?.id ? dbById.get(String(item.id)) : null;
			const byTitle = item?.title ? dbByTitle.get(normalizeText(item.title)) : null;
			const matchedMovie = byId || byTitle || null;

			if (!matchedMovie) return null;

			return {
				id: matchedMovie.id ?? "",
				title: matchedMovie.title || item.title || "",
				year: matchedMovie.year || item.year || "",
				director: matchedMovie.director || item.director || "",
				genre: matchedMovie.genre || "",
				rating: matchedMovie.rating ?? null,
				match_score:
					typeof item.match_score === "number"
						? item.match_score
						: Number(item.match_score || 0),
				why_it_matches: item.why_it_matches || "",
				why_it_fits_your_taste: item.why_it_fits_your_taste || "",
				match_factors: Array.isArray(item.match_factors)
					? uniqStrings(item.match_factors)
					: [],
				similar_to_your_likes: Array.isArray(item.similar_to_your_likes)
					? uniqStrings(item.similar_to_your_likes)
					: [],
			};
		})
		.filter(Boolean)
		.slice(0, maxResults);
}

function cleanExternalResults(parsedResults, existingTitlesSet, maxResults = 10) {
	return (parsedResults || [])
		.filter((item) => item?.title)
		.filter((item) => !existingTitlesSet.has(normalizeText(item.title)))
		.map((item) => ({
			title: item.title || "",
			year: item.year || "",
			director: item.director || "",
			why_it_matches: item.why_it_matches || "",
			similar_to_your_likes: Array.isArray(item.similar_to_your_likes)
				? uniqStrings(item.similar_to_your_likes)
				: [],
			match_factors: Array.isArray(item.match_factors)
				? uniqStrings(item.match_factors)
				: [],
		}))
		.slice(0, maxResults);
}

async function runJsonCompletion(openai, prompt) {
	const completion = await openai.chat.completions.create({
		model: "gpt-5.4-mini",
		response_format: { type: "json_object" },
		messages: [
			{
				role: "developer",
				content:
					"You are a strict personal movie AI assistant. Follow the requested mode exactly. Return valid JSON only. Never invent database titles.",
			},
			{
				role: "user",
				content: prompt,
			},
		],
		temperature: 0.25,
	});

	const content = completion.choices?.[0]?.message?.content || "";
	const parsed = safeJsonParse(content);

	if (!parsed) {
		throw new Error("Model returned invalid JSON");
	}

	return parsed;
}

export default async function handler(req, res) {
	if (req.method !== "POST") {
		return res.status(405).json({ error: "Method not allowed" });
	}

	try {
		if (!process.env.OPENAI_API_KEY) {
			return res.status(500).json({ error: "Missing OPENAI_API_KEY" });
		}

		const { query, mode: requestedMode } = req.body || {};

		if (!query || !String(query).trim()) {
			return res.status(400).json({ error: "Query is required" });
		}

		const openai = new OpenAI({
			apiKey: process.env.OPENAI_API_KEY,
		});

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
			.select("*");

		if (toWatchError) {
			return res.status(500).json({ error: toWatchError.message });
		}

		const mainDatabase = (watchedMovies || []).map(toMovieItem);

		const tasteProfile = (watchedMovies || [])
			.filter((movie) => Number(movie.rating || 0) >= 7)
			.slice(0, 50)
			.map(toMovieItem);

		const existingTitlesSet = new Set(
			[...(watchedMovies || []), ...(toWatchMovies || [])]
				.map((movie) => normalizeText(movie.title))
				.filter(Boolean)
		);

		const existingTitles = [...existingTitlesSet];

		const mode =
			["search_db", "recommend_external", "hybrid"].includes(requestedMode)
				? requestedMode
				: detectMode(query);

		if (mode === "search_db") {
			const prompt = buildDbSearchPrompt({
				query,
				tasteProfile,
				mainDatabase,
				maxResults: 10,
			});

			const parsed = await runJsonCompletion(openai, prompt);

			const results = cleanDbResults(parsed.results, mainDatabase, 10);

			return res.status(200).json({
				mode: "search_db",
				interpreted_request: parsed.interpreted_request || null,
				taste_summary: parsed.taste_summary || "",
				results,
			});
		}

		if (mode === "recommend_external") {
			const prompt = buildExternalPrompt({
				query,
				tasteProfile,
				existingTitles,
				maxResults: 10,
			});

			const parsed = await runJsonCompletion(openai, prompt);

			const results = cleanExternalResults(
				parsed.results,
				existingTitlesSet,
				10
			);

			return res.status(200).json({
				mode: "recommend_external",
				taste_summary: parsed.taste_summary || "",
				results,
			});
		}

		const prompt = buildHybridPrompt({
			query,
			tasteProfile,
			mainDatabase,
			existingTitles,
			dbResultsCount: 7,
			externalResultsCount: 3,
		});

		const parsed = await runJsonCompletion(openai, prompt);

		const dbResults = cleanDbResults(parsed.db_results, mainDatabase, 7);
		const externalSuggestions = cleanExternalResults(
			parsed.external_suggestions,
			existingTitlesSet,
			3
		);

		return res.status(200).json({
			mode: "hybrid",
			interpreted_request: parsed.interpreted_request || null,
			taste_summary: parsed.taste_summary || "",
			db_results: dbResults,
			external_suggestions: externalSuggestions,
		});
	} catch (error) {
		console.error("MOVIE_AI_HANDLER_ERROR", error);

		return res.status(500).json({
			error: error?.message || "Unexpected server error",
			type: error?.type || null,
			status: error?.status || null,
		});
	}
}