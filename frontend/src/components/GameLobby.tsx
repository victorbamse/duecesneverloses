import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/GameLobby.css';

const GameLobby: React.FC = () => {
  const [playerName, setPlayerName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const generateGameCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const handleCreateGame = () => {
    if (!playerName.trim()) {
      setError('Please enter your name');
      return;
    }
    const newGameCode = generateGameCode();
    navigate(`/game/${newGameCode}?host=true&name=${encodeURIComponent(playerName)}`);
  };

  return (
    <div className="game-lobby">
      <h1>Texas Hold'em Poker</h1>
      
      <div className="lobby-form">
        <div className="form-group">
          <label htmlFor="playerName">Your Name:</label>
          <input
            type="text"
            id="playerName"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            placeholder="Enter your name"
            maxLength={20}
          />
        </div>

        <div className="form-group">
          <button className="create-game-btn" onClick={handleCreateGame}>
            Create New Game
          </button>
        </div>

        <div className="info-text">
          Create a game and share the link with your friends to play together!
        </div>

        {error && <div className="error-message">{error}</div>}
      </div>
    </div>
  );
};

export default GameLobby; 