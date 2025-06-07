import React, { useContext } from "react";
import { QuizContext } from "../context/QuizContext";
import "./ProfileScreen.css";

// PUBLIC_INTERFACE
export default function ProfileScreen() {
  const { state } = useContext(QuizContext);
  const { user } = state;
  return (
    <div className="kv-profile-screen">
      <h2 style={{ color: "var(--kv-primary)" }}>Profile</h2>
      <div className="kv-profile-summary">
        <div className="kv-profile-avatar-large">{user.username[0].toUpperCase()}</div>
        <div><b>Username:</b> {user.username}</div>
        <div><b>Games Played:</b> {state.scoreHistory?.length || 0}</div>
      </div>
    </div>
  );
}
