import React, { useState, useEffect, useContext } from "react";
import { fetchPopularTamilMovies, getPosterUrl } from "../../tmdbApi";
import { QuizContext } from "../../context/QuizContext";
import "./BlurredPosterGame.css";

const BLUR_STEPS = [12, 6, 2, 0];
const MAX_ATTEMPTS = 3;
const NUM_ROUNDS = 10;

function normalizeTitle(title) {
  return (title || "").replace(/[^a-z0-9]/gi, "").toLowerCase();
}

// PUBLIC_INTERFACE
export default function BlurredPosterGame() {
  const { dispatch } = useContext(QuizContext);
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [round, setRound] = useState(0);
  const [userGuess, setUserGuess] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(null); // 'win'/'lose'/null
  const [answers, setAnswers] = useState([]);

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
      setLoading(false);
    }
    loadMovies();
    // eslint-disable-next-line
  }, []);
  
  // Fetch next poster (essentially update state for next round)
  function nextPoster() {
    setAttempt(0);
    setShowResult(null);
    setUserGuess("");
  }

  if (loading) return <div style={{ minHeight: 250 }}>Loading movie posters...</div>;
  if (!movies[round]) return <div style={{ minHeight: 250 }}>No movie found for this round.</div>;

  const movie = movies[round];

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
    dispatch({ type: "CLOSE_MODAL" });
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
        <button className="kv-btn" onClick={() => dispatch({ type: "CLOSE_MODAL" })}>
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
