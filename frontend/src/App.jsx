import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [movies, setMovies] = useState([]);
  const [selectedMovie, setSelectedMovie] = useState('');
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  
  const [filteredMovies, setFilteredMovies] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);


  const TMDB_API_KEY = "2c84ff3fb50db66f066668b3be97e592"; 

  useEffect(() => {
    axios.get('https://movie-reccommendation-system-br49.onrender.com')
      .then(res => setMovies(res.data.movies))
      .catch(err => console.error("Error fetching movies list:", err));
  }, []);

  const fetchPoster = async (movieId) => {
    if (!TMDB_API_KEY) return null;
    try {
      const response = await axios.get(
        `https://api.themoviedb.org/3/movie/${movieId}?api_key=${TMDB_API_KEY}`
      );
      const posterPath = response.data.poster_path;
      return posterPath ? `https://image.tmdb.org/t/p/w500${posterPath}` : null;
    } catch (err) {
      return null;
    }
  };

  const handleRecommend = async () => {
    if (!selectedMovie) {
      setError("Please select a movie from the dropdown first!");
      return;
    }
    setLoading(true);
    setError('');
    setRecommendations([]);

    try {
      const res = await axios.post('http://127.0.0.1:5000/api/recommend', {
        movie: selectedMovie
      });

      const rawRecs = res.data.recommendations;

      const detailedRecs = await Promise.all(
        rawRecs.map(async (movie) => {
          const posterUrl = await fetchPoster(movie.movie_id);
          return { ...movie, poster: posterUrl };
        })
      );

      setRecommendations(detailedRecs);
    } catch (err) {
      setError("Failed to connect with the prediction engine.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="white-app-root">
      <div className="white-app-container">
        
        {/* Exact Clean Centered Title */}
        <h1 className="white-app-title">Movie Recommender System</h1>

        {/* Grayish-Blue Center Console Box with Search Autocomplete Integration */}
        <div className="white-search-panel">
          
          <div className="search-wrapper" style={{ position: 'relative', flex: 1, textAlign: 'left' }}>
            <input
              type="text"
              value={selectedMovie}
              placeholder="Type or select a movie from the dropdown"
              className="white-dropdown-select"
              onChange={(e) => {
                const value = e.target.value;
                setSelectedMovie(value);
                
                if (value.trim().length > 0) {
                  
                  const matches = movies.filter(movie => 
                    movie.toLowerCase().includes(value.toLowerCase())
                  ).slice(0, 8); 
                  setFilteredMovies(matches);
                  setShowSuggestions(true);
                } else {
                  setFilteredMovies([]);
                  setShowSuggestions(false);
                }
              }}
              onFocus={() => {
                
                const matches = movies.filter(movie => 
                  movie.toLowerCase().includes(selectedMovie.toLowerCase())
                ).slice(0, 8);
                setFilteredMovies(matches);
                setShowSuggestions(true);
              }}
              onBlur={() => {
                
                setTimeout(() => setShowSuggestions(false), 250);
              }}
            />

            {/* Smart Overlay Suggestion Window */}
            {showSuggestions && filteredMovies.length > 0 && (
              <ul className="suggestions-dropdown" style={{
                position: 'absolute',
                top: '105%',
                left: 0,
                right: 0,
                backgroundColor: '#ffffff',
                border: '1px solid #ced4da',
                borderRadius: '4px',
                listStyle: 'none',
                margin: 0,
                padding: 0,
                maxHeight: '220px',
                overflowY: 'auto',
                zIndex: 9999,
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
              }}>
                {filteredMovies.map((movie, index) => (
                  <li
                    key={index}
                    onClick={() => {
                      setSelectedMovie(movie);
                      setShowSuggestions(false);
                    }}
                    style={{
                      padding: '10px 14px',
                      cursor: 'pointer',
                      borderBottom: '1px solid #f1f3f5',
                      color: '#333333',
                      fontSize: '0.95rem',
                      backgroundColor: '#ffffff',
                      transition: 'background-color 0.2s ease'
                    }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#e8f4fd'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = '#ffffff'}
                  >
                    {movie}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <button onClick={handleRecommend} className="white-action-btn" disabled={loading}>
            {loading ? 'Loading...' : 'Show Recommendation'}
          </button>
        </div>

        {error && <p className="white-error-banner">{error}</p>}

        {/* Exact 5-Column Grid Layout Row */}
        {!loading && recommendations.length > 0 && (
          <div className="white-movies-grid">
            {recommendations.map((movie, index) => (
              <div key={index} className="white-movie-card">
                <div className="white-poster-container">
                  {movie.poster ? (
                    <img src={movie.poster} alt={movie.title} className="white-real-img" />
                  ) : (
                    <div className="white-fallback-ui">
                      <span className="white-fallback-icon">🎬</span>
                      <span className="white-fallback-meta">Poster Cleaned</span>
                    </div>
                  )}
                </div>
                <div className="white-movie-meta-block">
                  <p className="white-movie-title-text">{movie.title}</p>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}

export default App;