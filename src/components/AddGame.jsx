import { useState, useEffect, useRef } from 'react';
import { addGame, pickExe } from '../stores/gameStore';
import { toLocalFileUrl } from '../utils/fileUrl';

export default function AddGame({ onClose, onAdded }) {
  const [name, setName] = useState('');
  const [exePath, setExePath] = useState('');
  const [coverPath, setCoverPath] = useState('');
  const [artResults, setArtResults] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [artStatus, setArtStatus] = useState('');
  const [downloadingIndex, setDownloadingIndex] = useState(null);
  const debounceRef = useRef(null);
  const fetchedForRef = useRef('');

  useEffect(() => {
    if (!name.trim() || name.trim().length < 2) return;
    if (fetchedForRef.current === name.trim()) return;

    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setArtStatus('Searching artwork...');
      setArtResults([]);
      setSelectedIndex(null);
      setCoverPath('');
      const results = await window.api.searchGameArt(name.trim());
      setArtResults(results || []);
      fetchedForRef.current = name.trim();
      setArtStatus('');
    }, 600);

    return () => clearTimeout(debounceRef.current);
  }, [name]);

  const handlePickExe = async () => {
    const filePath = await pickExe();
    if (filePath) {
      setExePath(filePath);
      if (!name) {
        const raw = filePath.split('\\').pop().split('/').pop().replace(/\.\w+$/, '');
        const cleaned = raw
          .replace(/([a-z])([A-Z])/g, '$1 $2')
          .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
          .replace(/[_\-\.]+/g, ' ')
          .trim();
        setName(cleaned);
      }
    }
  };

  const handleSelectArt = async (result, index) => {
    if (downloadingIndex !== null) return;
    setDownloadingIndex(index);
    const downloaded = await window.api.downloadArt(result.image, name.trim());
    if (downloaded) {
      setCoverPath(downloaded);
      setSelectedIndex(index);
    }
    setDownloadingIndex(null);
  };

  const handleSubmit = async () => {
    if (!name.trim() || !exePath.trim()) return;
    const updated = await addGame({
      name: name.trim(),
      exePath: exePath.trim(),
      coverPath: coverPath || null,
    });
    onAdded(updated);
  };

  const selectedSrc = toLocalFileUrl(coverPath);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal add-game-modal" onClick={(e) => e.stopPropagation()}>
        <h2 className="modal-title">Add Game</h2>

        <div className="form-group">
          <label>Executable</label>
          <div className="file-picker">
            <span className="file-path">{exePath || 'No file selected'}</span>
            <button onClick={handlePickExe} className="btn btn-secondary">Browse</button>
          </div>
        </div>

        <div className="form-group">
          <label>Game Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Auto-filled from exe, or type manually"
          />
        </div>

        {artStatus && <div className="art-searching">{artStatus}</div>}

        {artResults.length > 0 && (
          <div className="form-group">
            <label>Select Artwork</label>
            <div className="art-results-grid">
              {artResults.map((result, i) => (
                <div
                  key={i}
                  className={`art-result-item ${selectedIndex === i ? 'art-result-item--selected' : ''} ${downloadingIndex === i ? 'art-result-item--loading' : ''}`}
                  onClick={() => handleSelectArt(result, i)}
                  title={result.name}
                >
                  <img src={result.image} alt={result.name} draggable={false} />
                  <div className="art-result-name">{result.name}</div>
                  {downloadingIndex === i && (
                    <div className="art-result-overlay">Downloading...</div>
                  )}
                  {selectedIndex === i && downloadingIndex === null && (
                    <div className="art-result-overlay art-result-overlay--selected">✓</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {selectedSrc && (
          <div className="art-preview">
            <img src={selectedSrc} alt="Selected cover" draggable={false} />
          </div>
        )}

        <div className="modal-actions">
          <button onClick={onClose} className="btn btn-secondary">Cancel</button>
          <button
            onClick={handleSubmit}
            className="btn btn-primary"
            disabled={!name.trim() || !exePath.trim()}
          >
            Add Game
          </button>
        </div>
      </div>
    </div>
  );
}
