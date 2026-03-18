import React from 'react';

function EndScreen({ gameState, onReplay }) {
  if (!gameState) return <div>Chargement des résultats...</div>;

  const sorted = [...gameState.players].sort((a, b) => b.score - a.score);
  const isTie = sorted[0].score === sorted[1].score;
  const winner = !isTie ? sorted[0] : null;

  const MEDALS = ['🥇', '🥈'];

  return (
    <div className="end-screen-container">
      <h2>Partie terminée</h2>

      <div style={{ textAlign: 'center', marginBottom: '0.5rem' }}>
        {isTie ? (
          <div style={{ fontFamily: 'var(--font-head)', fontSize: '1.6rem', color: 'var(--yellow)', letterSpacing: '2px' }}>
            Égalité parfaite !
          </div>
        ) : (
          <div style={{ fontFamily: 'var(--font-head)', fontSize: '1.6rem', color: 'var(--green)', letterSpacing: '2px' }}>
            {winner.pseudo} remporte la partie !
          </div>
        )}
      </div>

      <div className="podium">
        {sorted.map((player, i) => (
          <div key={player.id} className={`podium-item ${i === 0 && !isTie ? 'first' : ''}`}>
            <span className="podium-rank">{MEDALS[i]}</span>
            <span className="podium-name">{player.pseudo}</span>
            <span className="podium-score">{player.score} pts</span>
          </div>
        ))}
      </div>

      <div className="divider" />

      <div className="end-actions">
        <button onClick={onReplay} className="btn-submit">
          🔄 Rejouer
        </button>
      </div>
    </div>
  );
}

export default EndScreen;
