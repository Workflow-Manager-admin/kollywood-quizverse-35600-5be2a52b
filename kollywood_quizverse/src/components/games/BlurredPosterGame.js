import React, { useState, useEffect, useContext } from "react";
import { fetchToughTamilMovies, getPosterUrl } from "../../tmdbApi";
import { QuizContext } from "../../context/QuizContext";
import { useNavigate, useLocation } from "react-router-dom";
import "./BlurredPosterGame.css";

// PUBLIC_INTERFACE
/**
 * BlurredPosterGame:
 * - Records and displays user's score for the session (live and at the end),
 * - Allows user to return to previous page/dashboard using 'Back' button (useNavigate).
 */
const BLUR_STEPS = [12, 6, 2, 0];
const MAX_ATTEMPTS = 3;
const NUM_ROUNDS = 10;

// Helper: Get main cast/actor clue by fetching TMDb credits
async function getCastClue(movieId) {
  const url = `https://api.themoviedb.org/3/movie/${movieId}/credits?api_key=5bc67d3b06aecbd18121a3cbbc16eb59`;
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const data = await response.json();
    const cast = (data.cast || []).slice(0, 3).map(m => m.name).filter(Boolean);
    if (cast.length > 0) return "Stars: " + cast.join(", ");
    return null;
  } catch {
    return null;
  }
}

function normalizeTitle(title) {
  return (title || "").replace(/[^a-z0-9]/gi, "").toLowerCase();
}

// Generate up to two clues for a poster. First is year, second is actor/cast.
async function getCluesForMovie(movie) {
  const clues = [];
  if (movie.release_date) {
    const year = new Date(movie.release_date).getFullYear();
    clues.push("Release year: " + year);
  }
  const actorClue = await getCastClue(movie.id);
  if (actorClue) clues.push(actorClue);
  if (clues.length < 2 && movie.title) {
    clues.push("Title contains: " + movie.title.split(" ")[0]);
  }
  return clues;
}

/**
 * FIX: React hooks must not be conditional on render — all hooks must always run in the same order on every render.
 * This version lifts the loading/no-movies conditionals out of the main render function and always runs all hooks first.
 */

export default function BlurredPosterGame({ standalone }) {
  const { dispatch } = useContext(QuizContext);

  // Game state
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [round, setRound] = useState(0);
  const [userGuess, setUserGuess] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [score, setScore] = useState(0); // session-persisted unless reload
  const [showResult, setShowResult] = useState(null); // 'win'/'lose'/null/reveal
  const [answers, setAnswers] = useState([]);

  // Clue state
  const [clueCount, setClueCount] = useState(0);
  const [clues, setClues] = useState([]);
  const [cluesLoading, setCluesLoading] = useState(false);

  const navigate = useNavigate();

  // "Back" button handler
  function handleGoBack() {
    if (standalone) {
      navigate(-1);
    } else {
      dispatch({ type: "CLOSE_MODAL" });
    }
  }

  function handleNext() {
    if (round + 1 < NUM_ROUNDS) {
      setRound(round + 1);
      setAttempt(0);
      setShowResult(null);
      setUserGuess("");
      setClueCount(0);
      setClues([]);
      setCluesLoading(false);
    }
  }

  // Memoized so it is stable in deps
  const handleFinish = React.useCallback(() => {
    // Persist score to context history
    dispatch({
      type: "ADD_SCORE_HISTORY",
      payload: {
        game: "Blurred Poster",
        score: score,
        time: new Date().toLocaleString(),
      },
    });
    if (standalone) {
      navigate("/");
    } else {
      dispatch({ type: "CLOSE_MODAL" });
    }
  // eslint-disable-next-line
  }, [dispatch, navigate, score, standalone]);

  // Handler for clue button
  const handleGetClue = async () => {
    if (clueCount >= 2) return;
    if (clues.length >= clueCount + 1) {
      setClueCount(clueCount + 1);
      return;
    }
    setCluesLoading(true);
    const fullClues = clues.length
      ? clues
      : await getCluesForMovie(movies[round]);
    setClues(fullClues);
    setClueCount(clueCount + 1);
    setCluesLoading(false);
  };

  // Guess handler
  function handleGuess(e) {
    e.preventDefault();
    if (!movies[round]) return;
    const movie = movies[round];
    if (normalizeTitle(userGuess) === normalizeTitle(movie.title)) {
      setShowResult("win");
      setScore(prevScore => prevScore + (5 - attempt));
      setAnswers(a => [...a, { correct: true, title: movie.title }]);
    } else if (attempt + 1 < MAX_ATTEMPTS) {
      setAttempt(attempt + 1);
      setUserGuess("");
      return;
    } else {
      setShowResult("lose");
      setAnswers(a => [...a, { correct: false, title: movie.title }]);
    }
    setUserGuess("");
  }

  // Fetch a tough (unpopular, less repeated) set of Kollywood movies for game rounds
  useEffect(() => {
    async function loadMovies() {
      setLoading(true);
      // Fetch a large enough pool for sampling
      const moviesArr = await fetchToughTamilMovies({ count: NUM_ROUNDS });
      setMovies(moviesArr);
      setAnswers([]);
      setRound(0); setScore(0); setAttempt(0); setShowResult(null); setUserGuess("");
      setClueCount(0); setClues([]); setCluesLoading(false);
      setLoading(false);
    }
    loadMovies();
    // eslint-disable-next-line
  }, []);

  // Reset clue state for new round/movie
  useEffect(() => {
    setClueCount(0);
    setClues([]);
    setCluesLoading(false);
  }, [round]);

  // Last round, just finished: show result (do not auto home)
  // Remove auto-redirect after game completion for consistency
  // Display score/results; Back button will be present for user to go back at their pace

  // --- No early returns for hooks ---
  // Instead, assign variables to conditionally render below

  let mainContent = null;

  const movie = movies[round];
  const headerRowStyle = {
    display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10
  };
  const scoreBoxStyle = {
    background: "#ffd600", color: "#d32f2f", fontWeight: 700,
    fontSize: "1.08rem", borderRadius: 7, padding: "4px 17px", minWidth: 65, textAlign: "center",
    boxShadow: "0 1px 8px #efb01d21", display: "inline-block"
  };

  if (loading) {
    mainContent = <div style={{ minHeight: 250 }}>Loading movie posters...</div>;
  }
  else if (!movie) {
    mainContent = <div style={{ minHeight: 250 }}>No movie found for this round.</div>;
  }
  else if (round === NUM_ROUNDS - 1 && showResult !== null) {
    // Just finished the last round, show result (NO auto-redirect!)
    mainContent = (
      <div>
        <div style={headerRowStyle}>
          <button
            className="kv-btn kv-btn-accent"
            style={{ minWidth: 58 }}
            onClick={handleGoBack}
          >
            &larr; Back
          </button>
          <div style={scoreBoxStyle}>
            Score: {score} / {NUM_ROUNDS * 5}
          </div>
        </div>
        <h2>Guess the Movie: Blurred Poster</h2>
        <div className="kv-blur-poster-row">
          <img
            src={getPosterUrl(movie.poster_path)}
            style={{
              filter: `blur(${BLUR_STEPS[attempt]}px)`,
              width: 220,
              borderRadius: 16,
              background: "#232",
            }}
            alt="Movie Blurred Poster"
          />
        </div>
        {showResult === "win" ? (
          <div className="kv-result-win">
            🎉 Correct! It was <b>{movie.title}</b>.
          </div>
        ) : (
          <div className="kv-result-lose">
            ❌ Sorry, the answer was <b>{movie.title}</b>.
          </div>
        )}
        {clueCount > 0 && (
          <div className="kv-hint-row">
            <b>Clues used ({clueCount}/2):</b>
            <ul style={{ marginTop: 3, marginBottom: 0 }}>
              {clues.slice(0, clueCount).map((clue, i) => (
                <li key={i}>{clue}</li>
              ))}
            </ul>
          </div>
        )}
        {/* Results only, user can go Back or navigate at leisure */}
        <div style={{ marginTop: 12, color: "#439638", fontWeight: 500 }}>
          Quiz complete. Use 'Back' to return or refresh for new game!
        </div>
      </div>
    );
  }
  else if (round === NUM_ROUNDS && !loading) {
    // Quiz complete: show full score and breakdown
    mainContent = (
      <div>
        <div style={headerRowStyle}>
          <button
            className="kv-btn kv-btn-accent"
            style={{ minWidth: 58 }}
            onClick={handleGoBack}
          >
            &larr; Back
          </button>
          <div style={scoreBoxStyle}>
            Score: {score} / {NUM_ROUNDS * 5}
          </div>
        </div>
        <h2>Quiz Complete!</h2>
        <div style={{ margin: "20px 0" }}>
          <div style={{ fontWeight: 600, fontSize: "1.3rem", color: "#439638" }}>
            Your Final Score: {score} / {NUM_ROUNDS * 5}
          </div>
        </div>
        <div style={{ textAlign: "left", maxHeight: 170, overflowY: "auto", marginBottom: 10 }}>
          <small>
            <b>Round Results:</b>
            <ul>
              {answers.map((a, idx) => (
                <li key={idx} style={{ color: a.correct ? "#439638" : "#d32f2f" }}>
                  #{idx + 1}: {a.correct ? "✔️" : "❌"} {a.title}
                </li>
              ))}
            </ul>
          </small>
        </div>
        <button
          className="kv-btn"
          onClick={() => {
            if (standalone) {
              navigate("/");
            } else {
              dispatch({ type: "CLOSE_MODAL" });
            }
          }}
        >
          Close
        </button>
      </div>
    );
  }
  else if (!!movie) {
    // Main round view
    mainContent = (
      <>
        <div style={headerRowStyle}>
          <button
            className="kv-btn kv-btn-accent"
            style={{ minWidth: 58 }}
            onClick={handleGoBack}
          >
            &larr; Back
          </button>
          <div style={scoreBoxStyle}>
            Score: {score} / {NUM_ROUNDS * 5}
          </div>
        </div>
        <h2>
          Guess the Movie: Blurred Poster<br />
          <span style={{ fontSize: "1rem", color: "#a88203" }}>
            Round {round + 1} / {NUM_ROUNDS}
          </span>
        </h2>
        <div className="kv-blur-poster-row">
          <img
            src={getPosterUrl(movie.poster_path)}
            style={{
              filter: `blur(${BLUR_STEPS[attempt]}px)`,
              width: 220,
              borderRadius: 16,
              background: "#232",
            }}
            alt="Movie Blurred Poster"
          />
        </div>
        <div style={{ marginBottom: 8 }}>
          <button
            className="kv-btn kv-btn-accent"
            style={{
              background: clueCount >= 2 ? "#FFD60088" : undefined,
              color: clueCount >= 2 ? "#444" : undefined,
              cursor: cluesLoading || clueCount >= 2 ? "not-allowed" : "pointer",
              marginRight: 8,
              minWidth: 90,
            }}
            onClick={handleGetClue}
            disabled={cluesLoading || clueCount >= 2}
          >
            {cluesLoading ? "Loading..." : clueCount < 2 ? "Get Clue" : "No More Clues"}
          </button>
          <span style={{ color: "#a88203", fontSize: "1.01rem" }}>
            {clueCount} / 2 clues used
          </span>
        </div>
        {clueCount > 0 && (
          <div className="kv-hint-row">
            <b>Clue{clueCount > 1 ? "s" : ""}:</b>
            <ul style={{ marginTop: 3, marginBottom: 0 }}>
              {clues.slice(0, clueCount).map((clue, i) => (
                <li key={i}>{clue}</li>
              ))}
            </ul>
          </div>
        )}
        {showResult === null ? (
          <>
            <form className="kv-guess-form" onSubmit={handleGuess}>
              <input
                className="kv-guess-input"
                type="text"
                placeholder="Type the movie name..."
                value={userGuess}
                onChange={e => setUserGuess(e.target.value)}
                maxLength={40}
                required
                autoFocus
              />
              <button className="kv-btn">Guess</button>
            </form>
            <div className="kv-hint-row">{MAX_ATTEMPTS - attempt} tries left.</div>
            <button
              className="kv-btn kv-btn-accent"
              style={{ marginTop: 13, marginLeft: 6, background: "#FFD600", color: "#2d2d2d" }}
              onClick={() => {
                setShowResult("reveal");
                setAnswers(a => [...a, { correct: false, title: movie.title }]);
                setTimeout(() => {
                  if (round + 1 < NUM_ROUNDS) handleNext();
                  else setRound(NUM_ROUNDS);
                }, 1500);
              }}
            >
              Reveal Answer
            </button>
          </>
        ) : (
          <>
            <div className={showResult === "win" ? "kv-result-win" : "kv-result-lose"}>
              {showResult === "win"
                ? <>🎉 Correct! It was <b>{movie.title}</b>.</>
                : <>❌ The answer was <b>{movie.title}</b>.</>
              }
            </div>
            {clueCount > 0 && (
              <div className="kv-hint-row">
                <b>Clues used ({clueCount}/2):</b>
                <ul style={{ marginTop: 3, marginBottom: 0 }}>
                  {clues.slice(0, clueCount).map((clue, i) => (
                    <li key={i}>{clue}</li>
                  ))}
                </ul>
              </div>
            )}
            {showResult !== "reveal" && (
              <>
                <button
                  className="kv-btn"
                  onClick={() => {
                    if (round + 1 < NUM_ROUNDS) handleNext();
                    else setRound(NUM_ROUNDS);
                  }}
                  style={{ marginTop: 11 }}
                >
                  {round + 1 < NUM_ROUNDS ? "Next Poster" : "See My Score"}
                </button>
                <div className="kv-hint-row">{NUM_ROUNDS - (round + 1)} more quiz{NUM_ROUNDS - (round + 1) === 1 ? "" : "zes"} left</div>
              </>
            )}
          </>
        )}
      </>
    );
  }

  // --- Main Render (all hooks above, no conditional hook usage!) ---
  return (
    <div className="kv-game-modal">
      {mainContent}
    </div>
  );
}
