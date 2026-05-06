import OpenAI from "openai";

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
		return res.status(405).json({
			error: "Method not allowed",
		});
	}

	try {
		const { rawComment, movie } = req.body;

		if (!rawComment || typeof rawComment !== "string") {
			return res.status(400).json({
				error: "Missing rawComment",
			});
		}

		const compactMovie = {
			title: movie?.title || "",
			director: movie?.director || "",
			year: movie?.year || "",
			rating: movie?.rating || "",
			existingTags: Array.isArray(movie?.tags) ? movie.tags : [],
		};

		const completion = await openai.chat.completions.create({
			model: "gpt-4.1-mini",
			temperature: 0.4,
			messages: [
				{
					role: "system",
					content: `
You help improve short personal movie notes.

Task:
- Rewrite the user's raw note into a clear, natural personal movie comment.
- Keep the meaning and tone.
- Do not make it pompous.
- Do not invent plot details.
- Do not write a long review.
- Keep it to 1–2 sentences.
- Return exactly 10 tag options.
- Tags should be short, lowercase, and useful for a personal movie library.
- Tags may describe genre, mood, style, period, use-case, or personal category.
- Avoid generic tags like "movie", "film", "cinema".
- If the user's note is in Russian, write the comment in Russian.
- If the user's note is in English, write the comment in English.
- Tags may be in English unless the raw note strongly suggests Russian tags.
- Return only valid JSON.
- Do not wrap JSON in markdown.

Response format:
{
  "comment": "Improved comment",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5", "tag6", "tag7", "tag8", "tag9", "tag10"]
}
          `.trim(),
				},
				{
					role: "user",
					content: JSON.stringify({
						rawComment,
						movie: compactMovie,
					}),
				},
			],
		});

		const text = completion.choices[0]?.message?.content || "{}";
		const parsed = safeJsonParse(text);

		if (!parsed) {
			return res.status(500).json({
				error: "AI returned invalid JSON",
				raw: text,
			});
		}

		return res.status(200).json({
			comment: parsed.comment || rawComment,
			tags: Array.isArray(parsed.tags) ? parsed.tags.slice(0, 10) : [],
		});
	} catch (error) {
		console.error("Improve comment error:", error);

		return res.status(500).json({
			error: "Failed to improve comment",
			details: error.message,
		});
	}
}