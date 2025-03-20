import React from 'react';
import '../styles/MultiplayerTable.css';

const MultiplayerTable: React.FC = () => {
  const seats = Array(8).fill(null);
  
  return (
    <div className="multiplayer-container">
      <div className="poker-table-wrapper">
        <div className="poker-felt">
          <div className="table-center">
            <div className="community-cards-area">
              {Array(5).fill(null).map((_, i) => (
                <div key={i} className="card-placeholder" />
              ))}
            </div>
            <div className="pot-area">Pot: $0</div>
          </div>
          {seats.map((_, index) => (
            <div key={index} className={`seat seat-${index}`}>
              <div className="chair">
                <div className="chair-back" />
                <div className="chair-seat" />
              </div>
              <div className="player-area">
                <div className="player-cards">
                  <div className="card-placeholder" />
                  <div className="card-placeholder" />
                </div>
                <div className="player-info">
                  <div className="player-name">Empty Seat</div>
                  <div className="player-chips">$1000</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <button className="return-button" onClick={() => window.location.reload()}>
        Return to Menu
      </button>
    </div>
  );
};

export default MultiplayerTable; 