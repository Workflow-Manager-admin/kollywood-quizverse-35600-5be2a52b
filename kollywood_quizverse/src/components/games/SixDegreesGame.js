import React, { useState, useContext } from "react";
import { QuizContext } from "../../context/QuizContext";
import "./SixDegreesGame.css";

// PUBLIC_INTERFACE
export default function SixDegreesGame() {
  const [actorA, setActorA] = useState("");
  const [actorB, setActorB] = useState("");
  const [result, setResult] = useState(null);
  const { dispatch } = useContext(QuizContext);

  function findDemoConnection() {
    // For demo, just output a silly fake connection:
    setResult([
      actorA,
      "worked with Vijay in Movie A (2018)",
      "Vijay worked with Ajith in Movie B (2017)",
      "Ajith worked with",
      actorB
    ]);
    dispatch({
      type: "ADD_SCORE_HISTORY",
      payload: {
        game: "Six Degrees",
        score: 5,
        time: new Date().toLocaleString()
      }
    });
  }
  function close() {
    dispatch({ type: "CLOSE_MODAL" });
  }
  return (
    <div className="kv-game-modal">
      <h2>Six Degrees of Kollywood</h2>
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
      {result && (
        <div className="kv-sixdeg-result">
          {result.map((step, idx) =>
            <div key={idx}>{idx % 2 === 0 ? <b>{step}</b> : step}</div>
          )}
          <button className="kv-btn" onClick={close} style={{ marginTop: 9 }}>
            Close
          </button>
        </div>
      )}
    </div>
  );
}
