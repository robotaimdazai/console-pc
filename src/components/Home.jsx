import GameCard from './GameCard';

export default function Home({ games, visible, gamerTag, onLaunch, onRemove, onAddGame }) {
  if (!visible) return null;

  if (games.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-icon">🎮</div>
        <h2>No Games Yet</h2>
        <p>Click the button below to add your first game</p>
        <button className="btn btn-primary" onClick={onAddGame} style={{ marginTop: 16 }}>
          ＋ Add Game
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="welcome-banner">
        <div className="welcome-brand">ConsolePC</div>
        <div className="welcome-icon">🎮</div>
        {gamerTag ? (
          <div className="welcome-message">
            HELLO, <span className="welcome-tag">{gamerTag}</span>. WELCOME.
          </div>
        ) : (
          <div className="welcome-message">HELLO & WELCOME.</div>
        )}
        <div className="welcome-sub">YOUR GAMES WERE LOADED.</div>
      </div>
      <h2 className="section-title">All Games</h2>
      <div className="game-grid">
        {games.map((game) => (
          <GameCard
            key={game.id}
            game={game}
            onLaunch={() => onLaunch(game)}
            onRemove={() => onRemove(game)}
          />
        ))}
      </div>
    </>
  );
}
