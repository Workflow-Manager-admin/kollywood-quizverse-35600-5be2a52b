import React, { useEffect, useState, useContext } from "react";
import { fetchToughTamilMovies, getPosterUrl } from "../../tmdbApi";
import { QuizContext } from "../../context/QuizContext";
import { useNavigate } from "react-router-dom";
import "./CharMovieMatchGame.css";

async function fetchCharacterSample(movies) {
  const apiKey = "5bc67d3b06aecbd18121a3cbbc16eb59";
  const list = [];
  for (const m of movies) {
    try {
      const resp = await fetch(`https://api.themoviedb.org/3/movie/${m.id}/credits?api_key=${apiKey}`);
      const data = await resp.json();
      const firstChar = (data.cast || [])[0];
      list.push({
        character: firstChar ? firstChar.character : "??",
        movie: m,
      });
    } catch {
      list.push({
        character: "??",
        movie: m,
      });
    }
  }
  return list;
}

/**
 * CharMovieMatchGame can be rendered in a modal or as a standalone game.
 * In standalone mode, auto-start a session on mount,
 * show in-session score at the top, and show a Back button.
 * Score is recorded and displayed at the end of play.
 */
// PUBLIC_INTERFACE

export default function CharMovieMatchGame({ standalone }) {
  const [sample, setSample] = useState([]);
  const [dropped, setDropped] = useState({});
  const [done, setDone] = useState(false);
  const [score, setScore] = useState(0);
  const { dispatch } = useContext(QuizContext);
  const navigate = useNavigate();

  // On mount, or when standalone, always start a new game session
  useEffect(() => {
    async function load() {
      // Get a batch of movies for unique, non-mainstream character-movie matches
      const movies = await fetchToughTamilMovies({ count: 4 });
      const pairs = await fetchCharacterSample(movies);
      setSample(pairs.sort(() => Math.random() - 0.5));
      setDropped({});
      setDone(false);
      setScore(0);
    }
    load();
    // eslint-disable-next-line
  }, [standalone]);

  // Remove auto-redirect for standalone after done
  // User can use Back/go home at their discretion after seeing score/results

  function handleDrop(e, movId) {
    const char = e.dataTransfer.getData("text/plain");
    setDropped(prev => ({ ...prev, [movId]: char }));
  }
  function handleDragStart(e, char) {
    e.dataTransfer.setData("text/plain", char);
  }

  function allMatched() {
    return sample.length > 0 && Object.keys(dropped).length === sample.length;
  }

  function checkAndSave() {
    let calcScore = 0;
    for (const sp of sample) {
      if (dropped[sp.movie.id] === sp.character) calcScore++;
    }
    setScore(calcScore);
    setDone(true);
    dispatch({
      type: "ADD_SCORE_HISTORY",
      payload: {
        game: "Character Match",
        score: calcScore,
        time: new Date().toLocaleString()
      }
    });
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

  // Header row for Back and Score (standalone)
  const headerRow = standalone ? (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8
    }}>
      <button
        className="kv-btn kv-btn-accent"
        style={{ minWidth: 58 }}
        onClick={handleGoBack}
        disabled={standalone && done}
        title={standalone && done ? "Returning to home..." : ""}
      >
        &larr; Back
      </button>
      <div style={{
        background: "#ffd600", color: "#d32f2f", fontWeight: 700,
        fontSize: "1.08rem", borderRadius: 7, padding: "4px 17px", minWidth: 60, textAlign: "center",
        boxShadow: "0 1px 8px #efb01d21", display: "inline-block"
      }}>
        Score: {score} / {sample.length || 4}
      </div>
    </div>
  ) : null;

  return (
    <div className="kv-game-modal">
      {headerRow}
      <h2>Character-Movie Match</h2>
      <div className="kv-char-match-info">
        Drag the character name onto the correct movie poster.
      </div>
      <div className="kv-char-match-row">
        <div className="kv-char-match-chars">
          {sample.map((sp, i) => (
            <div
              className="kv-char-draggable"
              key={sp.character + i}
              draggable={!done}
              onDragStart={e => handleDragStart(e, sp.character)}
              style={done ? { opacity: 0.6, cursor: "not-allowed" } : {}}
            >
              {sp.character}
            </div>
          ))}
        </div>
        <div className="kv-char-match-movies">
          {sample.map((sp, i) => (
            <div
              key={sp.movie.id}
              className="kv-char-dropzone"
              onDrop={e => !done && handleDrop(e, sp.movie.id)}
              onDragOver={e => e.preventDefault()}
              style={done ? { opacity: 0.7 } : {}}
            >
              <img src={getPosterUrl(sp.movie.poster_path)} style={{ width: 100, borderRadius: 10 }} alt="" />
              <div className="kv-drop-label">
                {dropped[sp.movie.id] || "Drop here"}
              </div>
            </div>
          ))}
        </div>
      </div>
      {!done ? (
        <button
          className="kv-btn"
          onClick={checkAndSave}
          disabled={!allMatched() || done}
          style={{ marginTop: 12 }}
        >
          Submit
        </button>
      ) : (
        <div style={{ marginTop: 14 }}>
          <b>Final Score: {score} / {sample.length}</b>
          {standalone ? (
            <div style={{ color: "#439638", fontSize: 13, marginTop: 7, fontWeight: 500 }}>
              Game complete. Use 'Back' to return or refresh for a new game!
            </div>
          ) : null}
          <button
            className="kv-btn"
            onClick={handleCloseOrHome}
            style={{ marginLeft: 18 }}
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
