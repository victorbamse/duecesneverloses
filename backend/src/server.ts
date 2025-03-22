import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';

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
  socketId: string;
}

interface Game {
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
  deck: Card[];
  currentPlayerIndex: number;
  hostId: string;
}

const app = express();
app.use(cors());
app.use(express.json());

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.NODE_ENV === 'production' 
      ? 'https://duecesneverloses.se'
      : 'http://localhost:5173',
    methods: ['GET', 'POST']
  }
});

const games = new Map<string, Game>();

const createDeck = (): Card[] => {
  const suits: ('hearts' | 'diamonds' | 'clubs' | 'spades')[] = ['hearts', 'diamonds', 'clubs', 'spades'];
  const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
  const deck: Card[] = [];

  for (const suit of suits) {
    for (const value of values) {
      deck.push({ suit, value });
    }
  }

  return shuffleDeck(deck);
};

const shuffleDeck = (deck: Card[]): Card[] => {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

const dealCards = (game: Game) => {
  // Deal 2 cards to each player
  for (const player of game.players) {
    if (player.isActive) {
      player.cards = [game.deck.pop()!, game.deck.pop()!];
    }
  }
};

const dealCommunityCards = (game: Game, count: number) => {
  for (let i = 0; i < count; i++) {
    game.communityCards.push(game.deck.pop()!);
  }
};

const startNewRound = (game: Game) => {
  game.deck = createDeck();
  game.communityCards = [];
  game.pot = 0;
  game.currentBet = 0;
  game.gameStage = 'pre-flop';
  game.currentPlayerIndex = 0;

  // Reset player states
  game.players.forEach((player, index) => {
    player.cards = undefined;
    player.isActive = true;
    player.isTurn = index === 0;
  });

  dealCards(game);

  // Emit the updated game state to all players
  emitGameState(game);
};

const emitGameState = (game: Game) => {
  // Create a sanitized game state for each player
  game.players.forEach(player => {
    const playerGameState = {
      ...game,
      players: game.players.map(p => ({
        ...p,
        // Only include cards for the current player
        cards: p.id === player.id ? p.cards : undefined
      }))
    };
    io.to(player.socketId).emit('gameStateUpdated', playerGameState);
  });
};

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('createGame', ({ gameId, playerName, settings }) => {
    if (games.has(gameId)) {
      socket.emit('gameError', 'Game ID already exists');
      return;
    }

    const player: Player = {
      id: uuidv4(),
      name: playerName,
      chips: settings.startingChips,
      isActive: true,
      position: 0,
      isTurn: false,
      socketId: socket.id
    };

    const game: Game = {
      id: gameId,
      players: [player],
      communityCards: [],
      pot: 0,
      currentBet: 0,
      gameStage: 'waiting',
      minPlayers: settings.minPlayers,
      maxPlayers: settings.maxPlayers,
      startingChips: settings.startingChips,
      smallBlind: settings.smallBlind,
      bigBlind: settings.bigBlind,
      deck: [],
      currentPlayerIndex: 0,
      hostId: socket.id
    };

    games.set(gameId, game);
    socket.join(gameId);
    socket.emit('gameCreated', game);
  });

  socket.on('joinGame', ({ gameId, playerName }) => {
    const game = games.get(gameId);
    
    if (!game) {
      socket.emit('gameError', 'Game not found');
      return;
    }

    if (game.players.length >= game.maxPlayers) {
      socket.emit('gameError', 'Game is full');
      return;
    }

    const player: Player = {
      id: uuidv4(),
      name: playerName,
      chips: game.startingChips,
      isActive: true,
      position: game.players.length,
      isTurn: false,
      socketId: socket.id
    };

    game.players.push(player);
    socket.join(gameId);
    
    // If we have enough players, start the game
    if (game.players.length >= game.minPlayers && game.gameStage === 'waiting') {
      startNewRound(game);
    } else {
      emitGameState(game);
    }
  });

  socket.on('playerAction', ({ gameId, action, amount }) => {
    const game = games.get(gameId);
    if (!game) return;

    const playerIndex = game.players.findIndex(p => p.socketId === socket.id);
    if (playerIndex === -1 || playerIndex !== game.currentPlayerIndex) return;

    const player = game.players[playerIndex];
    
    switch (action) {
      case 'fold':
        player.isActive = false;
        break;
      case 'check':
        // Only allowed if no current bet
        if (game.currentBet > 0) return;
        break;
      case 'call':
        if (game.currentBet > player.chips) {
          // All-in
          game.pot += player.chips;
          player.chips = 0;
        } else {
          game.pot += game.currentBet;
          player.chips -= game.currentBet;
        }
        break;
      case 'raise':
        if (!amount || amount > player.chips || amount <= game.currentBet) return;
        game.pot += amount;
        player.chips -= amount;
        game.currentBet = amount;
        break;
    }

    // Find next active player
    let nextPlayerIndex = (playerIndex + 1) % game.players.length;
    while (!game.players[nextPlayerIndex].isActive && nextPlayerIndex !== playerIndex) {
      nextPlayerIndex = (nextPlayerIndex + 1) % game.players.length;
    }

    // If we're back to the first player or everyone folded
    const activePlayers = game.players.filter(p => p.isActive);
    if (nextPlayerIndex === 0 || activePlayers.length === 1) {
      // Move to next stage or end round
      switch (game.gameStage) {
        case 'pre-flop':
          game.gameStage = 'flop';
          dealCommunityCards(game, 3);
          break;
        case 'flop':
          game.gameStage = 'turn';
          dealCommunityCards(game, 1);
          break;
        case 'turn':
          game.gameStage = 'river';
          dealCommunityCards(game, 1);
          break;
        case 'river':
          // End round and determine winner
          if (activePlayers.length === 1) {
            // Last player standing wins
            activePlayers[0].chips += game.pot;
          } else {
            // TODO: Implement hand comparison logic
            // For now, first active player wins
            activePlayers[0].chips += game.pot;
          }
          startNewRound(game);
          return;
      }
      game.currentBet = 0;
    }

    game.currentPlayerIndex = nextPlayerIndex;
    game.players.forEach(p => p.isTurn = p.id === game.players[nextPlayerIndex].id);
    
    emitGameState(game);
  });

  socket.on('disconnect', () => {
    // Find and remove player from their game
    for (const [gameId, game] of games.entries()) {
      const playerIndex = game.players.findIndex(p => p.socketId === socket.id);
      if (playerIndex !== -1) {
        if (socket.id === game.hostId) {
          // If host disconnects, end the game
          io.to(gameId).emit('gameError', 'Host disconnected, game ended');
          games.delete(gameId);
        } else {
          // Remove player and update game state
          game.players.splice(playerIndex, 1);
          // Update positions for remaining players
          game.players.forEach((p, i) => p.position = i);
          if (game.players.length < game.minPlayers) {
            game.gameStage = 'waiting';
          }
          emitGameState(game);
        }
        break;
      }
    }
  });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 