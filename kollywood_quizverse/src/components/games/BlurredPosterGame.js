import React, { useState, useEffect, useContext } from "react";
import { fetchPopularTamilMovies, getPosterUrl } from "../../tmdbApi";
import { QuizContext } from "../../context/QuizContext";
import "./BlurredPosterGame.css";

const BLUR_STEPS = [12, 6, 2, 0];
const MAX_ATTEMPTS = 3;

function normalizeTitle(title) {
  return (title || "").replace(/[^a-z0-9]/gi, "").toLowerCase();
}

// PUBLIC_INTERFACE
export default function BlurredPosterGame() {
  const { dispatch } = useContext(QuizContext);
  const [movie, setMovie] = useState(null);
  const [userGuess, setUserGuess] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState(null);

  useEffect(() => {
    async function pickMovie() {
      const movies = await fetchPopularTamilMovies(7 + Math.floor(Math.random()*6));
      setMovie(movies[Math.floor(Math.random()*movies.length)]);
    }
    pickMovie();
  }, []);

  if (!movie) return <div style={{minHeight:250}}>Loading movie poster...</div>;

  function handleGuess(e) {
    e.preventDefault();
    if (normalizeTitle(userGuess) === normalizeTitle(movie.title)) {
      setResult("win");
      addScore(true);
    } else if (attempt + 1 < MAX_ATTEMPTS) {
      setAttempt(attempt + 1);
    } else {
      setResult("lose");
      addScore(false);
    }
    setUserGuess("");
  }

  function addScore(win) {
    dispatch({ type: "ADD_SCORE_HISTORY", payload: {
      game: "Blurred Poster",
      score: win ? 5 - attempt : 0,
      time: new Date().toLocaleString()
    }});
  }

  function close() {
    dispatch({ type: "CLOSE_MODAL" });
  }

  return (
    <div className="kv-game-modal">
      <h2>Guess the Movie: Blurred Poster</h2>
      <div className="kv-blur-poster-row">
        <img
          src={getPosterUrl(movie.poster_path)}
          style={{ 
            filter: `blur(${BLUR_STEPS[attempt]}px)`, 
            width: 220, 
            borderRadius: 16,
            background: "#232"
          }}
          alt="Movie Blurred Poster"
        />
      </div>
      {result === null ? (
        <form className="kv-guess-form" onSubmit={handleGuess}>
          <input
            className="kv-guess-input"
            type="text"
            placeholder="Type the movie name..."
            value={userGuess}
            onChange={e => setUserGuess(e.target.value)}
            maxLength={40}
            required
          />
          <button className="kv-btn">Guess</button>
        </form>
      ) : result === "win" ? (
        <div className="kv-result-win">
          🎉 Correct! It was <b>{movie.title}</b>.
          <button className="kv-btn" onClick={close}>Close</button>
        </div>
      ) : (
        <div className="kv-result-lose">
          ❌ Sorry, the answer was <b>{movie.title}</b>.
          <button className="kv-btn" onClick={close}>Close</button>
        </div>
      )}
      <div className="kv-hint-row">{MAX_ATTEMPTS - attempt} tries left.</div>
    </div>
  );
}
