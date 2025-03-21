import { useState } from "react";
import "./App.css";
import Menu from "./components/Menu";
import Game from "./components/Game";
import MultiplayerTable from "./components/MultiplayerTable";

function App() {
  const [gameMode, setGameMode] = useState<'menu' | 'ai' | 'multiplayer'>('menu');

  const handleGameModeSelect = (mode: 'ai' | 'multiplayer') => {
    setGameMode(mode);
  };

  return (
    <div className="app">
      {gameMode === 'menu' && <Menu onGameModeSelect={handleGameModeSelect} />}
      {gameMode === 'ai' && <Game />}
      {gameMode === 'multiplayer' && <MultiplayerTable />}
    </div>
  );
}

export default App; 