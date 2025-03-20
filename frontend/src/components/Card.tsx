import React from 'react'

interface CardProps {
  suit: 'hearts' | 'diamonds' | 'clubs' | 'spades'
  value: string
}

const Card: React.FC<CardProps> = ({ suit, value }) => {
  const getSuitSymbol = (suit: string) => {
    switch (suit) {
      case 'hearts':
        return '♥'
      case 'diamonds':
        return '♦'
      case 'clubs':
        return '♣'
      case 'spades':
        return '♠'
      default:
        return ''
    }
  }

  const isRed = suit === 'hearts' || suit === 'diamonds'

  return (
    <div className="card" data-suit={suit}>
      <div className="card-value card-value-top">{value}</div>
      <div className="card-suit">{getSuitSymbol(suit)}</div>
      <div className="card-value card-value-bottom">{value}</div>
    </div>
  )
}

export default Card 