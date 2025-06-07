import React, { useEffect, useState, useContext } from "react";
import { fetchToughTamilMovies, getPosterUrl } from "../../tmdbApi";
import { QuizContext } from "../../context/QuizContext";
import { useNavigate } from "react-router-dom";
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

// PUBLIC_INTERFACE
/**
 * MovieBingoGame can be used in a modal or as a standalone page.
 * If 'standalone' prop is true, launch as a full-page, track session and show Back button.
 * Score is calculated by categories completed and shown after submit.
 */
export default function MovieBingoGame({ standalone }) {
  const [movies, setMovies] = useState([]);
  const [clicked, setClicked] = useState({});
  const [done, setDone] = useState(false);
  const [score, setScore] = useState(0); // score == completed cells
  const { dispatch } = useContext(QuizContext);
  const navigate = useNavigate();

  useEffect(() => {
    async function load() {
      // Fetch a broad, tough pool for all bingo categories
      const data = await fetchToughTamilMovies({ count: 45 });
      setMovies(data.map(m => ({ ...m })));
      setClicked({});
      setDone(false);
      setScore(0);
    }
    load();
    // eslint-disable-next-line
  }, [standalone]);

  // Remove effect for standalone auto home. Users navigate manually after completion.

  // "Back" button for page
  function handleGoBack() {
    if (standalone) {
      navigate(-1);
    } else {
      dispatch({ type: "CLOSE_MODAL" });
    }
  }

  function handleClick(catIdx, movieId) {
    setClicked(prev => ({ ...prev, [`${catIdx}_${movieId}`]: true }));
  }

  // For scoring: count # of distinct categories with at least 1 selected
  function calcBingoScore() {
    let categoriesWithSelection = new Set();
    Object.keys(clicked).forEach(key => {
      const [catIdx] = key.split("_");
      categoriesWithSelection.add(Number(catIdx));
    });
    return categoriesWithSelection.size;
  }

  function handleSubmit() {
    const sessionScore = calcBingoScore();
    setScore(sessionScore);
    setDone(true);
    dispatch({
      type: "ADD_SCORE_HISTORY",
      payload: {
        game: "Movie Bingo",
        score: sessionScore,
        time: new Date().toLocaleString()
      }
    });
  }

  function handleCloseOrHome() {
    if (standalone) {
      navigate("/");
    } else {
      dispatch({ type: "CLOSE_MODAL" });
    }
  }

  // Show session UI with Back, Score, Board, and submit/final pane
  const headerRowStyle = {
    display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10
  };
  const scoreBoxStyle = {
    background: "#ffd600", color: "#d32f2f", fontWeight: 700,
    fontSize: "1.08rem", borderRadius: 7, padding: "4px 17px", minWidth: 65, textAlign: "center",
    boxShadow: "0 1px 8px #efb01d21", display: "inline-block"
  };

  return (
    <div className="kv-game-modal">
      {(standalone || true) && (
        <div style={headerRowStyle}>
          <button
            className="kv-btn kv-btn-accent"
            style={{ minWidth: 58 }}
            onClick={handleGoBack}
            disabled={standalone && done}
            title={standalone && done ? "Returning to home..." : ""}
          >
            &larr; Back
          </button>
          <div style={scoreBoxStyle}>
            Score: {done ? score : calcBingoScore()} / {BINGO_CATEGORIES.length}
          </div>
        </div>
      )}
      <h2>Kollywood Movie Bingo</h2>
      <div className="kv-bingo-board">
        {BINGO_CATEGORIES.map((cat, catIdx) => (
          <div key={cat} className="kv-bingo-cell">
            {cat}
            <div className="kv-bingo-movies">
              {movies
                .filter(m => getCategoryForMovie(m) === catIdx)
                .map((m) => {
                  const clickKey = `${catIdx}_${m.id}`;
                  return (
                    <div
                      key={m.id}
                      className={
                        clicked[clickKey]
                          ? "kv-bingo-movie-selected"
                          : "kv-bingo-movie"
                      }
                      style={done ? { opacity: 0.65, cursor: "not-allowed" } : {}}
                      onClick={() => {
                        if (!done) handleClick(catIdx, m.id);
                      }}
                    >
                      <img
                        src={getPosterUrl(m.poster_path, "w154")}
                        alt={m.title}
                        style={{ width: 46, borderRadius: "7px" }}
                      />
                      <div style={{ fontSize: 10 }}>{m.title}</div>
                    </div>
                  );
                })}
            </div>
          </div>
        ))}
      </div>
      {!done ? (
        <button
          className="kv-btn"
          style={{ marginTop: 12 }}
          onClick={handleSubmit}
          disabled={done}
        >
          Submit
        </button>
      ) : (
        <div style={{ marginTop: 18 }}>
          <div style={{ fontWeight: 600, fontSize: "1.15rem", color: "#439638" }}>
            Bingo! Final Score: {score} / {BINGO_CATEGORIES.length}
          </div>
          {standalone ? (
            <div style={{ color: "#439638", fontSize: 13, marginTop: 7, fontWeight: 500 }}>
              Bingo complete. Use 'Back' to return or refresh for a new game!
            </div>
          ) : null}
          <button
            className="kv-btn"
            style={{ marginLeft: 16, marginTop: 5 }}
            onClick={handleCloseOrHome}
            disabled={standalone}
            title={standalone ? "Returning to home..." : ""}
          >
            {standalone ? "Go Home" : "Close"}
          </button>
        </div>
      )}
    </div>
  );
}
