import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import '../styles/PokerTable.css';

interface Card {
  suit: 'hearts' | 'diamonds' | 'clubs' | 'spades';
  value: string;
}

interface Player {
  id: string;
  name: string;
  chips: number;
  cards?: Card[];
  isActive: boolean;
  position: number;
  isTurn: boolean;
}

interface GameState {
  id: string;
  players: Player[];
  communityCards: Card[];
  pot: number;
  currentBet: number;
  gameStage: 'waiting' | 'pre-flop' | 'flop' | 'turn' | 'river';
  minPlayers: number;
  maxPlayers: number;
  startingChips: number;
  smallBlind: number;
  bigBlind: number;
}

const SOCKET_URL = process.env.NODE_ENV === 'production' 
  ? 'https://duecesneverloses.se' 
  : 'http://localhost:3001';

const PokerTable: React.FC = () => {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const [socket, setSocket] = useState<ReturnType<typeof io> | null>(null);
  const [playerName, setPlayerName] = useState('');
  const [isJoining, setIsJoining] = useState(true);
  const [gameState, setGameState] = useState<GameState>({
    id: gameId || '',
    players: [],
    communityCards: [],
    pot: 0,
    currentBet: 0,
    gameStage: 'waiting',
    minPlayers: 2,
    maxPlayers: 6,
    startingChips: 1000,
    smallBlind: 10,
    bigBlind: 20
  });
  const [error, setError] = useState<string | null>(null);
  const [betAmount, setBetAmount] = useState(gameState.bigBlind);
  const [shareUrl, setShareUrl] = useState('');

  useEffect(() => {
    setShareUrl(`${window.location.origin}/game/${gameId}`);
  }, [gameId]);

  const handleJoinGame = () => {
    if (!playerName.trim()) {
      setError('Please enter your name');
      return;
    }

    const newSocket = io(SOCKET_URL);
    setSocket(newSocket);

    newSocket.on('connect', () => {
      newSocket.emit('joinGame', {
        gameId,
        playerName: playerName.trim()
      });
    });

    newSocket.on('gameJoined', (state: GameState) => {
      setGameState(state);
      setIsJoining(false);
      setError(null);
    });

    newSocket.on('gameError', (message: string) => {
      setError(message);
      if (message === 'Game not found' || message === 'Game is full') {
        setTimeout(() => navigate('/'), 3000);
      }
    });

    newSocket.on('gameStateUpdated', (state: GameState) => {
      setGameState(state);
    });

    newSocket.on('disconnect', () => {
      setError('Lost connection to server');
    });

    return () => {
      newSocket.disconnect();
    };
  };

  const handleAction = (action: 'fold' | 'check' | 'call' | 'raise') => {
    if (!socket) return;

    socket.emit('playerAction', {
      gameId,
      action,
      amount: action === 'raise' ? betAmount : undefined
    });
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    // Show temporary success message
    const el = document.createElement('div');
    el.className = 'copy-success';
    el.textContent = 'Link copied!';
    document.body.appendChild(el);
    setTimeout(() => document.body.removeChild(el), 2000);
  };

  if (isJoining) {
    return (
      <div className="join-game">
        <h2>Join Game</h2>
        <div className="join-form">
          <input
            type="text"
            placeholder="Enter your name"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            maxLength={20}
          />
          <button onClick={handleJoinGame}>Join</button>
        </div>
        {error && <div className="error-message">{error}</div>}
      </div>
    );
  }

  const currentPlayer = gameState.players.find(p => socket?.id === p.id);

  return (
    <div className="poker-room">
      <div className="game-header">
        <div className="game-info">
          <span>Game ID: {gameId}</span>
          <button className="share-button" onClick={handleCopyLink}>
            Share Game Link
          </button>
        </div>
        <div className="game-status">
          <span>Pot: ${gameState.pot}</span>
          <span>Current Bet: ${gameState.currentBet}</span>
          <span>Stage: {gameState.gameStage.toUpperCase()}</span>
        </div>
      </div>

      <div className="poker-table">
        <div className="community-cards">
          {gameState.communityCards.map((card, index) => (
            <div key={index} className="card">
              {card.value} of {card.suit}
            </div>
          ))}
        </div>

        <div className="players-container">
          {gameState.players.map((player) => (
            <div
              key={player.id}
              className={`player-seat position-${player.position} ${player.isTurn ? 'active' : ''} ${player.id === socket?.id ? 'current-player' : ''}`}
            >
              <div className="player-info">
                <div className="player-name">{player.name}</div>
                <div className="player-chips">${player.chips}</div>
              </div>
              {player.id === socket?.id && player.cards && (
                <div className="player-cards">
                  {player.cards.map((card, index) => (
                    <div key={index} className="card">
                      {card.value} of {card.suit}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {currentPlayer?.isTurn && (
          <div className="player-actions">
            <button onClick={() => handleAction('fold')} className="action-button fold">
              Fold
            </button>
            <button onClick={() => handleAction('check')} className="action-button check">
              Check
            </button>
            <button onClick={() => handleAction('call')} className="action-button call">
              Call
            </button>
            <div className="raise-controls">
              <input
                type="range"
                min={gameState.bigBlind}
                max={currentPlayer.chips}
                value={betAmount}
                onChange={(e) => setBetAmount(parseInt(e.target.value))}
                className="raise-slider"
              />
              <button onClick={() => handleAction('raise')} className="action-button raise">
                Raise to ${betAmount}
              </button>
            </div>
          </div>
        )}
      </div>

      {gameState.gameStage === 'waiting' && (
        <div className="waiting-message">
          Waiting for players... ({gameState.players.length}/{gameState.minPlayers} required)
          <div className="share-info">
            Share this link with your friends to join:
            <div className="share-link">
              {shareUrl}
              <button onClick={handleCopyLink}>Copy</button>
            </div>
          </div>
        </div>
      )}

      {error && <div className="error-message">{error}</div>}
    </div>
  );
};

export default PokerTable; 