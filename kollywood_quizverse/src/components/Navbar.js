import React, { useContext } from "react";
import { QuizContext } from "../context/QuizContext";
import "./Navbar.css";

// PUBLIC_INTERFACE
export default function Navbar() {
  const { state, dispatch } = useContext(QuizContext);
  return (
    <nav className="kv-navbar">
      <div className="kv-navbar-inner">
        <div className="kv-navbar-brand" onClick={() => dispatch({ type: "SET_SCREEN", payload: "home" })}>
          <span className="kv-logo-symbol">🎬</span>
          Kollywood QuizVerse
        </div>
        {state.user && (
          <div className="kv-navbar-links">
            <button className="kv-nav-btn" onClick={() => dispatch({ type: "SET_SCREEN", payload: "home" })}>
              Home
            </button>
            <button className="kv-nav-btn" onClick={() => dispatch({ type: "SET_SCREEN", payload: "profile" })}>
              Profile
            </button>
            <button className="kv-nav-btn" onClick={() => dispatch({ type: "SET_SCREEN", payload: "scoreHistory" })}>
              Scores
            </button>
            <button className="kv-nav-btn" onClick={() => dispatch({ type: "SET_SCREEN", payload: "leaderboard" })}>
              Leaderboard
            </button>
            <button className="kv-nav-btn" onClick={() => dispatch({ type: "LOGOUT" })}>
              Logout
            </button>
            <span className="kv-navbar-user">
              <span className="kv-profile-avatar">{state.user?.username ? state.user.username[0].toUpperCase() : "U"}</span>
            </span>
          </div>
        )}
      </div>
    </nav>
  );
}
