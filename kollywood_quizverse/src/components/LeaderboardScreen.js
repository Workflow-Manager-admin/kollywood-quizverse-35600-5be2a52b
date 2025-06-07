import React, { useContext } from "react";
import { QuizContext } from "../context/QuizContext";
import "./LeaderboardScreen.css";

// PUBLIC_INTERFACE
export default function LeaderboardScreen() {
  // Demo: Mocks, can add real-time update if multiplayer leaderboard is built
  const { state } = useContext(QuizContext);
  const demoLeaders = [
    { username: "RajFan", score: 185 },
    { username: "KollyQueen", score: 175 },
    { username: state.user?.username || "YOU", score: 162 }
  ];
  return (
    <div className="kv-leaderboard-screen">
      <h2>Leaderboard</h2>
      <table className="kv-leaderboard-table">
        <thead>
          <tr>
            <th>Rank</th><th>User</th><th>Score</th>
          </tr>
        </thead>
        <tbody>
          {demoLeaders.map((l, idx) => (
            <tr key={l.username} className={l.username === state.user?.username ? "kv-leaderboard-you" : ""}>
              <td>{idx+1}</td>
              <td>{l.username}</td>
              <td>{l.score}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="kv-leaderboard-note">Top cinephiles &amp; quiz champs for this week!</div>
    </div>
  );
}
