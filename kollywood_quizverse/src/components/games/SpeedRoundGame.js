import React, { useEffect, useState, useRef, useContext } from "react";
import { fetchToughTamilMovies } from "../../tmdbApi";
import { QuizContext } from "../../context/QuizContext";
import { useNavigate } from "react-router-dom";
import "./SpeedRoundGame.css";

/**
 * SpeedRoundGame:
 * - Supports standalone page mode (standalone={true}) or modal.
 * - Displays live score and final score summary UI as in other games.
 * - "Back" button returns to previous page or closes modal.
 * - Session auto-starts on page mode, requires Start button on modal.
 */
const TOTAL_QUESTIONS = 10, TIME_LIMIT = 60;

function makeQuestions(movies) {
  return movies.slice(0, TOTAL_QUESTIONS).map(m => ({
    q: `What year was "${m.title}" released?`,
    options: [
      String(new Date(m.release_date).getFullYear()),
      String(2000 + Math.floor(Math.random() * 23)),
      String(1990 + Math.floor(Math.random() * 13)),
      String(1980 + Math.floor(Math.random() * 20)),
    ].sort(() => Math.random() - 0.5),
    answer: String(new Date(m.release_date).getFullYear())
  }));
}

// PUBLIC_INTERFACE
export default function SpeedRoundGame({ standalone }) {
  const { dispatch } = useContext(QuizContext);
  const [started, setStarted] = useState(!!standalone);
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT);
  const [questions, setQuestions] = useState([]);
  const [qIdx, setQIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const [answers, setAnswers] = useState([]); // To display summary

  const timer = useRef();
  const navigate = useNavigate();

  // On mount, fetch movie questions
  useEffect(() => {
    async function init() {
      const movies = await fetchToughTamilMovies({ count: 30 });
      setQuestions(makeQuestions(movies));
      setQIdx(0);
      setScore(0);
      setDone(false);
      setAnswers([]);
      setTimeLeft(TIME_LIMIT);
      setStarted(!!standalone);
    }
    init();
    // eslint-disable-next-line
  }, [standalone]);

  // Handle timer effect
  useEffect(() => {
    if (started && !done) {
      timer.current = setInterval(() => setTimeLeft((t) => {
        if (t <= 1) {
          handleFinish();
          return 0;
        } else return t - 1;
      }), 1000);
      return () => clearInterval(timer.current);
    }
    return () => clearInterval(timer.current);
    // eslint-disable-next-line
  }, [started, done]);

  // Results/final summary screen: auto-home on standalone
  useEffect(() => {
    if (standalone && done) {
      const timeout = setTimeout(() => {
        handleCloseOrHome();
      }, 2600);
      return () => clearTimeout(timeout);
    }
    // eslint-disable-next-line
  }, [standalone, done]);

  function handleGoBack() {
    if (standalone) {
      navigate(-1); // previous page; root if direct
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

  function onAnswer(option) {
    if (done) return;
    const correct = option === questions[qIdx].answer;
    setScore((s) => s + (correct ? 1 : 0));
    setAnswers(a => [...a, { correct, q: questions[qIdx].q, user: option, answer: questions[qIdx].answer }]);
    if (qIdx + 1 === TOTAL_QUESTIONS) {
      handleFinish();
    } else {
      setQIdx(qIdx + 1);
    }
  }

  function handleFinish() {
    if (!done) {
      setDone(true);
      clearInterval(timer.current);
      dispatch({
        type: "ADD_SCORE_HISTORY",
        payload: {
          game: "Speed Round",
          score: score,
          time: new Date().toLocaleString()
        }
      });
    }
  }

  function handleStart() {
    setStarted(true);
    setTimeLeft(TIME_LIMIT);
    setQIdx(0);
    setScore(0);
    setDone(false);
    setAnswers([]);
  }

  if (!questions.length) return <div style={{ minHeight: 190 }}>Loading questions…</div>;

  // Styles for row parity
  const headerRowStyle = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
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
    display: "inline-block",
  };

  // Results/final summary screen
  if (done && questions.length) {
    return (
      <div className="kv-game-modal">
        <div style={headerRowStyle}>
          <button
            className="kv-btn kv-btn-accent"
            style={{ minWidth: 58 }}
            onClick={handleGoBack}
            disabled={standalone}
            title={standalone ? "Returning to home..." : ""}
          >
            &larr; Back
          </button>
          <div style={scoreBoxStyle}>
            Score: {score} / {TOTAL_QUESTIONS}
          </div>
        </div>
        <h2>Speed Round</h2>
        <div className="kv-speed-result" style={{ marginBottom: 8, color: "#439638" }}>
          <b>Your Final Score: {score} / {TOTAL_QUESTIONS}</b>
        </div>
        <div style={{ textAlign: "left", maxHeight: 150, overflowY: "auto", marginBottom: 10 }}>
          <small>
            <b>Round Results:</b>
            <ul>
              {answers.map((a, idx) => (
                <li key={idx} style={{ color: a.correct ? "#439638" : "#d32f2f" }}>
                  {a.correct ? "✔️" : "❌"} {a.q.replace(/What year was \\"(.*?)\\" released\\?/, (_, t) => t)} — Chose: <b>{a.user}</b>{a.correct ? "" : ` (Ans: ${a.answer})`}
                </li>
              ))}
            </ul>
          </small>
        </div>
        {standalone ? (
          <div style={{ marginTop: 10, color: "#969600", fontSize: 13 }}>
            Returning to home in 2.5 seconds...
          </div>
        ) : null}
        <button className="kv-btn" onClick={handleCloseOrHome} disabled={standalone}>
          {standalone ? "Go Home" : "Close"}
        </button>
      </div>
    );
  }

  // Game not started yet (modal only)
  if (!started) return (
    <div className="kv-game-modal">
      <h2>Speed Round</h2>
      <div>
        Ten questions, 60 seconds. Ready? <br />
        <button className="kv-btn" onClick={handleStart}>Start</button>
      </div>
    </div>
  );

  // Active game round
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
          Score: {score} / {TOTAL_QUESTIONS}
        </div>
      </div>
      <h2>
        Speed Round<br />
        <span style={{ fontSize: "1rem", color: "#a88203" }}>
          Q{qIdx + 1} / {TOTAL_QUESTIONS}
        </span>
      </h2>
      <div className="kv-speed-timer">Time left: {timeLeft}s</div>
      <div className="kv-speed-q">
        {questions[qIdx].q}
      </div>
      <div className="kv-speed-options">
        {questions[qIdx].options.map(opt => (
          <button
            className="kv-speed-opt-btn"
            key={opt}
            onClick={() => onAnswer(opt)}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}
