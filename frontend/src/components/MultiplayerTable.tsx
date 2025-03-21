import React, { useEffect, useState } from 'react';
import '../styles/MultiplayerTable.css';
import { Card } from './Game';

interface Player {
  id: string;
  name: string;
  chips: number;
  cards?: Card[];
  isActive: boolean;
  position: 'dealer' | 'small_blind' | 'big_blind' | 'other';
}

interface MultiplayerTableProps {
  gameId: string;
}

const MultiplayerTable: React.FC<MultiplayerTableProps> = ({ gameId }) => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [communityCards, setCommunityCards] = useState<Card[]>([]);
  const [pot, setPot] = useState(0);
  const [currentBet, setCurrentBet] = useState(0);
  const [gameStage, setGameStage] = useState<'pre-flop' | 'flop' | 'turn' | 'river'>('pre-flop');

  useEffect(() => {
    // TODO: Set up WebSocket connection here
    console.log(`Connecting to game: ${gameId}`);
    
    // Cleanup function
    return () => {
      // TODO: Clean up WebSocket connection
      console.log('Disconnecting from game');
    };
  }, [gameId]);

  return (
    <div className="multiplayer-table">
      <div className="table-info">
        <div className="pot">Pot: ${pot}</div>
        <div className="current-bet">Current Bet: ${currentBet}</div>
        <div className="game-stage">{gameStage.toUpperCase()}</div>
      </div>
      
      <div className="community-cards">
        {communityCards.map((card, index) => (
          <div key={index} className="card">
            {card.value} of {card.suit}
          </div>
        ))}
      </div>
      
      <div className="players">
        {players.map((player) => (
          <div 
            key={player.id} 
            className={`player ${player.isActive ? 'active' : ''}`}
          >
            <div className="player-info">
              <div className="player-name">{player.name}</div>
              <div className="player-chips">${player.chips}</div>
              <div className="player-position">{player.position}</div>
            </div>
            {player.cards && (
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
      
      <div className="game-controls">
        <button className="action-button fold">Fold</button>
        <button className="action-button check">Check</button>
        <button className="action-button call">Call</button>
        <div className="raise-controls">
          <input type="range" min="1" max="100" className="raise-slider" />
          <button className="action-button raise">Raise</button>
        </div>
      </div>
    </div>
  );
};

export default MultiplayerTable; 