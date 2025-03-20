interface Card {
  suit: 'hearts' | 'diamonds' | 'clubs' | 'spades'
  value: string
}

interface HandStrength {
  rank: string;
  value: string;
}

const valueOrder = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A']

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

const getValueStrength = (value: string): number => {
  return valueOrder.indexOf(value)
}

const calculateBettingOdds = (
  aiHand: Card[],
  communityCards: Card[],
  handStrength: HandStrength,
  pot: number,
  aiChips: number,
  gameStage: 'pre-flop' | 'flop' | 'turn' | 'river' | 'complete',
  position: 'early' | 'middle' | 'late' = 'late',
  currentBet: number = 0
): { shouldBet: boolean; betAmount: number; shouldCall: boolean } => {
  const handScore = getHandScore(handStrength)
  const callAmount = currentBet
  
  // Pre-flop strategy
  if (gameStage === 'pre-flop') {
    const highCard = Math.max(...aiHand.map(card => getValueStrength(card.value)))
    const isPair = aiHand[0].value === aiHand[1].value
    const isHighCards = aiHand.every(card => getValueStrength(card.value) >= valueOrder.indexOf('J'))
    const isSuited = aiHand[0].suit === aiHand[1].suit
    
    // Premium hands
    if (isPair && getValueStrength(aiHand[0].value) >= valueOrder.indexOf('J')) {
      return {
        shouldBet: true,
        betAmount: Math.min(pot * 0.75, aiChips * 0.3),
        shouldCall: true
      }
    }
    
    // Strong hands
    if (isPair || (isHighCards && isSuited)) {
      return {
        shouldBet: true,
        betAmount: Math.min(pot * 0.5, aiChips * 0.2),
        shouldCall: true
      }
    }
    
    // Playable hands
    if (highCard >= valueOrder.indexOf('Q') || (isSuited && position === 'late')) {
      return {
        shouldBet: position === 'late',
        betAmount: Math.min(pot * 0.25, aiChips * 0.1),
        shouldCall: callAmount <= aiChips * 0.1
      }
    }
    
    // Weak hands
    return {
      shouldBet: false,
      betAmount: 0,
      shouldCall: callAmount <= aiChips * 0.05
    }
  }

  // Post-flop strategy based on hand strength
  const betSizing: { [key: number]: number } = {
    10: 1, // Royal Flush
    9: 0.8, // Straight Flush
    8: 0.7, // Four of a Kind
    7: 0.6, // Full House
    6: 0.5, // Flush
    5: 0.4, // Straight
    4: 0.3, // Three of a Kind
    3: 0.2, // Two Pairs
    2: 0.1, // One Pair
    1: 0 // High Card
  }

  const sizingMultiplier = betSizing[handScore] || 0
  const randomFactor = 0.8 + Math.random() * 0.4 // Add some randomness
  const potOdds = callAmount / (pot + callAmount)

  // Calculate implied odds based on hand strength and stage
  const impliedOdds = handScore / 10 * (1 + (gameStage === 'river' ? 0 : 0.2))

  if (impliedOdds > potOdds && sizingMultiplier > 0) {
    const baseBet = pot * sizingMultiplier * randomFactor
    const maxBet = aiChips * 0.5 // Never bet more than 50% of chips at once
    return {
      shouldBet: true,
      betAmount: Math.min(baseBet, maxBet),
      shouldCall: true
    }
  }

  // Check/Call with medium strength hands if pot odds are good
  if (handScore >= 2 && potOdds < 0.3) {
    return {
      shouldBet: false,
      betAmount: 0,
      shouldCall: true
    }
  }

  // Fold with weak hands
  return {
    shouldBet: false,
    betAmount: 0,
    shouldCall: false
  }
}

export { calculateBettingOdds, type HandStrength } 