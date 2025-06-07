import React, { useContext } from "react";
import "./App.css";
import { QuizProvider, QuizContext } from "./context/QuizContext";
import Navbar from "./components/Navbar";
import HomeDashboard from "./components/HomeDashboard";
import LoginScreen from "./components/LoginScreen";
import GameModalManager from "./components/GameModalManager";
import ProfileScreen from "./components/ProfileScreen";
import LeaderboardScreen from "./components/LeaderboardScreen";
import ScoreHistoryScreen from "./components/ScoreHistoryScreen";

// PUBLIC_INTERFACE
function KollywoodQuizVerseApp() {
  const { state } = useContext(QuizContext);

  let content;
  if (!state.user) {
    content = <LoginScreen />;
  } else if (state.screen === "home") {
    content = <HomeDashboard />;
  } else if (state.screen === "profile") {
    content = <ProfileScreen />;
  } else if (state.screen === "leaderboard") {
    content = <LeaderboardScreen />;
  } else if (state.screen === "scoreHistory") {
    content = <ScoreHistoryScreen />;
  } else {
    content = <HomeDashboard />; // fallback to dashboard
  }
  return (
    <div className="app kv-theme">
      <Navbar />
      <main className="kv-main-content">
        {content}
        <GameModalManager />
      </main>
    </div>
  );
}

// PUBLIC_INTERFACE
export default function App() {
  return (
    <QuizProvider>
      <KollywoodQuizVerseApp />
    </QuizProvider>
  );
}
