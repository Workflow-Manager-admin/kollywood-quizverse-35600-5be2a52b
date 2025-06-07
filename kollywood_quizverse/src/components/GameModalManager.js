import React, { useContext } from "react";
import { QuizContext } from "../context/QuizContext";
import BlurredPosterGame from "./games/BlurredPosterGame";
import CastGuessGame from "./games/CastGuessGame";
import CharMovieMatchGame from "./games/CharMovieMatchGame";
import MovieBingoGame from "./games/MovieBingoGame";
import SixDegreesGame from "./games/SixDegreesGame";
import SpeedRoundGame from "./games/SpeedRoundGame";
import BuffCertGame from "./games/BuffCertGame";
import "./GameModalManager.css";

// PUBLIC_INTERFACE
export default function GameModalManager() {
  const { state, dispatch } = useContext(QuizContext);

  let modalContent = null;
  switch (state.modal) {
    case "blurredPoster":
      modalContent = <BlurredPosterGame />;
      break;
    case "castGuess":
      modalContent = <CastGuessGame />;
      break;
    case "charMovieMatch":
      modalContent = <CharMovieMatchGame />;
      break;
    case "movieBingo":
      modalContent = <MovieBingoGame />;
      break;
    case "sixDegrees":
      modalContent = <SixDegreesGame />;
      break;
    case "speedRound":
      modalContent = <SpeedRoundGame />;
      break;
    case "buffCert":
      modalContent = <BuffCertGame />;
      break;
    default:
      modalContent = null;
  }
  if (!modalContent) return null;

  function onClose() {
    dispatch({ type: "CLOSE_MODAL" });
  }
  return (
    <div className="kv-modal-overlay" tabIndex={-1} onClick={onClose}>
      <div className="kv-modal-content" role="dialog" aria-modal="true" onClick={e => e.stopPropagation()}>
        <button className="kv-modal-close" onClick={onClose} title="Close games">&times;</button>
        {modalContent}
      </div>
    </div>
  );
}
