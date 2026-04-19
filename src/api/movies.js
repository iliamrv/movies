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
	return supabase
		.from(TABLE_NAME)
		.select("*")
		.eq("id", id)
		.single();
}

export async function getUnwatchedMovies() {
	return supabase
		.from(TABLE_NAME)
		.select("*")
		.eq("watched_mark", false);
}

export async function updateMovieById(id, payload) {
	return supabase
		.from(TABLE_NAME)
		.update(payload)
		.eq("id", id);
}

export async function deleteMovieById(id) {
	return supabase
		.from(TABLE_NAME)
		.delete()
		.eq("id", id);
}

export async function updateMoviePriority(id, priority) {
	return supabase
		.from(TABLE_NAME)
		.update({ priority })
		.eq("id", id);
}