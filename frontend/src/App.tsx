import { useState } from "react";
import "./App.css";
import Menu from "./components/Menu";
import Game from "./components/Game";
import MultiplayerTable from "./components/MultiplayerTable";

function App() {
  const [gameMode, setGameMode] = useState<'menu' | 'ai' | 'multiplayer'>('menu');
  const [gameId, setGameId] = useState<string | null>(null);

  const handleGameModeSelect = (mode: 'ai' | 'multiplayer', newGameId?: string) => {
    setGameMode(mode);
    if (mode === 'multiplayer' && newGameId) {
      setGameId(newGameId);
    }
  };

  return (
    <div className="app">
      {gameMode === 'menu' && <Menu onGameModeSelect={handleGameModeSelect} />}
      {gameMode === 'ai' && <Game />}
      {gameMode === 'multiplayer' && gameId && (
        <div className="multiplayer-container">
          <div className="game-id-display">
            Game Code: <span>{gameId}</span>
          </div>
          <MultiplayerTable gameId={gameId} />
        </div>
      )}
    </div>
  );
}

export default App; 