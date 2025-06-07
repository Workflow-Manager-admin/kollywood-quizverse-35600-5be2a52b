import React, { useEffect, useState, useContext } from "react";
import { fetchPopularTamilMovies } from "../../tmdbApi";
import { QuizContext } from "../../context/QuizContext";
import "./BuffCertGame.css";

const LEVELS = [
  { level: 1, qCount: 3, point: 3 },
  { level: 2, qCount: 4, point: 4 },
  { level: 3, qCount: 5, point: 5 }
];

// PUBLIC_INTERFACE
export default function BuffCertGame() {
  const { dispatch } = useContext(QuizContext);
  const [questions, setQuestions] = useState([]);
  const [idx, setIdx] = useState(0);
  const [level, setLevel] = useState(1); //1-based
  const [correct, setCorrect] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    async function makeQs() {
      const ms = await fetchPopularTamilMovies(LEVELS[level-1].qCount + 2);
      setQuestions(ms.map(m => ({
        q: `Release year of "${m.title}"?`,
        answer: String(new Date(m.release_date).getFullYear()),
        opts: [
          String(new Date(m.release_date).getFullYear()),
          String(2000 + Math.floor(Math.random() * 21)),
          String(1990 + Math.floor(Math.random() * 8)),
          String(2015 + Math.floor(Math.random() * 4))
        ].sort(() => Math.random() - 0.5)
      })));
      setIdx(0); setCorrect(0); setDone(false);
    }
    makeQs();
  }, [level]);

  function chooseAnswer(opt) {
    if (done) return;
    if (opt === questions[idx].answer) setCorrect(c => c+1);
    if (idx + 1 === questions.length) {
      setDone(true);
      dispatch({
        type: "ADD_SCORE_HISTORY",
        payload: {
          game: `Buff Cert L${level}`,
          score: correct + (opt === questions[idx].answer ? 1 : 0),
          time: new Date().toLocaleString()
        }
      });
    } else setIdx(idx + 1);
  }
  function tryNextLevel() {
    if (level < LEVELS.length) setLevel(level+1);
  }
  function close() {
    dispatch({ type: "CLOSE_MODAL" });
  }
  return (
    <div className="kv-game-modal">
      <h2>Movie Buff Certification <span className="kv-cert-lvl">Level {level}</span></h2>
      {!done ? (
        <div>
          <div>
            <b>{questions[idx]?.q}</b>
          </div>
          <div className="kv-cert-options">
            {questions[idx]?.opts.map(opt => (
              <button
                className="kv-btn kv-cert-btn"
                key={opt}
                onClick={() => chooseAnswer(opt)}
              >
                {opt}
              </button>
            ))}
          </div>
          <div className="kv-cert-progress">
            Question {idx+1} of {questions.length}
          </div>
        </div>
      ) : (
        <div className="kv-cert-score">
          Level {level} Score: {correct} / {questions.length}
          {level < LEVELS.length && correct === questions.length ? (
            <button className="kv-btn" onClick={tryNextLevel} style={{marginLeft:18}}>
              Next Level
            </button>
          ) : (
            <button className="kv-btn" onClick={close} style={{marginLeft:18}}>
              Close
            </button>
          )}
          <div style={{marginTop:12,fontSize:14,color:"var(--kv-accent)"}}>
            {correct === questions.length
              ? "Buff Level Cleared! 🚀"
              : "Try level again or close."}
          </div>
          <div style={{marginTop:12}}>
            <button className="kv-btn kv-cert-share">Share my Certification</button>
          </div>
        </div>
      )}
    </div>
  );
}
