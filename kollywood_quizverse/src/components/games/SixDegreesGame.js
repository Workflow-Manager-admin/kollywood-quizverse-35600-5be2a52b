import React, { useState, useContext } from "react";
import { QuizContext } from "../../context/QuizContext";
import { useNavigate } from "react-router-dom";
import "./SixDegreesGame.css";

// PUBLIC_INTERFACE
export default function SixDegreesGame({ standalone }) {
  const [actorA, setActorA] = useState("");
  const [actorB, setActorB] = useState("");
  const [result, setResult] = useState(null);
  const [sessionEnded, setSessionEnded] = useState(false);
  const { dispatch } = useContext(QuizContext);
  const navigate = useNavigate();

  // Called when connection is found
  function findDemoConnection() {
    // For demo, just output a silly fake connection and assign fake "score".
    setResult([
      actorA,
      "worked with Vijay in Movie A (2018)",
      "Vijay worked with Ajith in Movie B (2017)",
      "Ajith worked with",
      actorB
    ]);
    // Record the session score (arbitrarily '5', as this is not a quiz, but just demo)
    dispatch({
      type: "ADD_SCORE_HISTORY",
      payload: {
        game: "Six Degrees",
        score: 5,
        time: new Date().toLocaleString()
      }
    });
    setSessionEnded(true);
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

  // Header row: Back button and "score" (for visual parity)
  const headerRow = (
    <div style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 8
    }}>
      <button
        className="kv-btn kv-btn-accent"
        style={{ minWidth: 58 }}
        onClick={handleGoBack}
      >
        &larr; Back
      </button>
      <div style={{
        background: "#ffd600",
        color: "#d32f2f",
        fontWeight: 700,
        fontSize: "1.08rem",
        borderRadius: 7,
        padding: "4px 17px",
        minWidth: 60,
        textAlign: "center",
        boxShadow: "0 1px 8px #efb01d21",
        display: "inline-block"
      }}>
        Score: {result ? 5 : 0} / 5
      </div>
    </div>
  );

  // Remove auto-home redirect for standalone.
  // User navigates manually after seeing connection result/score.

  return (
    <div className="kv-game-modal">
      {headerRow}
      <h2>Six Degrees of Kollywood</h2>
      {!result ? (
        <>
          <p>
            Input two Kollywood actors to see (a demo of) how they could be connected by movies!
          </p>
          <form onSubmit={e => { e.preventDefault(); findDemoConnection(); }}>
            <input
              type="text"
              placeholder="Actor 1"
              className="kv-sixdeg-input"
              value={actorA}
              required
              onChange={e => setActorA(e.target.value)}
            />
            <input
              type="text"
              placeholder="Actor 2"
              className="kv-sixdeg-input"
              value={actorB}
              required
              onChange={e => setActorB(e.target.value)}
            />
            <button className="kv-btn" type="submit" style={{ marginLeft: 11 }}>
              Find Connection
            </button>
          </form>
        </>
      ) : (
        <div className="kv-sixdeg-result">
          <div style={{ marginBottom: 12, fontWeight: 500, color: "#222" }}>
            Connection between <span style={{ color: "#D32F2F" }}>{actorA}</span> and <span style={{ color: "#D32F2F" }}>{actorB}</span>:
          </div>
          {result.map((step, idx) =>
            <div key={idx}>{idx % 2 === 0 ? <b>{step}</b> : step}</div>
          )}
          <div style={{ marginTop: 15, color: "#439638", fontWeight: 700 }}>
            Session complete! Score: 5 / 5
          </div>
          {standalone ? (
            <div style={{ color: "#439638", fontSize: 13, marginTop: 5, fontWeight: 500 }}>
              Game complete. Use 'Back' to return or refresh for a new search!
            </div>
          ) : null}
          <button
            className="kv-btn"
            onClick={handleCloseOrHome}
            style={{ marginTop: 18 }}
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
