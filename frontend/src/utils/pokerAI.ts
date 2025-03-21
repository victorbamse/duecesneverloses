// Types
export interface Card {
  suit: 'hearts' | 'diamonds' | 'clubs' | 'spades'
  value: string
}

export interface HandStrength {
  rank: string;
  value: string;
}

const valueOrder = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A']

// GTO-based pre-flop hand rankings (simplified)
const preFlopHandRankings: { [key: string]: number } = {
  'AA': 100, 'KK': 95, 'QQ': 90, 'AKs': 85, 'JJ': 80,
  'AQs': 75, 'KQs': 70, 'AJs': 68, 'KJs': 65, 'TT': 63,
  'ATs': 60, 'KTs': 58, 'QJs': 55, 'JTs': 53, '99': 50,
  'AK': 48, 'AQ': 45, 'KQ': 43, '88': 40, 'K9s': 38,
  'T9s': 35, '77': 33, '66': 30, '55': 28, '44': 25,
  '33': 23, '22': 20
}

// Get the hand ranking key (e.g. "AKs" for Ace-King suited)
const getHandKey = (hand: Card[]): string => {
  if (!hand || hand.length !== 2) return ''
  
  const [card1, card2] = hand.sort((a, b) => 
    valueOrder.indexOf(b.value) - valueOrder.indexOf(a.value)
  )
  
  // Pocket pair
  if (card1.value === card2.value) {
    return card1.value + card1.value
  }
  
  // Suited or offsuit
  const suited = card1.suit === card2.suit ? 's' : ''
  return card1.value + card2.value + suited
}

// Helper function to get numeric hand score
const getHandScore = (handRank: HandStrength): number => {
  const rankScores: { [key: string]: number } = {
    'Royal Flush': 10,
    'Straight Flush': 9,
    'Four of a Kind': 8,
    'Full House': 7,
    'Flush': 6,
    'Straight': 5,
    'Three of a Kind': 4,
    'Two Pairs': 3,
    'One Pair': 2,
    'High Card': 1
  }
  return rankScores[handRank.rank] || 0
}

// Main betting decision function
export const calculateBettingDecision = (
  aiHand: Card[],
  _communityCards: Card[],
  handStrength: HandStrength | null,
  pot: number,
  aiChips: number,
  gameStage: 'pre-flop' | 'flop' | 'turn' | 'river' | 'complete',
  position: {
    isButton: boolean,
    isSB: boolean,
    isBB: boolean
  },
  currentBet: number,
  aiCurrentBet: number,
  bigBlind: number
): { 
  action: 'fold' | 'check' | 'call' | 'raise',
  amount: number 
} => {
  const handKey = getHandKey(aiHand)
  const handValue = preFlopHandRankings[handKey] || 15 // Default to low value for unmapped hands
  const callAmount = currentBet - aiCurrentBet
  
  // Pre-flop strategy
  if (gameStage === 'pre-flop') {
    // Small Blind decision
    if (position.isSB) {
      // Must at least call to see flop
      const minCall = bigBlind - (bigBlind / 2) // Need to add the other half of BB
      
      if (handValue >= 60) {
        // Strong hand - raise
        return {
          action: 'raise',
          amount: Math.min(bigBlind * 3, aiChips)
        }
      } else if (handValue >= 30) {
        // Playable hand - call
        return {
          action: 'call',
          amount: minCall
        }
      } else {
        // Weak hand - fold
        return {
          action: 'fold',
          amount: 0
        }
      }
    }
    
    // Big Blind decision
    if (position.isBB) {
      if (currentBet > bigBlind) {
        // Someone raised
        if (handValue >= 50) {
          // Strong enough to re-raise
          return {
            action: 'raise',
            amount: Math.min(currentBet * 2.5, aiChips)
          }
        } else if (handValue >= 25) {
          // Call the raise
          return {
            action: 'call',
            amount: callAmount
          }
        } else {
          return {
            action: 'fold',
            amount: 0
          }
        }
      } else {
        // No raise, can check
        if (handValue >= 40) {
          // Raise with strong hands
          return {
            action: 'raise',
            amount: Math.min(bigBlind * 2, aiChips)
          }
        } else {
          return {
            action: 'check',
            amount: 0
          }
        }
      }
    }
  }

  // Post-flop strategy (simplified GTO approach)
  const handScore = handStrength ? getHandScore(handStrength) : 0
  
  if (handScore >= 7) { // Very strong hand (Full house or better)
    return {
      action: 'raise',
      amount: Math.min(pot * 0.75, aiChips)
    }
  } else if (handScore >= 5) { // Strong hand (Straight or better)
    if (currentBet > aiCurrentBet) {
      return {
        action: 'call',
        amount: callAmount
      }
    } else {
      return {
        action: 'raise',
        amount: Math.min(pot * 0.5, aiChips)
      }
    }
  } else if (handScore >= 3) { // Medium hand (Two pair or better)
    if (currentBet > pot * 0.5) {
      return {
        action: 'fold',
        amount: 0
      }
    } else {
      return {
        action: 'call',
        amount: callAmount
      }
    }
  } else { // Weak hand
    if (currentBet === aiCurrentBet) {
      return {
        action: 'check',
        amount: 0
      }
    } else {
      return {
        action: 'fold',
        amount: 0
      }
    }
  }

  // Default action if no other conditions are met
  return {
    action: 'fold',
    amount: 0
  }
} 