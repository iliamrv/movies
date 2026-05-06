import supabase from "../supabase";

const TABLE_NAME = "movies_2024";

export async function getWatchedMovies(limit = 20) {
	return supabase
		.from(TABLE_NAME)
		.select("*")
		.eq("watched_mark", true)
		.order("watchTime", { ascending: false, nullsFirst: false })
		.limit(limit);
}

export async function getMovieById(id) {
	return supabase.from(TABLE_NAME).select("*").eq("id", id).single();
}

export async function getUnwatchedMovies() {
	return supabase.from(TABLE_NAME).select("*").eq("watched_mark", false);
}


export async function deleteMovieById(id) {
	return supabase.from(TABLE_NAME).delete().eq("id", id);
}

export async function updateMoviePriority(id, priority) {
	return supabase.from(TABLE_NAME).update({ priority }).eq("id", id);
}

export async function updateMovieRewatchMark(id, rewatch_mark) {
	return supabase
		.from(TABLE_NAME)
		.update({ rewatch_mark })
		.eq("id", id)
		.select()
		.single();
}

export async function markMovieAsWatched(id, payload) {
	return supabase
		.from(TABLE_NAME)
		.update({
			watched_mark: true,
			...payload,
		})
		.eq("id", id)
		.select()
		.single();
}

export async function getWatchedMoviesPage({
	page = 1,
	pageSize = 25,
	sortKey = "watchTime",
	sortDirection = "desc",
} = {}) {
	const from = (page - 1) * pageSize;
	const to = from + pageSize - 1;

	const allowedSortKeys = ["title", "director", "year", "rating", "watchTime"];
	const safeSortKey = allowedSortKeys.includes(sortKey) ? sortKey : "watchTime";

	return supabase
		.from(TABLE_NAME)
		.select(
			`
      id,
      title,
      director,
      year,
      rating,
      watchTime,
      imdb,
      comment,
      external_meta,
      rewatch_mark
    `,
			{ count: "exact" }
		)
		.eq("watched_mark", true)
		.order(safeSortKey, {
			ascending: sortDirection === "asc",
			nullsFirst: false,
		})
		.range(from, to);
}

export async function createMovie(payload) {
	return supabase.from(TABLE_NAME).insert(payload).select().single();
}

export async function updateMovieById(id, payload) {
	return supabase
		.from(TABLE_NAME)
		.update(payload)
		.eq("id", id)
		.select()
		.single();
}