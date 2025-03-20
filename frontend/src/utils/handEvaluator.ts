interface Card {
  suit: 'hearts' | 'diamonds' | 'clubs' | 'spades'
  value: string
}

const valueOrder = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A']

const getValueIndex = (value: string): number => {
  return valueOrder.indexOf(value)
}

const isStraight = (cards: Card[]): boolean => {
  const values = cards.map(card => getValueIndex(card.value))
  const uniqueValues = Array.from(new Set(values)).sort((a, b) => a - b)
  
  // Check for Ace-low straight (A-2-3-4-5)
  if (uniqueValues.includes(12)) { // Ace
    const aceLowValues = [...uniqueValues.filter(v => v <= 3), -1].sort((a, b) => a - b)
    let consecutive = 1
    for (let i = 1; i < aceLowValues.length; i++) {
      if (aceLowValues[i] - aceLowValues[i - 1] === 1) {
        consecutive++
      } else {
        consecutive = 1
      }
      if (consecutive >= 5) return true
    }
  }
  
  // Check regular straights
  let consecutive = 1
  for (let i = 1; i < uniqueValues.length; i++) {
    if (uniqueValues[i] - uniqueValues[i - 1] === 1) {
      consecutive++
    } else {
      consecutive = 1
    }
    if (consecutive >= 5) return true
  }
  
  return false
}

const isFlush = (cards: Card[]): boolean => {
  const suits = cards.map(card => card.suit)
  return suits.some(suit => suits.filter(s => s === suit).length >= 5)
}

const getHandRank = (playerHand: Card[], communityCards: Card[]): { rank: string; value: string } => {
  const allCards = [...playerHand, ...communityCards]
  
  // Count occurrences of each value
  const valueCounts = new Map<string, number>()
  allCards.forEach(card => {
    valueCounts.set(card.value, (valueCounts.get(card.value) || 0) + 1)
  })
  
  // Check for Royal Flush
  if (isFlush(allCards) && isStraight(allCards)) {
    const flushCards = allCards.filter(card => 
      allCards.filter(c => c.suit === card.suit).length >= 5
    )
    if (flushCards.some(card => card.value === 'A')) {
      return { rank: 'Royal Flush', value: 'A' }
    }
  }
  
  // Check for Straight Flush
  if (isFlush(allCards) && isStraight(allCards)) {
    const flushCards = allCards.filter(card => 
      allCards.filter(c => c.suit === card.suit).length >= 5
    )
    return { rank: 'Straight Flush', value: flushCards[0].value }
  }
  
  // Check for Four of a Kind
  for (const [value, count] of valueCounts) {
    if (count === 4) {
      return { rank: 'Four of a Kind', value }
    }
  }
  
  // Check for Full House
  let hasThree = false
  let hasPair = false
  let threeValue = ''
  for (const [value, count] of valueCounts) {
    if (count === 3) {
      hasThree = true
      threeValue = value
    } else if (count >= 2) {
      hasPair = true
    }
  }
  if (hasThree && hasPair) {
    return { rank: 'Full House', value: threeValue }
  }
  
  // Check for Flush
  if (isFlush(allCards)) {
    const flushCards = allCards.filter(card => 
      allCards.filter(c => c.suit === card.suit).length >= 5
    )
    return { rank: 'Flush', value: flushCards[0].value }
  }
  
  // Check for Straight
  if (isStraight(allCards)) {
    return { rank: 'Straight', value: allCards[0].value }
  }
  
  // Check for Three of a Kind
  for (const [value, count] of valueCounts) {
    if (count === 3) {
      return { rank: 'Three of a Kind', value }
    }
  }
  
  // Check for Two Pairs
  const pairs = Array.from(valueCounts.entries())
    .filter(([_, count]) => count >= 2)
    .map(([value]) => value)
    .sort((a, b) => getValueIndex(b) - getValueIndex(a))
  
  if (pairs.length >= 2) {
    return { rank: 'Two Pairs', value: `${pairs[0]} and ${pairs[1]}` }
  }
  
  // Check for One Pair
  if (pairs.length === 1) {
    return { rank: 'One Pair', value: pairs[0] }
  }
  
  // High Card
  const highCard = allCards.reduce((highest, card) => 
    getValueIndex(card.value) > getValueIndex(highest.value) ? card : highest
  )
  return { rank: 'High Card', value: highCard.value }
}

export default getHandRank 