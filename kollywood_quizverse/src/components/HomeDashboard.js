import React, { useContext } from "react";
import { QuizContext } from "../context/QuizContext";
import { useNavigate } from "react-router-dom";
import "./HomeDashboard.css";

const games = [
  {
    key: "blurredPoster",
    title: "Guess the Movie: Blurred Poster",
    description: "Can you spot it from a blur? Three tries, less blur each time!",
    icon: "🖼️"
  },
  {
    key: "castGuess",
    title: "Guess the Movie by Cast",
    description: "Pick the correct movie given its cast members.",
    icon: "👥"
  },
  {
    key: "charMovieMatch",
    title: "Character-Movie Match",
    description: "Drag characters into the right Kollywood movie.",
    icon: "🔗"
  },
  {
    key: "movieBingo",
    title: "Kollywood Movie Bingo",
    description: "Bingo grid: can you spot movies that match criteria?",
    icon: "🎲"
  },
  {
    key: "sixDegrees",
    title: "Six Degrees of Kollywood",
    description: "Connect two actors through Kollywood movies.",
    icon: "6️⃣"
  },
  {
    key: "speedRound",
    title: "Speed Round",
    description: "10 quick Kollywood questions — 60 seconds.",
    icon: "⏱️"
  },
  {
    key: "buffCert",
    title: "Movie Buff Certification",
    description: "Beat all levels to become a certified Kollywood cinephile!",
    icon: "🏆"
  }
];

// PUBLIC_INTERFACE
export default function HomeDashboard() {
  const { dispatch } = useContext(QuizContext);
  const navigate = useNavigate();

  function openGameModal(gameKey) {
    if (gameKey === "blurredPoster") {
      navigate("/blurred-poster-game");
    } else if (gameKey === "castGuess") {
      navigate("/cast-guess-game");
    } else {
      dispatch({ type: "OPEN_MODAL", payload: { name: gameKey } });
    }
  }
  return (
    <div className="kv-home-dashboard">
      <h1 className="kv-page-title">Kollywood QuizVerse</h1>
      <div className="kv-page-desc">Multiple quiz & game modes—powered by real Kollywood movie data!</div>
      <div className="kv-game-grid">
        {games.map(game => (
          <div className="kv-game-card" key={game.key}>
            <div className="kv-game-icon">{game.icon}</div>
            <div className="kv-game-title">{game.title}</div>
            <div className="kv-game-desc">{game.description}</div>
            <button className="kv-btn kv-btn-accent" onClick={() => openGameModal(game.key)}>
              Play
            </button>
          </div>
        ))}
      </div>
      <small className="kv-tmdb-attr">
        Movie data powered by <a rel="noopener noreferrer" target="_blank" href="https://www.themoviedb.org/" style={{ color: "var(--kv-accent)" }}>TMDb</a>
      </small>
    </div>
  );
}
