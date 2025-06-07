import React, { useEffect, useState, useContext } from "react";
import { fetchPopularTamilMovies, getPosterUrl } from "../../tmdbApi";
import { QuizContext } from "../../context/QuizContext";
import "./MovieBingoGame.css";

const BINGO_CATEGORIES = [
  "Rajini film", "Vijay film", "Song by ARR", "Movie after 2020",
  "Blockbuster", "Comedy", "Remake", "Action", "Family drama"
];

// Just checks for title/genre/overview matching keywords
function getCategoryForMovie(movie) {
  const lowerTitle = (movie.title || "").toLowerCase();
  if (lowerTitle.includes("rajini")) return 0;
  if (lowerTitle.includes("vijay")) return 1;
  if ((movie.overview || "").match(/(ar rahman|a.r.rahman|arr)/i)) return 2;
  if (movie.release_date && parseInt(movie.release_date) >= 2020) return 3;
  if ((movie.overview || "").includes("blockbuster")) return 4;
  if ((movie.genre_ids || []).includes(35)) return 5; // Comedy
  if ((movie.overview || "").includes("remake")) return 6;
  if ((movie.genre_ids || []).includes(28)) return 7; // Action
  if ((movie.genre_ids || []).includes(18)) return 8; // Drama
  return -1;
}

export default function MovieBingoGame() {
  const [movies, setMovies] = useState([]);
  const [clicked, setClicked] = useState({});
  const [done, setDone] = useState(false);
  const { dispatch } = useContext(QuizContext);

  useEffect(() => {
    async function load() {
      const data = await fetchPopularTamilMovies(16);
      setMovies(data.map(m => ({ ...m })));
    }
    load();
  }, []);

  function handleClick(idx) {
    setClicked({ ...clicked, [idx]: true });
  }

  function checkWin() {
    let matches = 0;
    for (let i = 0; i < movies.length; ++i) {
      if (clicked[i]) matches++;
    }
    setDone(true);
    dispatch({
      type: "ADD_SCORE_HISTORY",
      payload: {
        game: "Movie Bingo",
        score: matches,
        time: new Date().toLocaleString()
      }
    });
  }

  function close() {
    dispatch({ type: "CLOSE_MODAL" });
  }

  return (
    <div className="kv-game-modal">
      <h2>Kollywood Movie Bingo</h2>
      <div className="kv-bingo-board">
        {BINGO_CATEGORIES.map((cat, i) => (
          <div key={cat} className="kv-bingo-cell">
            {cat}
            <div className="kv-bingo-movies">
              {movies
                .filter(m => getCategoryForMovie(m) === i)
                .map((m, idx) => (
                  <div 
                    key={m.id}
                    className={
                      clicked[idx] ? "kv-bingo-movie-selected" : "kv-bingo-movie"
                    }
                    onClick={() => handleClick(idx)}
                  >
                    <img 
                      src={getPosterUrl(m.poster_path, "w154")} 
                      alt={m.title} 
                      style={{ width: 46, borderRadius: "7px" }} 
                    />
                    <div style={{ fontSize: 10 }}>{m.title}</div>
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>
      <button className="kv-btn" style={{ marginTop: 12 }} onClick={checkWin} disabled={done}>Submit</button>
      {done && (
        <div style={{ marginTop: 14 }}>
          <b>Bingo! Score: {Object.keys(clicked).length}</b>
          <button className="kv-btn" onClick={close} style={{ marginLeft: 16 }}>
            Close
          </button>
        </div>
      )}
    </div>
  );
}
