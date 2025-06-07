//
// TMDb API utility for Kollywood QuizVerse
// PUBLIC_INTERFACE
/**
 * Fetches movie data related to Kollywood/Tamil cinema from TMDb API.
 * In a real app, store the API key in environment (.env), not in code.
 */

const TMDB_API_KEY = "5bc67d3b06aecbd18121a3cbbc16eb59"; // Provided for demo use only
const TMDB_BASE_URL = "https://api.themoviedb.org/3";

/**
 * Experimental advanced fetcher for "hard" (less popular) Kollywood (Tamil) movies.
 * Fetches a larger pool of movies, sorts by lower popularity and vote_count, filters for poster presence and uniqueness.
 * Returns a random, non-repeating sample (without replacement) for the session/game.
 * API: await fetchToughTamilMovies({ count: 10 })
 * 
 * PUBLIC_INTERFACE
 */
export async function fetchToughTamilMovies({ count = 10, minPool = 60, maxPages = 5 } = {}) {
  try {
    const pool = [];
    let page = 1;
    while (pool.length < minPool && page <= maxPages) {
      // Fetch a page with low popularity, sufficient vote_count (avoid zero/very obscure), Tamil language
      // We bias towards "tough" by moving to higher page numbers (less popular movies)
      const url = `${TMDB_BASE_URL}/discover/movie?api_key=${TMDB_API_KEY}&with_original_language=ta&sort_by=popularity.asc&vote_count.gte=10&page=${page}`;
      const resp = await fetch(url);
      if (!resp.ok) break;
      const data = await resp.json();
      // Only movies with posters and released after 1985 (avoid very old/irrelevant/out-of-scope)
      const filtered = (data.results || []).filter(m =>
        m.poster_path &&
        m.release_date &&
        m.vote_count >= 10 &&
        (typeof m.title === "string") &&
        (parseInt(m.release_date.slice(0, 4), 10) > 1985)
      );
      pool.push(...filtered);
      page++;
    }
    // Remove duplicate movie IDs
    const unique = [];
    const seen = new Set();
    for (const m of pool) {
      if (!seen.has(m.id)) { unique.push(m); seen.add(m.id); }
    }
    // Sort by ascending popularity and vote_count (least popular and voted come first)
    unique.sort((a, b) => (a.popularity - b.popularity) || (a.vote_count - b.vote_count));
    // Shuffle
    for (let i = unique.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [unique[i], unique[j]] = [unique[j], unique[i]];
    }
    // Final sample
    return unique.slice(0, count).map(movie => ({
      id: movie.id,
      title: movie.title,
      poster_path: movie.poster_path,
      release_date: movie.release_date,
      overview: movie.overview,
      genre_ids: movie.genre_ids,
      vote_count: movie.vote_count,
      popularity: movie.popularity
    }));
  } catch (err) {
    console.error("Failed to fetch tough Tamil movies:", err);
    return [];
  }
}

/** 
 * Legacy: Still fetches highly popular Tamil movies for fallback/compat/leaderboards etc.
 * PUBLIC_INTERFACE
 */
export async function fetchPopularTamilMovies(count = 3) {
  try {
    const url = `${TMDB_BASE_URL}/discover/movie?api_key=${TMDB_API_KEY}&with_original_language=ta&sort_by=popularity.desc`;
    const response = await fetch(url);
    if (!response.ok) throw new Error("TMDb API error");
    const data = await response.json();
    return (data.results || []).slice(0, count).map(movie => ({
      id: movie.id,
      title: movie.title,
      poster_path: movie.poster_path,
      release_date: movie.release_date,
      overview: movie.overview,
      genre_ids: movie.genre_ids,
      vote_count: movie.vote_count,
      popularity: movie.popularity
    }));
  } catch (err) {
    console.error("Failed to fetch Tamil movies from TMDb:", err);
    return [];
  }
}

// PUBLIC_INTERFACE
export function getPosterUrl(path, size = "w300") {
  /**
   * Get the full image URL for a poster path returned by TMDb.
   * @param {string} path 
   * @param {string} size 
   * @returns {string}
   */
  if (!path) return "";
  return `https://image.tmdb.org/t/p/${size}${path}`;
}
