import React, { useEffect, useState, useContext } from "react";
import { fetchPopularTamilMovies, getPosterUrl } from "../../tmdbApi";
import { QuizContext } from "../../context/QuizContext";
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

// PUBLIC_INTERFACE
export default function CharMovieMatchGame() {
  const [sample, setSample] = useState([]);
  const [dropped, setDropped] = useState({});
  const [done, setDone] = useState(false);
  const { dispatch } = useContext(QuizContext);

  useEffect(() => {
    async function load() {
      const movies = await fetchPopularTamilMovies(4);
      const pairs = await fetchCharacterSample(movies);
      setSample(pairs.sort(() => Math.random()-0.5));
    }
    load();
  }, []);

  function handleDrop(e, movId) {
    const char = e.dataTransfer.getData("text/plain");
    setDropped({ ...dropped, [movId]: char });
  }
  function handleDragStart(e, char) {
    e.dataTransfer.setData("text/plain", char);
  }

  function allMatched() {
    return sample.length > 0 && Object.keys(dropped).length === sample.length;
  }

  function checkAndSave() {
    let score = 0;
    for (const sp of sample) {
      if (dropped[sp.movie.id] === sp.character) score++;
    }
    setDone(true);
    dispatch({
      type: "ADD_SCORE_HISTORY",
      payload: {
        game: "Character Match",
        score: score,
        time: new Date().toLocaleString()
      }
    });
  }

  function close() {
    dispatch({ type: "CLOSE_MODAL" });
  }

  return (
    <div className="kv-game-modal">
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
              draggable
              onDragStart={e => handleDragStart(e, sp.character)}
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
              onDrop={e => handleDrop(e, sp.movie.id)}
              onDragOver={e => e.preventDefault()}
            >
              <img src={getPosterUrl(sp.movie.poster_path)} style={{ width: 100, borderRadius: 10 }} alt="" />
              <div className="kv-drop-label">
                {dropped[sp.movie.id] || "Drop here"}
              </div>
            </div>
          ))}
        </div>
      </div>
      <button
        className="kv-btn"
        onClick={checkAndSave}
        disabled={!allMatched() || done}
        style={{ marginTop: 12 }}
      >
        Submit
      </button>
      {done && (
        <div style={{ marginTop: 14 }}>
          <b>Score: {Object.keys(dropped).filter((k, i) => dropped[k] === sample[i]?.character).length}</b>
          <button className="kv-btn" onClick={close} style={{ marginLeft: 18 }}>
            Close
          </button>
        </div>
      )}
    </div>
  );
}
