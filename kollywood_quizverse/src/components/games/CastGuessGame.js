import React, { useEffect, useState, useContext } from "react";
import { fetchToughTamilMovies, getPosterUrl } from "../../tmdbApi";
import { QuizContext } from "../../context/QuizContext";
import { useNavigate } from "react-router-dom";
import "./CastGuessGame.css";

// Helper: fetch up to N cast members for a movie
async function fetchMovieCast(movieId) {
  const url = `https://api.themoviedb.org/3/movie/${movieId}/credits?api_key=5bc67d3b06aecbd18121a3cbbc16eb59`;
  try {
    const response = await fetch(url);
    if (!response.ok) return [];
    const data = await response.json();
    return (data.cast || []).slice(0, 4);
  } catch {
    return [];
  }
}

// PUBLIC_INTERFACE
/**
 * CastGuessGame can be used in modal or standalone page ("standalone" prop).
 * In standalone mode, auto-starts new session, displays score, and has Back button.
 */
export default function CastGuessGame({ standalone }) {
  const [questions, setQuestions] = useState([]);
  const [currIdx, setCurrIdx] = useState(0);
  const [answerIdx, setAnswerIdx] = useState(null);
  const [state, setState] = useState({
    done: false,
    score: 0,
    answers: []
  });
  const [loading, setLoading] = useState(true);

  const { dispatch } = useContext(QuizContext);
  const navigate = useNavigate();

  // Config
  const NUM_ROUNDS = 7;
  const SCORE_PER_CORRECT = 5;

  // Load a new session of questions on mount (standalone or modal)
  useEffect(() => {
    async function setupSession() {
      setLoading(true);
      let qArr = [];
      // Get a larger pool for good distractors and sufficient 'toughness'
      let movies = await fetchToughTamilMovies({ count: NUM_ROUNDS * 4 });
      let usedIds = new Set();
      for (let i = 0; i < NUM_ROUNDS && movies.length > (i + 3); ++i) {
        // Avoid repeats in correct answer
        let pickIdx = movies.findIndex(m => !usedIds.has(m.id));
        if (pickIdx === -1) pickIdx = i;
        const correctMovie = movies[pickIdx];
        usedIds.add(correctMovie.id);
        // Select 3 tough distractors not the correct movie
        let distractors = movies.filter(m => m.id !== correctMovie.id)
                                .sort(() => Math.random() - 0.5)
                                .slice(0, 3);
        // randomize option order
        let opts = [correctMovie, ...distractors].sort(() => Math.random() - 0.5);
        // get cast
        let cast = await fetchMovieCast(correctMovie.id);
        qArr.push({
          cast,
          options: opts,
          answerId: correctMovie.id,
          answerTitle: correctMovie.title
        });
      }
      setQuestions(qArr);
      setCurrIdx(0);
      setAnswerIdx(null);
      setState({ done: false, score: 0, answers: [] });
      setLoading(false);
    }
    setupSession();
    // eslint-disable-next-line
  }, [standalone]);

  // UI and score handling
  function handleChoice(i) {
    // If already done, disable
    if (state.done) return;
    const isCorrect = questions[currIdx].options[i].id === questions[currIdx].answerId;
    setAnswerIdx(i);
    setTimeout(() => {
      // Compute
      let nextScore = state.score + (isCorrect ? SCORE_PER_CORRECT : 0);
      let answersArr = [
        ...state.answers,
        {
          correct: isCorrect,
          title: questions[currIdx].answerTitle
        }
      ];
      // Next round or finish?
      if (currIdx + 1 < questions.length) {
        setCurrIdx(currIdx + 1);
        setAnswerIdx(null);
        setState({
          ...state,
          score: nextScore,
          answers: answersArr
        });
      } else {
        // Session done!
        setState({
          done: true,
          score: nextScore,
          answers: answersArr
        });
        // Persist session score to history
        dispatch({
          type: "ADD_SCORE_HISTORY",
          payload: {
            game: "Guess by Cast",
            score: nextScore,
            time: new Date().toLocaleString()
          }
        });
      }
    }, 500); // short delay to show feedback
  }

  function handleGoBack() {
    if (standalone) {
      navigate(-1);
    } else {
      dispatch({ type: "CLOSE_MODAL" });
    }
  }

  function handleCloseOrHome() {
    if (standalone) {
      navigate("/");
    } else {
      dispatch({ type: "CLOSE_MODAL" });
    }
  }

  // View loading?
  if (loading || !questions.length) return <div style={{ minHeight: 220 }}>Loading...</div>;

  // Helper style snippets for consistency
  const headerRowStyle = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8
  };
  const scoreBoxStyle = {
    background: "#ffd600",
    color: "#d32f2f",
    fontWeight: 700,
    fontSize: "1.08rem",
    borderRadius: 7,
    padding: "4px 17px",
    minWidth: 65,
    textAlign: "center",
    boxShadow: "0 1px 8px #efb01d21",
    display: "inline-block"
  };

  // Quiz complete summary
  if (state.done) {
    return (
      <div className="kv-game-modal">
        <div style={headerRowStyle}>
          <button
            className="kv-btn kv-btn-accent"
            style={{ minWidth: 58 }}
            onClick={handleGoBack}
          >
            &larr; Back
          </button>
          <div style={scoreBoxStyle}>
            Score: {state.score} / {NUM_ROUNDS * SCORE_PER_CORRECT}
          </div>
        </div>
        <h2>Guess the Movie by Cast</h2>
        <div className="kv-cast-result" style={{ margin: "18px 0 12px" }}>
          <b>Your Final Score: {state.score} / {NUM_ROUNDS * SCORE_PER_CORRECT}</b>
        </div>
        <div style={{ textAlign: "left", maxHeight: 160, overflowY: "auto", marginBottom: 8 }}>
          <small>
            <b>Round Results:</b>
            <ul>
              {state.answers.map((a, idx) => (
                <li key={idx} style={{ color: a.correct ? "#439638" : "#d32f2f" }}>
                  #{idx + 1}: {a.correct ? "✔️" : "❌"} {a.title}
                </li>
              ))}
            </ul>
          </small>
        </div>
        <button className="kv-btn" onClick={handleCloseOrHome}>
          {standalone ? "Go Home" : "Close"}
        </button>
      </div>
    );
  }

  // Active round view
  const question = questions[currIdx];
  return (
    <div className="kv-game-modal">
      <div style={headerRowStyle}>
        <button
          className="kv-btn kv-btn-accent"
          style={{ minWidth: 58 }}
          onClick={handleGoBack}
        >
          &larr; Back
        </button>
        <div style={scoreBoxStyle}>
          Score: {state.score} / {NUM_ROUNDS * SCORE_PER_CORRECT}
        </div>
      </div>
      <h2>
        Guess the Movie by Cast<br />
        <span style={{ fontSize: "1rem", color: "#a88203" }}>
          Round {currIdx + 1} / {NUM_ROUNDS}
        </span>
      </h2>
      <div className="kv-cast-row">
        {question.cast.length > 0 ? (
          <>
            <span>Cast:</span>
            {question.cast.map(m => (
              <span className="kv-cast-bubble" key={m.id || m.name}>{m.name}</span>
            ))}
          </>
        ) : (
          <span>No cast data, try guessing!</span>
        )}
      </div>
      <div className="kv-cast-choices">
        {question.options.map((mov, i) => (
          <button
            key={mov.id}
            onClick={() => answerIdx === null && handleChoice(i)}
            className={
              answerIdx !== null
                ? mov.id === question.answerId
                  ? "kv-cast-correct"
                  : i === answerIdx
                  ? "kv-cast-wrong"
                  : "kv-cast-default"
                : "kv-cast-btn"
            }
            disabled={answerIdx !== null}
          >
            <img src={getPosterUrl(mov.poster_path, "w185")} style={{ width: 90, borderRadius: 9 }} alt="" />
            <div>{mov.title}</div>
          </button>
        ))}
      </div>
      {answerIdx !== null && (
        <div className="kv-cast-result" style={{ marginTop: 18 }}>
          {question.options[answerIdx].id === question.answerId ? "🎉 Correct!" : "❌ Wrong"}
        </div>
      )}
    </div>
  );
}
