import React from 'react';
import '../styles/Menu.css';

interface MenuProps {
  onGameModeSelect: (mode: 'ai' | 'multiplayer') => void;
}

const Menu: React.FC<MenuProps> = ({ onGameModeSelect }) => {
  return (
    <div className="menu-container">
      <h1>Texas Hold'em Poker</h1>
      <div className="menu-options">
        <div className="menu-card" onClick={() => onGameModeSelect('ai')}>
          <h2>Play vs AI</h2>
          <p>Challenge our advanced AI opponent in a heads-up match</p>
        </div>
        <div className="menu-card" onClick={() => onGameModeSelect('multiplayer')}>
          <h2>Multiplayer</h2>
          <p>Join a table with up to 6 players</p>
        </div>
      </div>
    </div>
  );
};

export default Menu; 