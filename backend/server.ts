import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

interface GameState {
  id: string;
  players: {
    id: string;
    name: string;
    chips: number;
    cards?: {
      suit: 'hearts' | 'diamonds' | 'clubs' | 'spades';
      value: string;
    }[];
    isActive: boolean;
    position: 'dealer' | 'small_blind' | 'big_blind' | 'other';
  }[];
  communityCards: {
    suit: 'hearts' | 'diamonds' | 'clubs' | 'spades';
    value: string;
  }[];
  pot: number;
  currentBet: number;
  gameStage: 'pre-flop' | 'flop' | 'turn' | 'river';
  activePlayer?: string;
}

const games = new Map<string, GameState>();

const app = express();
app.use(cors());
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // Handle creating a new game
  socket.on('createGame', (playerName: string) => {
    const gameId = Math.random().toString(36).substring(2, 8).toUpperCase();
    const gameState: GameState = {
      id: gameId,
      players: [{
        id: socket.id,
        name: playerName,
        chips: 1000,
        isActive: true,
        position: 'dealer'
      }],
      communityCards: [],
      pot: 0,
      currentBet: 0,
      gameStage: 'pre-flop'
    };

    games.set(gameId, gameState);
    socket.join(gameId);
    socket.emit('gameCreated', { gameId, gameState });
  });

  // Handle joining an existing game
  socket.on('joinGame', ({ gameId, playerName }: { gameId: string, playerName: string }) => {
    const game = games.get(gameId);
    if (!game) {
      socket.emit('error', 'Game not found');
      return;
    }

    if (game.players.length >= 6) {
      socket.emit('error', 'Game is full');
      return;
    }

    game.players.push({
      id: socket.id,
      name: playerName,
      chips: 1000,
      isActive: true,
      position: 'other'
    });

    socket.join(gameId);
    io.to(gameId).emit('gameStateUpdated', game);
    socket.emit('gameJoined', game);
  });

  // Handle player actions
  socket.on('playerAction', ({ gameId, action, amount }: { gameId: string, action: 'fold' | 'check' | 'call' | 'raise', amount?: number }) => {
    const game = games.get(gameId);
    if (!game) return;

    const player = game.players.find(p => p.id === socket.id);
    if (!player) return;

    switch (action) {
      case 'fold':
        player.isActive = false;
        break;
      case 'check':
        // Implement check logic
        break;
      case 'call':
        // Implement call logic
        break;
      case 'raise':
        if (amount) {
          game.currentBet = amount;
          game.pot += amount;
          player.chips -= amount;
        }
        break;
    }

    io.to(gameId).emit('gameStateUpdated', game);
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    games.forEach((game, gameId) => {
      const playerIndex = game.players.findIndex(p => p.id === socket.id);
      if (playerIndex !== -1) {
        game.players.splice(playerIndex, 1);
        if (game.players.length === 0) {
          games.delete(gameId);
        } else {
          io.to(gameId).emit('gameStateUpdated', game);
        }
      }
    });
  });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 