import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/GameLobby.css';

const GameLobby: React.FC = () => {
  const [playerName, setPlayerName] = useState('');
  const [gameCode, setGameCode] = useState('');
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

  const handleJoinGame = () => {
    if (!playerName.trim()) {
      setError('Please enter your name');
      return;
    }
    if (!gameCode.trim()) {
      setError('Please enter a game code');
      return;
    }
    navigate(`/game/${gameCode}?name=${encodeURIComponent(playerName)}`);
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

        <div className="form-divider">OR</div>

        <div className="form-group">
          <label htmlFor="gameCode">Game Code:</label>
          <input
            type="text"
            id="gameCode"
            value={gameCode}
            onChange={(e) => setGameCode(e.target.value.toUpperCase())}
            placeholder="Enter game code"
            maxLength={6}
          />
        </div>

        <div className="form-group">
          <button className="join-game-btn" onClick={handleJoinGame}>
            Join Game
          </button>
        </div>

        {error && <div className="error-message">{error}</div>}
      </div>
    </div>
  );
};

export default GameLobby; 