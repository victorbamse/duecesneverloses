import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import '../styles/MultiplayerTable.css';
import { Card } from '../utils/pokerAI';

interface Player {
  id: string;
  name: string;
  chips: number;
  cards?: Card[];
  isActive: boolean;
  position: 'dealer' | 'small_blind' | 'big_blind' | 'other';
}

interface GameState {
  id: string;
  players: Player[];
  communityCards: Card[];
  pot: number;
  currentBet: number;
  gameStage: 'pre-flop' | 'flop' | 'turn' | 'river';
  activePlayer?: string;
}

const SOCKET_URL = process.env.NODE_ENV === 'production' 
  ? 'https://duecesneverloses.se' 
  : 'http://localhost:3001';

const MultiplayerTable: React.FC = () => {
  const { gameId } = useParams<{ gameId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const playerName = searchParams.get('name');
  const isHost = searchParams.get('host') === 'true';

  const [socket, setSocket] = useState<ReturnType<typeof io> | null>(null);
  const [gameState, setGameState] = useState<GameState>({
    id: gameId || '',
    players: [],
    communityCards: [],
    pot: 0,
    currentBet: 0,
    gameStage: 'pre-flop'
  });
  const [betAmount, setBetAmount] = useState(20);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!gameId || !playerName) {
      navigate('/');
      return;
    }

    const newSocket = io(SOCKET_URL);
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Connected to server');
      newSocket.emit('joinGame', { 
        gameId, 
        playerName,
        isHost 
      });
    });

    newSocket.on('error', (message: string) => {
      setError(message);
      if (message === 'Game not found') {
        setTimeout(() => navigate('/'), 3000);
      }
    });

    newSocket.on('gameJoined', (state: GameState) => {
      setGameState(state);
      setError(null);
    });

    newSocket.on('gameStateUpdated', (state: GameState) => {
      setGameState(state);
    });

    return () => {
      newSocket.disconnect();
    };
  }, [gameId, playerName, isHost, navigate]);

  const handleFold = () => {
    if (socket) {
      socket.emit('playerAction', { gameId, action: 'fold' });
    }
  };

  const handleCheck = () => {
    if (socket) {
      socket.emit('playerAction', { gameId, action: 'check' });
    }
  };

  const handleCall = () => {
    if (socket) {
      socket.emit('playerAction', { gameId, action: 'call' });
    }
  };

  const handleRaise = () => {
    if (socket) {
      socket.emit('playerAction', { gameId, action: 'raise', amount: betAmount });
    }
  };

  if (error) {
    return (
      <div className="error-message">
        Error: {error}
      </div>
    );
  }

  const currentPlayer = gameState.players.find(p => socket?.id === p.id);
  const isPlayerTurn = gameState.activePlayer === socket?.id;

  return (
    <div className="multiplayer-table">
      <div className="game-info">
        <div className="game-code">Game Code: {gameId}</div>
        <div className="table-info">
          <div className="pot">Pot: ${gameState.pot}</div>
          <div className="current-bet">Current Bet: ${gameState.currentBet}</div>
          <div className="game-stage">{gameState.gameStage.toUpperCase()}</div>
        </div>
      </div>
      
      <div className="community-cards">
        {gameState.communityCards.map((card, index) => (
          <div key={index} className="card">
            {card.value} of {card.suit}
          </div>
        ))}
      </div>
      
      <div className="players">
        {gameState.players.map((player) => (
          <div 
            key={player.id} 
            className={`player ${player.isActive ? 'active' : ''} ${player.id === socket?.id ? 'current-player' : ''}`}
          >
            <div className="player-info">
              <div className="player-name">{player.name}</div>
              <div className="player-chips">${player.chips}</div>
              <div className="player-position">{player.position}</div>
            </div>
            {(player.cards && player.id === socket?.id) && (
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
      
      {currentPlayer && (
        <div className="game-controls">
          <button 
            className="action-button fold" 
            onClick={handleFold}
            disabled={!isPlayerTurn}
          >
            Fold
          </button>
          <button 
            className="action-button check" 
            onClick={handleCheck}
            disabled={!isPlayerTurn}
          >
            Check
          </button>
          <button 
            className="action-button call" 
            onClick={handleCall}
            disabled={!isPlayerTurn}
          >
            Call
          </button>
          <div className="raise-controls">
            <input 
              type="range" 
              min="20" 
              max={currentPlayer.chips} 
              value={betAmount}
              onChange={(e) => setBetAmount(parseInt(e.target.value))}
              className="raise-slider"
              disabled={!isPlayerTurn}
            />
            <button 
              className="action-button raise" 
              onClick={handleRaise}
              disabled={!isPlayerTurn}
            >
              Raise to ${betAmount}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MultiplayerTable; 