import React, { useEffect, useState } from 'react';
import './App.css';
import { fetchPopularTamilMovies, getPosterUrl } from './tmdbApi';

// Demonstrates TMDb API integration by fetching and displaying Tamil movies
function App() {
  const [kollywoodMovies, setKollywoodMovies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMovies() {
      setLoading(true);
      const movies = await fetchPopularTamilMovies(3);
      setKollywoodMovies(movies);
      setLoading(false);
    }
    fetchMovies();
  }, []);

  return (
    <div className="app">
      <nav className="navbar">
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
            <div className="logo">
              <span className="logo-symbol">*</span> KAVIA AI
            </div>
            <button className="btn">Template Button</button>
          </div>
        </div>
      </nav>

      <main>
        <div className="container">
          <div className="hero">
            <div className="subtitle">AI Workflow Manager Template</div>

            <h1 className="title">kollywood_quizverse</h1>

            <div className="description">
              Start building your application.
            </div>

            <button className="btn btn-large">Button</button>
          </div>
          {/* TMDb Movie Data Demo */}
          <div style={{ marginTop: 36 }}>
            <h2 style={{ color: "var(--base-light)", marginBottom: 16 }}>Popular Kollywood Movies (from TMDb)</h2>
            {loading ? (
              <div>Loading...</div>
            ) : (
              <div style={{ display: "flex", gap: 18 }}>
                {kollywoodMovies.map((movie) => (
                  <div key={movie.id} style={{ width: 170, textAlign: "center" }}>
                    <img
                      src={getPosterUrl(movie.poster_path)}
                      alt={movie.title}
                      style={{ width: "100%", borderRadius: 10, marginBottom: 10 }}
                    />
                    <div style={{ fontSize: "1.09rem", color: "#fff" }}>{movie.title}</div>
                  </div>
                ))}
              </div>
            )}
            <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: 8 }}>
              Data courtesy of <a href="https://www.themoviedb.org/" rel="noopener noreferrer" target="_blank" style={{ color: "var(--base-light)" }}>TMDb</a>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;