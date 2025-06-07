import React, { useContext } from "react";
import { QuizContext } from "../context/QuizContext";
import "./ScoreHistoryScreen.css";

export default function ScoreHistoryScreen() {
  const { state } = useContext(QuizContext);
  return (
    <div className="kv-history-screen">
      <h2>Your Scores &amp; Attempts</h2>
      <ul className="kv-history-list">
        {state.scoreHistory && state.scoreHistory.length > 0 ? (
          state.scoreHistory.map((item, i) => (
            <li key={i} className="kv-history-entry">
              <span className="kv-history-date">{item.time}</span>
              <span className="kv-history-game">{item.game}</span>
              <span className="kv-history-score">{item.score}</span>
            </li>
          ))
        ) : (
          <li>No historical scores yet. Play a game!</li>
        )}
      </ul>
    </div>
  );
}
