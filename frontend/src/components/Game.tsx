import React, { useState, useEffect } from 'react'
import Card from './Card'
import getHandRank from '../utils/handEvaluator'
import { calculateBettingOdds, HandStrength } from '../utils/pokerAI'

interface Card {
  suit: 'hearts' | 'diamonds' | 'clubs' | 'spades'
  value: string
}

const Game: React.FC = () => {
  const [deck, setDeck] = useState<Card[]>([])
  const [playerHand, setPlayerHand] = useState<Card[]>([])
  const [aiHand, setAiHand] = useState<Card[]>([])
  const [communityCards, setCommunityCards] = useState<Card[]>([])
  const [handRank, setHandRank] = useState<HandStrength | null>(null)
  const [aiHandRank, setAiHandRank] = useState<HandStrength | null>(null)
  const [chips, setChips] = useState(1000)
  const [aiChips, setAiChips] = useState(1000)
  const [currentBet, setCurrentBet] = useState(0)
  const [aiCurrentBet, setAiCurrentBet] = useState(0)
  const [pot, setPot] = useState(0)
  const [gameStage, setGameStage] = useState<'pre-flop' | 'flop' | 'turn' | 'river' | 'complete'>('pre-flop')
  const [betAmount, setBetAmount] = useState(10)
  const [isPlayerTurn, setIsPlayerTurn] = useState(true)
  const [gameResult, setGameResult] = useState<string>('')
  const [showAiCards, setShowAiCards] = useState(false)
  const [bigBlind, setBigBlind] = useState(20)
  const [isPlayerDealer, setIsPlayerDealer] = useState(true)
  const [aiAction, setAiAction] = useState<string>('')
  const [needsToCall, setNeedsToCall] = useState(false)
  const [canCheck, setCanCheck] = useState(false)
  const [lastAction, setLastAction] = useState<'none' | 'call' | 'raise' | 'check'>('none')
  const [actionHistory, setActionHistory] = useState<string[]>([])

  const suits = ['hearts', 'diamonds', 'clubs', 'spades']
  const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A']

  // Sound effects
  const playSound = (type: 'bet' | 'check' | 'fold' | 'deal' | 'win' | 'turn') => {
    const sounds = {
      bet: new Audio('/sounds/chip.mp3'),
      check: new Audio('/sounds/check.mp3'),
      fold: new Audio('/sounds/fold.mp3'),
      deal: new Audio('/sounds/deal.mp3'),
      win: new Audio('/sounds/win.mp3'),
      turn: new Audio('/sounds/turn.mp3')
    }
    sounds[type].play().catch(console.error)
  }

  useEffect(() => {
    if (!isPlayerTurn && gameStage !== 'complete') {
      playSound('turn')
      handleAITurn()
    }
  }, [isPlayerTurn, gameStage])

  const postBlinds = () => {
    const smallBlind = bigBlind / 2
    if (isPlayerDealer) {
      // AI posts small blind, player posts big blind
      setAiChips(prev => prev - smallBlind)
      setChips(prev => prev - bigBlind)
      setAiCurrentBet(smallBlind)
      setCurrentBet(bigBlind)
      setIsPlayerTurn(false) // AI acts first as SB
      setNeedsToCall(true) // AI needs to call or raise as SB
      setCanCheck(false)
      addToHistory(`AI posts small blind: $${smallBlind}`)
      addToHistory(`You post big blind: $${bigBlind}`)
    } else {
      // Player posts small blind, AI posts big blind
      setChips(prev => prev - smallBlind)
      setAiChips(prev => prev - bigBlind)
      setCurrentBet(smallBlind)
      setAiCurrentBet(bigBlind)
      setIsPlayerTurn(true) // Player acts first as SB
      setNeedsToCall(true) // Player needs to call or raise as SB
      setCanCheck(false)
      addToHistory(`You post small blind: $${smallBlind}`)
      addToHistory(`AI posts big blind: $${bigBlind}`)
    }
    setPot(bigBlind + smallBlind)
    setLastAction('none')
  }

  const addToHistory = (action: string) => {
    setActionHistory(prev => [...prev, action])
  }

  const dealCards = () => {
    playSound('deal')
    const newDeck = createDeck()
    setDeck(newDeck)
    setPlayerHand(newDeck.slice(0, 2))
    setAiHand(newDeck.slice(2, 4))
    setCommunityCards([])
    setHandRank(null)
    setAiHandRank(null)
    setGameStage('pre-flop')
    setPot(0)
    setCurrentBet(0)
    setAiCurrentBet(0)
    setGameResult('')
    setActionHistory([])
    setIsPlayerDealer(prev => !prev)
    postBlinds()
  }

  const quickBet = (multiplier: number) => {
    const amount = bigBlind * multiplier
    if (amount <= chips) {
      setBetAmount(amount)
      placeBet(amount)
    }
  }

  const placeBet = (amount = betAmount) => {
    if (amount <= chips && amount > 0) {
      playSound('bet')
      const totalBetAmount = currentBet + amount
      setChips(prev => prev - amount)
      setPot(prev => prev + amount)
      setCurrentBet(totalBetAmount)
      setLastAction('raise')
      setNeedsToCall(true)
      addToHistory(`You raise to $${totalBetAmount}`)
      setIsPlayerTurn(false)
    }
  }

  const check = () => {
    playSound('check')
    if (!canCheck && needsToCall) {
      // This is actually a call
      const callAmount = Math.max(0, aiCurrentBet - currentBet)
      if (callAmount > 0) {
        setChips(prev => prev - callAmount)
        setPot(prev => prev + callAmount)
        setCurrentBet(aiCurrentBet)
        setLastAction('call')
        addToHistory(`You call $${callAmount}`)

        if (gameStage === 'pre-flop') {
          if (!isPlayerDealer) {
            // Player is BB, give option to raise after SB calls
            setCanCheck(true)
            setNeedsToCall(false)
            return // Don't proceed to next stage yet
          } else {
            // Player is SB calling BB, give BB option to act
            setIsPlayerTurn(false)
            return // Let BB act
          }
        }
      }
    } else {
      // This is a check
      setLastAction('check')
      addToHistory('You check')

      if (gameStage === 'pre-flop') {
        if (!isPlayerDealer && lastAction === 'call') {
          // Player is BB and has checked after SB called
          dealFlop()
        }
      } else if (gameStage === 'flop') {
        dealTurn()
      } else if (gameStage === 'turn') {
        dealRiver()
      } else if (gameStage === 'river') {
        completeHand()
      }
    }
    setIsPlayerTurn(false)
  }

  const fold = () => {
    playSound('fold')
    setGameStage('complete')
    setAiChips(prev => prev + pot)
    setGameResult('You folded - AI wins!')
    addToHistory('You fold')
  }

  const completeHand = () => {
    setGameStage('complete')
    const playerScore = getHandScore(handRank!)
    const aiScore = getHandScore(aiHandRank!)

    if (playerScore > aiScore) {
      playSound('win')
      setChips(prev => prev + pot)
      setGameResult('You win with ' + handRank?.rank + '!')
    } else if (aiScore > playerScore) {
      setAiChips(prev => prev + pot)
      setGameResult('AI wins with ' + aiHandRank?.rank + '!')
    } else {
      // Split pot on tie
      const splitAmount = Math.floor(pot / 2)
      setChips(prev => prev + splitAmount)
      setAiChips(prev => prev + splitAmount)
      setGameResult('Split pot!')
    }
  }

  const createDeck = () => {
    const newDeck: Card[] = []
    for (const suit of suits) {
      for (const value of values) {
        newDeck.push({ suit: suit as Card['suit'], value })
      }
    }
    return shuffleDeck(newDeck)
  }

  const shuffleDeck = (deck: Card[]): Card[] => {
    const shuffled = [...deck]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
  }

  const handleAITurn = () => {
    if (!aiHand.length || gameStage === 'complete') return

    setAiAction('Thinking...')
    
    setTimeout(() => {
      const aiHandStrength = getHandRank(aiHand, communityCards)
      setAiHandRank(aiHandStrength)

      const { shouldBet, betAmount: aiBetAmount, shouldCall } = calculateBettingOdds(
        aiHand,
        communityCards,
        aiHandStrength,
        pot,
        aiChips,
        gameStage,
        isPlayerDealer ? 'early' : 'late',
        currentBet
      )

      if (gameStage === 'pre-flop') {
        if (isPlayerDealer) {
          // AI is SB
          if (lastAction === 'none') {
            // First action as SB
            if (shouldBet) {
              const actualBet = Math.min(aiBetAmount, aiChips)
              const raiseAmount = actualBet - aiCurrentBet
              setAiChips(prev => prev - raiseAmount)
              setPot(prev => prev + raiseAmount)
              setAiCurrentBet(actualBet)
              playSound('bet')
              const message = `AI (Small Blind) raises to $${actualBet}`
              addToHistory(message)
              showActionMessage(message)
              setLastAction('raise')
              setNeedsToCall(true)
            } else if (shouldCall) {
              const callAmount = currentBet - aiCurrentBet
              setAiChips(prev => prev - callAmount)
              setPot(prev => prev + callAmount)
              setAiCurrentBet(currentBet)
              playSound('check')
              const message = `AI (Small Blind) calls $${callAmount}`
              addToHistory(message)
              showActionMessage(message)
              setLastAction('call')
              setCanCheck(true)
              setNeedsToCall(false)
            } else {
              // AI folds as SB
              setGameStage('complete')
              setChips(prev => prev + pot)
              setGameResult('AI folded - You win!')
              playSound('fold')
              const message = 'AI (Small Blind) folds'
              addToHistory(message)
              showActionMessage(message)
              return
            }
          }
        } else {
          // AI is BB
          if (lastAction === 'call') {
            // Player (SB) has called, AI gets option as BB
            if (shouldBet) {
              // AI decides to raise as BB
              const actualBet = Math.min(aiBetAmount, aiChips)
              const raiseAmount = actualBet - aiCurrentBet
              setAiChips(prev => prev - raiseAmount)
              setPot(prev => prev + raiseAmount)
              setAiCurrentBet(actualBet)
              playSound('bet')
              const message = `AI (Big Blind) raises to $${actualBet}`
              addToHistory(message)
              showActionMessage(message)
              setLastAction('raise')
              setNeedsToCall(true)
              setCanCheck(false)
            } else {
              // AI checks as BB
              playSound('check')
              const message = 'AI (Big Blind) checks'
              addToHistory(message)
              showActionMessage(message)
              setLastAction('check')
              dealFlop() // Only deal flop if BB checks
            }
          } else if (lastAction === 'raise') {
            // Player has raised, AI needs to decide to call/re-raise/fold
            if (shouldBet && aiBetAmount > currentBet) {
              // AI re-raises
              const actualBet = Math.min(aiBetAmount, aiChips)
              const raiseAmount = actualBet - aiCurrentBet
              setAiChips(prev => prev - raiseAmount)
              setPot(prev => prev + raiseAmount)
              setAiCurrentBet(actualBet)
              playSound('bet')
              const message = `AI (Big Blind) re-raises to $${actualBet}`
              addToHistory(message)
              showActionMessage(message)
              setLastAction('raise')
              setNeedsToCall(true)
            } else if (shouldCall) {
              // AI calls the raise
              const callAmount = currentBet - aiCurrentBet
              setAiChips(prev => prev - callAmount)
              setPot(prev => prev + callAmount)
              setAiCurrentBet(currentBet)
              playSound('check')
              const message = `AI (Big Blind) calls $${callAmount}`
              addToHistory(message)
              showActionMessage(message)
              setLastAction('call')
              dealFlop() // Deal flop after BB calls SB's raise
            } else {
              // AI folds to raise
              setGameStage('complete')
              setChips(prev => prev + pot)
              setGameResult('AI folded - You win!')
              playSound('fold')
              const message = 'AI (Big Blind) folds'
              addToHistory(message)
              showActionMessage(message)
              return
            }
          }
        }
      } else {
        // Post-flop logic
        if (needsToCall) {
          if (shouldCall) {
            const callAmount = currentBet - aiCurrentBet
            setAiChips(prev => prev - callAmount)
            setPot(prev => prev + callAmount)
            setAiCurrentBet(currentBet)
            playSound('check')
            const message = `AI calls $${callAmount}`
            addToHistory(message)
            showActionMessage(message)
            setLastAction('call')
          } else {
            // AI folds
            setGameStage('complete')
            setChips(prev => prev + pot)
            setGameResult('AI folded - You win!')
            playSound('fold')
            const message = 'AI folds'
            addToHistory(message)
            showActionMessage(message)
            return
          }
        } else {
          if (shouldBet) {
            const actualBet = Math.min(aiBetAmount, aiChips)
            setAiChips(prev => prev - actualBet)
            setPot(prev => prev + actualBet)
            setAiCurrentBet(actualBet)
            playSound('bet')
            const message = `AI bets $${actualBet}`
            addToHistory(message)
            showActionMessage(message)
            setLastAction('raise')
            setNeedsToCall(true)
          } else {
            playSound('check')
            const message = 'AI checks'
            addToHistory(message)
            showActionMessage(message)
            setLastAction('check')
            if (gameStage === 'flop') {
              dealTurn()
            } else if (gameStage === 'turn') {
              dealRiver()
            } else if (gameStage === 'river') {
              completeHand()
            }
          }
        }
      }

      setIsPlayerTurn(true)
    }, 2000 + Math.random() * 2000)
  }

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

  const dealFlop = () => {
    if (deck.length >= 5) {
      const newCommunityCards = deck.slice(4, 7)
      setCommunityCards(newCommunityCards)
      setHandRank(getHandRank(playerHand, newCommunityCards))
      setAiHandRank(getHandRank(aiHand, newCommunityCards))
      setGameStage('flop')
    }
  }

  const dealTurn = () => {
    if (deck.length >= 6) {
      const newCommunityCards = [...communityCards, deck[7]]
      setCommunityCards(newCommunityCards)
      setHandRank(getHandRank(playerHand, newCommunityCards))
      setAiHandRank(getHandRank(aiHand, newCommunityCards))
      setGameStage('turn')
    }
  }

  const dealRiver = () => {
    if (deck.length >= 7) {
      const newCommunityCards = [...communityCards, deck[8]]
      setCommunityCards(newCommunityCards)
      setHandRank(getHandRank(playerHand, newCommunityCards))
      setAiHandRank(getHandRank(aiHand, newCommunityCards))
      setGameStage('river')
    }
  }

  // Add new function to handle action messages
  const showActionMessage = (message: string) => {
    setAiAction(message)
    // Clear message after 3 seconds
    setTimeout(() => {
      setAiAction('')
    }, 3000)
  }

  return (
    <div className="poker-table">
      <h1>Texas Hold'em Poker</h1>
      
      <div className="player-info">
        <div className="chips">
          <span>Your Chips: ${chips}</span>
          <span>AI Chips: ${aiChips}</span>
          <span>Pot: ${pot}</span>
          {currentBet > 0 && <span>Your Bet: ${currentBet}</span>}
          {aiCurrentBet > 0 && <span>AI Bet: ${aiCurrentBet}</span>}
          <span>Big Blind: ${bigBlind}</span>
        </div>

        <div className="action-history">
          {actionHistory.slice(-5).map((action, index) => (
            <div key={index} className="action-message">
              {action}
            </div>
          ))}
        </div>

        <div className="turn-indicator">
          {gameStage !== 'complete' && (
            <span className={isPlayerTurn ? 'active' : ''}>
              {isPlayerTurn ? "Your Turn" : "AI's Turn"}
            </span>
          )}
        </div>

        {!isPlayerTurn && gameStage !== 'complete' && (
          <div className={`ai-thinking ${aiAction ? 'with-action' : ''}`}>
            {aiAction || "AI is thinking..."}
          </div>
        )}

        {gameStage !== 'complete' && playerHand.length > 0 && isPlayerTurn && (
          <>
            <div className="betting-controls">
              <input
                type="number"
                min="1"
                max={chips}
                value={betAmount}
                onChange={(e) => setBetAmount(Number(e.target.value))}
              />
              <button onClick={() => placeBet()} disabled={chips < betAmount}>
                {needsToCall ? 'Raise' : 'Bet'}
              </button>
              <button onClick={check}>
                {needsToCall ? `Call $${aiCurrentBet - currentBet}` : 'Check'}
              </button>
              <button onClick={fold}>Fold</button>
            </div>
            <div className="quick-bets">
              <button onClick={() => quickBet(1)}>1BB (${bigBlind})</button>
              <button onClick={() => quickBet(2)}>2BB (${bigBlind * 2})</button>
              <button onClick={() => quickBet(3)}>3BB (${bigBlind * 3})</button>
              <button onClick={() => quickBet(5)}>5BB (${bigBlind * 5})</button>
            </div>
          </>
        )}
      </div>

      <div className="controls">
        <button onClick={dealCards}>Deal New Hand</button>
        <button 
          onClick={() => setShowAiCards(!showAiCards)}
          className={showAiCards ? 'active' : ''}
        >
          {showAiCards ? 'Hide AI Cards' : 'Reveal AI Cards'}
        </button>
        <button className="return-button" onClick={() => window.location.reload()}>
          Return to Menu
        </button>
      </div>

      <div className="blind-controls">
        <label>
          Big Blind: 
          <input
            type="number"
            min="2"
            step="2"
            value={bigBlind}
            onChange={(e) => setBigBlind(Number(e.target.value))}
          />
        </label>
      </div>

      {gameResult && (
        <div className="game-result">
          <h2>{gameResult}</h2>
        </div>
      )}

      {handRank && (
        <div className="hand-rank">
          <h2>Your Best Hand:</h2>
          <p>{handRank.rank} {handRank.value !== 'A' && handRank.rank !== 'High Card' ? `of ${handRank.value}` : ''}</p>
        </div>
      )}

      <div className="dealer-button">
        {isPlayerDealer ? 'D' : ''}
      </div>

      <div className="ai-hand">
        {(showAiCards || gameStage === 'complete') ? (
          aiHand.map((card, index) => (
            <Card key={index} suit={card.suit} value={card.value} />
          ))
        ) : (
          aiHand.map((_, index) => (
            <div key={index} className="card card-back" />
          ))
        )}
      </div>

      <div className="community-cards">
        {communityCards.map((card, index) => (
          <Card key={index} suit={card.suit} value={card.value} />
        ))}
      </div>

      <div className="player-hand">
        {playerHand.map((card, index) => (
          <Card key={index} suit={card.suit} value={card.value} />
        ))}
      </div>
    </div>
  )
}

export default Game 