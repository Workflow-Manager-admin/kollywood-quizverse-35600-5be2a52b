import React, { useEffect, useState, useContext } from "react";
import { fetchPopularTamilMovies, getPosterUrl } from "../../tmdbApi";
import { QuizContext } from "../../context/QuizContext";
import "./CastGuessGame.css";

async function fetchMovieCast(movieId) {
  const url = `https://api.themoviedb.org/3/movie/${movieId}/credits?api_key=5bc67d3b06aecbd18121a3cbbc16eb59`;
  try {
    const response = await fetch(url);
    if (!response.ok) return [];
    const data = await response.json();
    return (data.cast || []).slice(0, 4);
  } catch {
    return [];
  }
}

// PUBLIC_INTERFACE
export default function CastGuessGame() {
  const [question, setQuestion] = useState(null);
  const [answerIdx, setAnswerIdx] = useState(null);
  const [done, setDone] = useState(false);
  const { dispatch } = useContext(QuizContext);

  useEffect(() => {
    async function setup() {
      const movies = await fetchPopularTamilMovies(5);
      const correctMovie = movies[0];
      const options = [movies[0], ...movies.slice(1, 4)].sort(() => Math.random()-0.5);
      const cast = await fetchMovieCast(correctMovie.id);
      setQuestion({ cast, options, answerId: correctMovie.id });
    }
    setup();
  }, []);

  function handleChoice(i) {
    setAnswerIdx(i);
    setDone(true);
    dispatch({
      type: "ADD_SCORE_HISTORY",
      payload: {
        game: "Guess by Cast",
        score: question.options[i].id === question.answerId ? 5 : 0,
        time: new Date().toLocaleString()
      }
    });
  }
  function close() {
    dispatch({ type: "CLOSE_MODAL" });
  }

  if (!question) return <div style={{ minHeight: 220 }}>Loading...</div>;

  return (
    <div className="kv-game-modal">
      <h2>Guess the Movie by Cast</h2>
      <div className="kv-cast-row">
        {question.cast.length > 0 ? (
          <>
            <span>Cast:</span>
            {question.cast.map(m => (
              <span className="kv-cast-bubble" key={m.id || m.name}>{m.name}</span>
            ))}
          </>
        ) : (
          <span>No cast data, try guessing!</span>
        )}
      </div>
      <div className="kv-cast-choices">
        {question.options.map((mov, i) => (
          <button
            key={mov.id}
            onClick={() => handleChoice(i)}
            className={
              done
                ? mov.id === question.answerId
                  ? "kv-cast-correct"
                  : i === answerIdx
                  ? "kv-cast-wrong"
                  : "kv-cast-default"
                : "kv-cast-btn"
            }
            disabled={done}
          >
            <img src={getPosterUrl(mov.poster_path, "w185")} style={{ width: 90, borderRadius: 9 }} alt="" />
            <div>{mov.title}</div>
          </button>
        ))}
      </div>
      {done ? (
        <div className="kv-cast-result">
          {question.options[answerIdx].id === question.answerId ? "🎉 Correct!" : "❌ Wrong"}
          <button className="kv-btn" onClick={close} style={{ marginLeft: 14 }}>
            Close
          </button>
        </div>
      ) : null}
    </div>
  );
}
