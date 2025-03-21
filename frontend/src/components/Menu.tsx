import React, { useState } from 'react';
import '../styles/Menu.css';

interface MenuProps {
  onGameModeSelect: (mode: 'ai' | 'multiplayer', gameId?: string) => void;
}

const Menu: React.FC<MenuProps> = ({ onGameModeSelect }) => {
  const [showJoinInput, setShowJoinInput] = useState(false);
  const [gameId, setGameId] = useState('');

  const handleCreateGame = () => {
    // Generate a random game ID (we'll replace this with server-generated ID later)
    const newGameId = Math.random().toString(36).substring(2, 8).toUpperCase();
    onGameModeSelect('multiplayer', newGameId);
  };

  const handleJoinGame = () => {
    if (gameId.trim()) {
      onGameModeSelect('multiplayer', gameId.trim().toUpperCase());
    }
  };

  return (
    <div className="menu-container">
      <h1>Texas Hold'em Poker</h1>
      <div className="menu-options">
        <div className="menu-card" onClick={() => onGameModeSelect('ai')}>
          <h2>Play vs AI</h2>
          <p>Challenge our advanced AI opponent in a heads-up match</p>
        </div>
        <div className="menu-card" onClick={handleCreateGame}>
          <h2>Create Game</h2>
          <p>Start a new multiplayer game and invite friends</p>
        </div>
        <div className="menu-card" onClick={() => setShowJoinInput(true)}>
          <h2>Join Game</h2>
          <p>Join an existing game with a game code</p>
        </div>
      </div>

      {showJoinInput && (
        <div className="join-game-modal">
          <div className="modal-content">
            <h2>Join Game</h2>
            <input
              type="text"
              placeholder="Enter game code"
              value={gameId}
              onChange={(e) => setGameId(e.target.value.toUpperCase())}
              maxLength={6}
            />
            <div className="modal-buttons">
              <button onClick={handleJoinGame}>Join</button>
              <button onClick={() => setShowJoinInput(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Menu; 