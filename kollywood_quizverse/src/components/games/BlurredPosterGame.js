import React, { useState, useEffect, useContext } from "react";
import { fetchPopularTamilMovies, getPosterUrl } from "../../tmdbApi";
import { QuizContext } from "../../context/QuizContext";
import { useNavigate, useLocation } from "react-router-dom";
import "./BlurredPosterGame.css";

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
  // 1. Clue 1: Release year
  const clues = [];
  if (movie.release_date) {
    const year = new Date(movie.release_date).getFullYear();
    clues.push("Release year: " + year);
  }
  // 2. Clue 2: Cast/actor, using TMDb or fallback to none.
  const actorClue = await getCastClue(movie.id);
  if (actorClue) clues.push(actorClue);
  // If not, fallback to a simple generic clue
  if (clues.length < 2 && movie.title) {
    clues.push("Title contains: " + movie.title.split(" ")[0]);
  }
  return clues;
}

// PUBLIC_INTERFACE
export default function BlurredPosterGame({ standalone }) {
  const { dispatch } = useContext(QuizContext);
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [round, setRound] = useState(0);
  const [userGuess, setUserGuess] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(null); // 'win'/'lose'/null
  const [answers, setAnswers] = useState([]);
  // State for clues
  const [clueCount, setClueCount] = useState(0);  // How many clues revealed for current poster
  const [clues, setClues] = useState([]);         // Array of clues for current poster
  const [cluesLoading, setCluesLoading] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  // Fetch movies for all rounds at once
  useEffect(() => {
    async function loadMovies() {
      setLoading(true);
      // Overfetch to reduce risk of duplicates
      const moviesArr = await fetchPopularTamilMovies(NUM_ROUNDS * 3);
      // Pick NUM_ROUNDS unique movies randomly
      let chosen = [];
      let pickedIdxs = new Set();
      // Defensive: filter out titles without poster_path
      let filteredMovies = moviesArr.filter(m => !!m.poster_path);
      if (filteredMovies.length < NUM_ROUNDS) filteredMovies = moviesArr;
      while (chosen.length < NUM_ROUNDS && filteredMovies.length > 0) {
        let idx = Math.floor(Math.random() * filteredMovies.length);
        if (!pickedIdxs.has(idx)) {
          pickedIdxs.add(idx);
          chosen.push(filteredMovies[idx]);
        }
      }
      setMovies(chosen);
      setAnswers([]); // reset per session
      setRound(0); setScore(0); setAttempt(0); setShowResult(null); setUserGuess("");
      setClueCount(0); setClues([]); setCluesLoading(false);
      setLoading(false);
    }
    loadMovies();
    // eslint-disable-next-line
  }, []);

  // If a new round/movie, reset clues
  useEffect(() => {
    setClueCount(0);
    setClues([]);
    setCluesLoading(false);
  }, [round]);

  // Fetch next poster (essentially update state for next round)
  function nextPoster() {
    setAttempt(0);
    setShowResult(null);
    setUserGuess("");
    setClueCount(0);
    setClues([]);
    setCluesLoading(false);
  }

  if (loading) return <div style={{ minHeight: 250 }}>Loading movie posters...</div>;
  if (!movies[round]) return <div style={{ minHeight: 250 }}>No movie found for this round.</div>;

  const movie = movies[round];

  // Handler for clue button
  const handleGetClue = async () => {
    if (clueCount >= 2) return;
    if (clues.length >= clueCount + 1) {
      // Already available, just increment
      setClueCount(clueCount + 1);
      return;
    }
    setCluesLoading(true);
    // Fetch clues only once per movie per game
    const fullClues = clues.length
      ? clues
      : await getCluesForMovie(movie);
    setClues(fullClues);
    setClueCount(clueCount + 1);
    setCluesLoading(false);
  };

  function handleGuess(e) {
    e.preventDefault();
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

  function handleNext() {
    // Move to next round or finish and show score
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

  function handleFinish() {
    // Save score to global history only once, at the end
    dispatch({
      type: "ADD_SCORE_HISTORY",
      payload: {
        game: "Blurred Poster",
        score: score,
        time: new Date().toLocaleString(),
      },
    });
    if (standalone) {
      // go to dashboard on finish in standalone/page mode
      navigate("/");
    } else {
      dispatch({ type: "CLOSE_MODAL" });
    }
  }

  // Render results if finished
  if (round === NUM_ROUNDS - 1 && showResult !== null) {
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
        {/* Show clues summary if clues used */}
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
        <button className="kv-btn" onClick={handleFinish} style={{ marginTop: 10 }}>
          See My Score
        </button>
      </div>
    );
  }

  // Show results/score breakdown after all rounds
  if (round === NUM_ROUNDS && !loading) {
    return (
      <div className="kv-game-modal">
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

  return (
    <div className="kv-game-modal">
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
      {/* Clue Button logic */}
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
      {/* Render revealed clues */}
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
        </>
      ) : (
        <>
          {showResult === "win" ? (
            <div className="kv-result-win">
              🎉 Correct! It was <b>{movie.title}</b>.
            </div>
          ) : (
            <div className="kv-result-lose">
              ❌ Sorry, the answer was <b>{movie.title}</b>.
            </div>
          )}
          {/* Show clues summary at round end, if clues were revealed */}
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
          <button
            className="kv-btn"
            onClick={() => {
              if (round + 1 < NUM_ROUNDS) handleNext();
              else setRound(NUM_ROUNDS); // trigger final result view
            }}
            style={{ marginTop: 11 }}
          >
            {round + 1 < NUM_ROUNDS ? "Next Poster" : "See My Score"}
          </button>
          <div className="kv-hint-row">{NUM_ROUNDS - (round + 1)} more quiz{NUM_ROUNDS - (round + 1) === 1 ? "" : "zes"} left</div>
        </>
      )}
    </div>
  );
}
