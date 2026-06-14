const API_KEY = process.env.OMDB_API_KEY;

function isBrowser() {
  return typeof window !== "undefined";
}

function getOmdbUrl(searchParams) {
  if (!API_KEY) {
    throw new Error("Missing OMDB_API_KEY");
  }

  return `https://www.omdbapi.com/?${searchParams}&apikey=${API_KEY}`;
}

async function fetchOmdbDirect(searchParams) {
  const res = await fetch(getOmdbUrl(searchParams));
  return res.json();
}

async function fetchOmdbViaApi(params) {
  const response = await fetch("/api/omdb", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(params),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "OMDb proxy request failed");
  }

  return data;
}

async function requestOmdb(params) {
  if (isBrowser()) {
    return fetchOmdbViaApi(params);
  }

  if (params.imdb) {
    return fetchOmdbDirect(`i=${encodeURIComponent(params.imdb)}`);
  }

  if (params.exactTitle) {
    const searchParams = new URLSearchParams({
      t: params.exactTitle,
    });

    if (params.year) {
      searchParams.set("y", String(params.year));
    }

    return fetchOmdbDirect(searchParams.toString());
  }

  if (params.search) {
    return fetchOmdbDirect(`s=${encodeURIComponent(params.search)}`);
  }

  throw new Error("Unsupported OMDb request");
}

export async function fetchOmdbById(imdb) {
  if (!imdb) return null;

  try {
    const data = await requestOmdb({
      imdb: String(imdb).trim(),
    });

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

export async function searchOmdb(title, year) {
  if (!title) return [];

  try {
    const exactData = await requestOmdb({
      exactTitle: title,
      year,
    });

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

    const query = year ? `${title} ${year}` : title;
    const data = await requestOmdb({
      search: query,
    });

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

export function mergeMovieData(movie, imdbData) {
  if (!imdbData) return movie;

  const nextDirector =
    imdbData.Director && imdbData.Director !== "N/A"
      ? imdbData.Director
      : movie.director;

  return {
    ...movie,
    ...imdbData,
    title: imdbData.Title || movie.title,
    year:
      imdbData.Year && /^\d{4}$/.test(imdbData.Year)
        ? Number(imdbData.Year)
        : movie.year,
    director: nextDirector,
  };
}
