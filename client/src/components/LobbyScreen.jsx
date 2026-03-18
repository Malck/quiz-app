import React from 'react';

function LobbyScreen({ roomCode, gameState, currentPlayerPseudo, onReady }) {
  if (!gameState) return <div>Chargement du lobby...</div>;

  const currentPlayer = gameState.players.find(p => p.pseudo === currentPlayerPseudo);
  const isPlayerReady = currentPlayer?.isReady ?? false;

  return (
    <div className="lobby-container">
      <h2>Lobby</h2>

      <div className="room-code">
        <div className="room-code-label">Code à partager</div>
        <div className="room-code-value">{roomCode}</div>
      </div>

      <div>
        <h3>Joueurs</h3>
        <ul className="player-list">
          {gameState.players.map(player => (
            <li key={player.id} className={player.isReady ? 'ready' : ''}>
              <span>
                {player.pseudo}
                {player.pseudo === currentPlayerPseudo && (
                  <span className="player-badge" style={{ marginLeft: '0.5rem' }}>Vous</span>
                )}
              </span>
              <span className="player-status">
                {player.isReady ? '✅ Prêt' : '⏳ Attente'}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {gameState.players.length < 2 && (
        <p className="waiting-message">
          En attente d'un adversaire
          <span className="dots">
            <span /><span /><span />
          </span>
        </p>
      )}

      {gameState.players.length === 2 && !isPlayerReady && (
        <button onClick={onReady} className="btn-submit">
          Je suis prêt !
        </button>
      )}

      {gameState.players.length === 2 && isPlayerReady && (
        <p className="waiting-message">
          En attente de l'autre joueur
          <span className="dots">
            <span /><span /><span />
          </span>
        </p>
      )}
    </div>
  );
}

export default LobbyScreen;
