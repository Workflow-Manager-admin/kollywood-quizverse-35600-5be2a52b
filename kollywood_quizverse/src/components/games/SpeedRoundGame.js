import React, { useEffect, useState, useRef, useContext } from "react";
import { fetchPopularTamilMovies } from "../../tmdbApi";
import { QuizContext } from "../../context/QuizContext";
import "./SpeedRoundGame.css";

const TOTAL_QUESTIONS = 10, TIME_LIMIT = 60; // seconds

// Fake single type of question for demo ("What year was X released?")
// Could be replaced with more Q types
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
export default function SpeedRoundGame() {
  const { dispatch } = useContext(QuizContext);
  const [started, setStarted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT);
  const [questions, setQuestions] = useState([]);
  const [qIdx, setQIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);

  const timer = useRef();

  useEffect(() => {
    async function init() {
      const movies = await fetchPopularTamilMovies(30);
      setQuestions(makeQuestions(movies));
    }
    init();
  }, []);

  useEffect(() => {
    if (started && !done) {
      timer.current = setInterval(() => setTimeLeft(t => {
        if (t <= 1) {
          onFinish();
          return 0;
        }
        return t - 1;
      }), 1000);
      return () => clearInterval(timer.current);
    }
    // Cleanup timer
    return () => clearInterval(timer.current);
    // eslint-disable-next-line
  }, [started, done]);

  function onAnswer(option) {
    if (done) return;
    if (option === questions[qIdx].answer) setScore(score + 1);
    if (qIdx+1 === TOTAL_QUESTIONS) {
      onFinish();
    } else {
      setQIdx(qIdx + 1);
    }
  }

  function onFinish() {
    if (!done) {
      setDone(true);
      clearInterval(timer.current);
      dispatch({
        type: "ADD_SCORE_HISTORY",
        payload: {
          game: "Speed Round",
          score,
          time: new Date().toLocaleString()
        }
      });
    }
  }

  function close() {
    dispatch({ type: "CLOSE_MODAL" });
  }

  if (!questions.length) return <div style={{minHeight:190}}>Loading questions…</div>;
  if (!started) return (
    <div className="kv-game-modal">
      <h2>Speed Round</h2>
      <div>
        Ten questions, 60 seconds. Ready? <br/>
        <button className="kv-btn" onClick={() => setStarted(true)}>Start</button>
      </div>
    </div>
  );

  return (
    <div className="kv-game-modal">
      <h2>Speed Round</h2>
      <div className="kv-speed-timer">Time left: {timeLeft}s</div>
      {!done ? (
        <div>
          <div className="kv-speed-q">
            Q{qIdx + 1}: {questions[qIdx].q}
          </div>
          <div className="kv-speed-options">
            {questions[qIdx].options.map(opt => (
              <button className="kv-speed-opt-btn"
                key={opt}
                onClick={() => onAnswer(opt)}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="kv-speed-result">
          Done! Your score: <b>{score}</b>
          <button className="kv-btn" onClick={close} style={{marginLeft:18}}>Close</button>
        </div>
      )}
    </div>
  );
}
