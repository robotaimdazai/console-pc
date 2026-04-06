import { useState } from 'react';

export default function ArtSearch({ game, onClose }) {
  const [query, setQuery] = useState(game.name);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [downloadingIndex, setDownloadingIndex] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setHasSearched(true);
    const res = await window.api.searchGameArt(query.trim());
    setResults(res || []);
    setLoading(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSearch();
  };

  const handleSelect = async (result, index) => {
    if (downloadingIndex !== null || !result.image) return;
    setDownloadingIndex(index);
    try {
      const localPath = await window.api.downloadArt(result.image, game.name);
      if (localPath) {
        await window.api.updateGameCover(game.id, localPath);
      }
    } catch (err) {
      console.error('Failed to apply artwork:', err);
    }
    setDownloadingIndex(null);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal art-search-modal" onClick={(e) => e.stopPropagation()}>
        <h2 className="modal-title">Search Artwork</h2>
        <p className="art-search-subtitle">{game.name}</p>

        <div className="art-search-row">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search by game name..."
            autoFocus
          />
          <button
            className="btn btn-primary"
            onClick={handleSearch}
            disabled={loading || !query.trim()}
          >
            {loading ? '...' : 'Search'}
          </button>
        </div>

        {loading && <div className="art-searching">Searching for artwork...</div>}

        {!loading && hasSearched && results.length === 0 && (
          <div className="art-searching">No results found. Try a different name.</div>
        )}

        {!loading && !hasSearched && (
          <div className="art-searching">Enter a game name above and press Search.</div>
        )}

        {results.length > 0 && !loading && (
          <div className="art-results-grid">
            {results.map((result, i) => (
              <div
                key={i}
                className={`art-result-item ${downloadingIndex === i ? 'art-result-item--loading' : ''}`}
                onClick={() => handleSelect(result, i)}
                title={result.name}
              >
                <img src={result.image} alt={result.name} draggable={false} />
                <div className="art-result-name">{result.name}</div>
                {downloadingIndex === i && (
                  <div className="art-result-overlay">Applying...</div>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
