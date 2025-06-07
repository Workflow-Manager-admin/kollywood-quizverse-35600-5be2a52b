import React, { useState, useContext } from "react";
import { QuizContext } from "../context/QuizContext";
import "./LoginScreen.css";

// PUBLIC_INTERFACE
export default function LoginScreen() {
  const { dispatch } = useContext(QuizContext);
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");

  function doLogin(e) {
    e.preventDefault();
    if (!username.trim()) {
      setError("Please enter a username.");
      return;
    }
    dispatch({ type: "LOGIN", payload: { user: { username } } });
  }
  return (
    <div className="kv-login-screen">
      <div className="kv-login-card">
        <h2 style={{ color: "#212121" }}>Welcome to Kollywood QuizVerse</h2>
        <form onSubmit={doLogin}>
          <input
            type="text"
            placeholder="Enter your username"
            value={username}
            required
            maxLength={18}
            onChange={e => { setError(""); setUsername(e.target.value); }}
            className="kv-login-input"
            />
          <button type="submit" className="kv-btn kv-btn-large">
            Start Playing
          </button>
        </form>
        {error && <div className="kv-login-error">{error}</div>}
        <p className="kv-login-description">No account needed. Just enter a nickname to begin!</p>
      </div>
    </div>
  );
}
