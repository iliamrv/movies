import { searchOmdb, fetchOmdbById } from "../../src/api/omdb";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed",
    });
  }

  try {
    const { imdb, exactTitle, year, search } = req.body || {};

    if (imdb) {
      const data = await fetchOmdbById(imdb);

      if (!data) {
        return res.status(404).json({
          error: "Movie not found",
        });
      }

      return res.status(200).json(data);
    }

    if (exactTitle || search) {
      if (exactTitle) {
        const results = await searchOmdb(exactTitle, year);

        if (results.length > 0) {
          const [first] = results;

          if (
            first.Title === exactTitle ||
            (year && String(first.Year).includes(String(year)))
          ) {
            return res.status(200).json({
              Response: "True",
              imdbID: first.imdbID,
              Title: first.Title,
              Year: first.Year,
              Type: first.Type,
            });
          }
        }
      }

      const results = await searchOmdb(search || exactTitle, year);

      return res.status(200).json({
        Response: results.length > 0 ? "True" : "False",
        Search: results,
      });
    }

    return res.status(400).json({
      error: "Missing OMDb query params",
    });
  } catch (error) {
    console.error("OMDb API route error:", error);

    return res.status(500).json({
      error: error.message || "Failed to query OMDb",
    });
  }
}
