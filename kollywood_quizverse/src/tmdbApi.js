//
// TMDb API utility for Kollywood QuizVerse
// PUBLIC_INTERFACE
/**
 * Fetches movie data related to Kollywood/Tamil cinema from TMDb API.
 * In a real app, store the API key in environment (.env), not in code.
 */

const TMDB_API_KEY = "5bc67d3b06aecbd18121a3cbbc16eb59"; // Provided for demo use only
const TMDB_BASE_URL = "https://api.themoviedb.org/3";

// Optionally you can search for movies with 'with_original_language=ta' (Tamil), or filter by region
// For demo, let's fetch popular movies in Tamil
// PUBLIC_INTERFACE
export async function fetchPopularTamilMovies(count = 3) {
  /**
   * Gets a list of popular Tamil movies from TMDb.
   * @param {number} count Number of movies to return from API.
   * @returns {Promise<Array>} Array of movie objects (id, title, poster_path).
   */
  try {
    const url = `${TMDB_BASE_URL}/discover/movie?api_key=${TMDB_API_KEY}&with_original_language=ta&sort_by=popularity.desc`;
    const response = await fetch(url);
    if (!response.ok) throw new Error("TMDb API error");
    const data = await response.json();
    return (data.results || []).slice(0, count).map(movie => ({
      id: movie.id,
      title: movie.title,
      poster_path: movie.poster_path
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
