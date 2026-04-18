const API_KEY = "8aab931f"; // позже можно вынести в .env

// 👉 Получить фильм по IMDb ID
export async function fetchOmdbById(imdb) {
	if (!imdb) return null;

	try {
		const res = await fetch(
			`https://www.omdbapi.com/?i=${encodeURIComponent(imdb)}&apikey=${API_KEY}`
		);

		const data = await res.json();

		if (data.Response === "True") {
			return data;
		}

		console.log("OMDb error:", data.Error);
		return null;
	} catch (e) {
		console.log("OMDb fetch failed:", e);
		return null;
	}
}

// 👉 Поиск фильма (используется в edit page)
export async function searchOmdb(title, year) {
	if (!title) return [];

	try {
		// 1. Сначала пробуем точное совпадение
		const exactUrl = year
			? `https://www.omdbapi.com/?t=${encodeURIComponent(
				title
			)}&y=${encodeURIComponent(year)}&apikey=${API_KEY}`
			: `https://www.omdbapi.com/?t=${encodeURIComponent(
				title
			)}&apikey=${API_KEY}`;

		const exactRes = await fetch(exactUrl);
		const exactData = await exactRes.json();

		if (exactData.Response === "True") {
			return [
				{
					imdbID: exactData.imdbID,
					Title: exactData.Title,
					Year: exactData.Year,
					Type: exactData.Type,
				},
			];
		}

		// 2. Если нет — обычный поиск
		const query = year ? `${title} ${year}` : title;

		const res = await fetch(
			`https://www.omdbapi.com/?s=${encodeURIComponent(query)}&apikey=${API_KEY}`
		);

		const data = await res.json();

		if (data.Response === "True" && Array.isArray(data.Search)) {
			return data.Search;
		}

		console.log("OMDb search error:", data.Error);
		return [];
	} catch (e) {
		console.log("OMDb search failed:", e);
		return [];
	}
}

// 👉 Объединить данные БД + OMDb
export function mergeMovieData(movie, imdbData) {
	if (!imdbData) return movie;

	return {
		...movie,
		...imdbData,

		// 🔥 сохраняем fallback если OMDb пустой
		title: imdbData.Title || movie.title,
		year:
			imdbData.Year && /^\d{4}$/.test(imdbData.Year)
				? Number(imdbData.Year)
				: movie.year,
		director: imdbData.Director || movie.director,
	};
}