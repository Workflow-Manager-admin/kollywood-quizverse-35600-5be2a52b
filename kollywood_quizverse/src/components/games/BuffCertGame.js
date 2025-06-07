import React, { useEffect, useState, useContext } from "react";
import { fetchPopularTamilMovies } from "../../tmdbApi";
import { QuizContext } from "../../context/QuizContext";
import { useNavigate } from "react-router-dom";
import "./BuffCertGame.css";

const LEVELS = [
  { level: 1, qCount: 3, point: 3 },
  { level: 2, qCount: 4, point: 4 },
  { level: 3, qCount: 5, point: 5 }
];

// PUBLIC_INTERFACE
/**
 * BuffCertGame can be used in a modal or as a standalone page (standalone prop).
 * In standalone mode, auto-start the game, show session score, add Back and Go Home buttons.
 */
export default function BuffCertGame({ standalone }) {
  const { dispatch } = useContext(QuizContext);
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [idx, setIdx] = useState(0);
  const [level, setLevel] = useState(1); // 1-based
  const [correct, setCorrect] = useState(0);
  const [done, setDone] = useState(false);
  const [sessionScores, setSessionScores] = useState([]);
  const [loading, setLoading] = useState(true);

  // For standalone: show all-time session score
  const currentLevelObj = LEVELS[level-1] || LEVELS[0];

  // On (level || standalone) start, generate new questions for current level
  useEffect(() => {
    async function makeQs() {
      setLoading(true);
      const ms = await fetchPopularTamilMovies(currentLevelObj.qCount + 2);
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
      setLoading(false);
    }
    makeQs();
    // eslint-disable-next-line
  }, [level]);

  // Standalone: Track scores for session summary
  useEffect(() => {
    if (standalone) setSessionScores([]);
  }, [standalone]);

  function chooseAnswer(opt) {
    if (done) return;
    const correctThis = opt === questions[idx].answer;
    if (correctThis) setCorrect(c => c + 1);
    if (idx + 1 === questions.length) {
      setDone(true);
      const levelScore = correct + (correctThis ? 1 : 0);
      dispatch({
        type: "ADD_SCORE_HISTORY",
        payload: {
          game: `Buff Cert L${level}`,
          score: levelScore,
          time: new Date().toLocaleString()
        }
      });
      if (standalone) {
        setSessionScores(arr => [...arr, { level, score: levelScore, max: questions.length, cleared: levelScore === questions.length }]);
      }
    } else setIdx(idx + 1);
  }

  function tryNextLevel() {
    if (level < LEVELS.length) setLevel(level + 1);
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

  // Top UI row: Back and Session Score if standalone
  const headerRow = (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10
    }}>
      <button
        className="kv-btn kv-btn-accent"
        style={{ minWidth: 58 }}
        onClick={handleGoBack}
      >
        &larr; Back
      </button>
      <div style={{
        background: "#ffd600", color: "#d32f2f", fontWeight: 700,
        fontSize: "1.08rem", borderRadius: 7, padding: "4px 17px",
        minWidth: 70, textAlign: "center", boxShadow: "0 1px 8px #efb01d21", display: "inline-block"
      }}>
        Score: {correct} / {questions.length || currentLevelObj.qCount}
      </div>
    </div>
  );

  // Show summary after all levels are done (standalone)
  if (standalone && done && level === LEVELS.length && (sessionScores.length === LEVELS.length)) {
    return (
      <div className="kv-game-modal">
        {headerRow}
        <h2>Movie Buff Certification</h2>
        <div className="kv-cert-score" style={{marginBottom:7, color: "#439638"}}>
          <b>Certification Summary</b>
        </div>
        <div style={{marginBottom:14}}>
          <table style={{margin:"0 auto", borderCollapse:"separate", borderSpacing:"9px 0", fontSize:"1.01rem"}}>
            <thead><tr>
              <th style={{textAlign:"left"}}>Level</th>
              <th style={{textAlign:"right"}}>Score</th>
              <th>Status</th>
            </tr></thead>
            <tbody>
            {sessionScores.map((s,i) => (
              <tr key={i}>
                <td>Level {s.level}</td>
                <td style={{textAlign:"right"}}>{s.score} / {s.max}</td>
                <td>{s.cleared ? <span style={{color:"#439638"}}>Cleared</span> : <span style={{color:"#d32f2f"}}>Incomplete</span>}</td>
              </tr>
            ))}
            </tbody>
          </table>
        </div>
        <div style={{marginTop:10}}>
          <button className="kv-btn" onClick={handleCloseOrHome}>
            Go Home
          </button>
        </div>
        <div style={{marginTop:13}}>
          <button className="kv-btn kv-cert-share">Share my Certification</button>
        </div>
      </div>
    );
  }

  if (loading) return <div style={{ minHeight: 230 }}>Loading questions…</div>;

  // UI for quiz questions
  return (
    <div className="kv-game-modal">
      {headerRow}
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
            <button className="kv-btn" onClick={() => {
              tryNextLevel();
            }} style={{marginLeft:18}}>
              Next Level
            </button>
          ) : (
            <button className="kv-btn" onClick={standalone ? handleCloseOrHome : handleGoBack} style={{marginLeft:18}}>
              {standalone ? "Go Home" : "Close"}
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
