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
import BlurredPosterGame from "./components/games/BlurredPosterGame";

// React Router imports
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";

// PUBLIC_INTERFACE
function KollywoodQuizVerseAppWithRouter() {
  const { state } = useContext(QuizContext);
  const location = useLocation();

  if (!state.user) {
    // Always redirect any route to login if not logged in
    return (
      <>
        <Navbar />
        <main className="kv-main-content"><LoginScreen /></main>
      </>
    );
  }

  return (
    <div className="app kv-theme">
      <Navbar />
      <main className="kv-main-content">
        <Routes>
          <Route path="/" element={<HomeDashboard />} />
          <Route path="/blurred-poster-game" element={<BlurredPosterGame standalone={true} />} />
          <Route path="/profile" element={<ProfileScreen />} />
          <Route path="/leaderboard" element={<LeaderboardScreen />} />
          <Route path="/score-history" element={<ScoreHistoryScreen />} />
          <Route path="*" element={<HomeDashboard />} />
        </Routes>
        {/* Only show GameModalManager if NOT on blurred-poster-game route */}
        {location.pathname !== "/blurred-poster-game" && <GameModalManager />}
      </main>
    </div>
  );
}

// PUBLIC_INTERFACE
export default function App() {
  // Wrap in BrowserRouter for routing context
  return (
    <QuizProvider>
      <BrowserRouter>
        <KollywoodQuizVerseAppWithRouter />
      </BrowserRouter>
    </QuizProvider>
  );
}
