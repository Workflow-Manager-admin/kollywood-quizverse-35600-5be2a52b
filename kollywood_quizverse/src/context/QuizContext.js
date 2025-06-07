import React, { createContext, useReducer } from "react";

const initialState = {
  user: null,
  screen: "home", // home | profile | leaderboard | scoreHistory...
  modal: null,    // active modal (game) by name, or null
  modalProps: {}, // additional props for modals/games
  scoreHistory: [],
  leaderboards: [],
};

export const QuizContext = createContext();

// PUBLIC_INTERFACE
function quizReducer(state, action) {
  switch (action.type) {
    case "LOGIN":
      return { ...state, user: action.payload.user, screen: "home" };
    case "LOGOUT":
      return { ...state, user: null, screen: "home", modal: null, modalProps: {} };
    case "SET_SCREEN":
      return { ...state, screen: action.payload, modal: null, modalProps: {} };
    case "OPEN_MODAL":
      return { ...state, modal: action.payload.name, modalProps: action.payload.props || {} };
    case "CLOSE_MODAL":
      return { ...state, modal: null, modalProps: {} };
    case "ADD_SCORE_HISTORY":
      return { ...state, scoreHistory: [action.payload, ...state.scoreHistory] };
    case "SET_LEADERBOARDS":
      return { ...state, leaderboards: action.payload };
    default:
      return state;
  }
}

// PUBLIC_INTERFACE
export function QuizProvider({ children }) {
  const [state, dispatch] = useReducer(quizReducer, initialState);

  return (
    <QuizContext.Provider value={{ state, dispatch }}>
      {children}
    </QuizContext.Provider>
  );
}
