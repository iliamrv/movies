import { fetchOmdbById } from "../api/omdb";

export function buildWatchDatePayload({
  watchDatePrecision,
  watchTime,
  watchYear,
}) {
  if (watchDatePrecision === "year") {
    return watchYear ? `${watchYear}-01-01` : null;
  }

  return watchTime || null;
}

export async function fetchMovieByImdbId(imdbId) {
  return fetchOmdbById(String(imdbId || "").trim());
}
