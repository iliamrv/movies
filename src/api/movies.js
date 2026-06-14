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

export async function getLibraryMovies(limit = 1000) {
	return supabase
		.from(TABLE_NAME)
		.select(`
      id,
      title,
      director,
      year,
      rating,
      watchTime,
      watch_dates,
      watch_date_precision,
      imdb,
      comment,
      rewatch_mark,
      tags,
      search_text,
      external_meta
    `)
		.eq("watched_mark", true)
		.order("watchTime", { ascending: false, nullsFirst: false })
		.limit(limit);
}

export async function getMovieById(id) {
	return supabase.from(TABLE_NAME).select("*").eq("id", id).single();
}

export async function getUnwatchedMovies() {
	return supabase
		.from(TABLE_NAME)
		.select(`
      id,
      title,
      director,
      year,
      imdb,
      priority,
      watched_mark,
      towatch_cycle_seen_at,
      external_meta
    `)
		.eq("watched_mark", false);
}

export async function updateMovieById(id, payload) {
	return supabase
		.from(TABLE_NAME)
		.update(payload)
		.eq("id", id)
		.select()
		.single();
}

export async function deleteMovieById(id) {
	return supabase.from(TABLE_NAME).delete().eq("id", id);
}

export async function updateMoviePriority(id, priority) {
	return supabase
		.from(TABLE_NAME)
		.update({ priority })
		.eq("id", id);
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
		.update({ watched_mark: true, ...payload })
		.eq("id", id)
		.select()
		.single();
}

export async function markTowatchMoviesAsSeen(ids) {
	if (!Array.isArray(ids) || ids.length === 0) {
		return { data: null, error: null };
	}

	return supabase
		.from(TABLE_NAME)
		.update({ towatch_cycle_seen_at: new Date().toISOString() })
		.in("id", ids);
}

export async function resetTowatchCycle() {
	return supabase
		.from(TABLE_NAME)
		.update({ towatch_cycle_seen_at: null })
		.eq("watched_mark", false)
		.or("priority.is.null,priority.neq.high");
}

export async function createMovie(payload) {
	return supabase.from(TABLE_NAME).insert(payload).select().single();
}
