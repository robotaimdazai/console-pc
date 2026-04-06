import { useMemo, useState } from 'react';
import { toLocalFileUrl } from '../utils/fileUrl';
import ArtSearch from './ArtSearch';

const COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e',
  '#f97316', '#eab308', '#22c55e', '#06b6d4',
  '#3b82f6', '#a855f7',
];

export default function GameCard({ game, onLaunch, onRemove }) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [showArtSearch, setShowArtSearch] = useState(false);

  const bgColor = useMemo(() => {
    let hash = 0;
    for (const ch of game.name) hash = ch.charCodeAt(0) + ((hash << 5) - hash);
    return COLORS[Math.abs(hash) % COLORS.length];
  }, [game.name]);

  const initials = game.name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('');

  const coverSrc = toLocalFileUrl(game.coverPath);

  const handleRemoveClick = (e) => {
    e.stopPropagation();
    if (showConfirm) {
      onRemove();
      setShowConfirm(false);
    } else {
      setShowConfirm(true);
    }
  };

  const handleBlurConfirm = () => {
    setShowConfirm(false);
  };

  const handleArtClick = (e) => {
    e.stopPropagation();
    setShowArtSearch(true);
  };

  return (
    <>
      <div className="game-card" onClick={onLaunch}>
        <button
          className={`game-card-remove ${showConfirm ? 'confirm' : ''}`}
          onClick={handleRemoveClick}
          onBlur={handleBlurConfirm}
          title={showConfirm ? 'Click again to confirm' : 'Remove game'}
        >
          {showConfirm ? '✓' : '✕'}
        </button>
        <button
          className="game-card-art-btn"
          onClick={handleArtClick}
          title="Search artwork"
        >
          🖼
        </button>
        <div className="game-card-art">
          {coverSrc ? (
            <img src={coverSrc} alt={game.name} draggable={false} />
          ) : (
            <div className="game-card-placeholder" style={{ background: bgColor }}>
              <span>{initials}</span>
            </div>
          )}
        </div>
        <div className="game-card-title">{game.name}</div>
      </div>

      {showArtSearch && (
        <ArtSearch game={game} onClose={() => setShowArtSearch(false)} />
      )}
    </>
  );
}
