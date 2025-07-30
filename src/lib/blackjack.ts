import { Card, Hand, Rank } from '@/types/game'

export function getCardValue(rank: Rank): number {
  switch (rank) {
    case 'A':
      return 11
    case 'J':
    case 'Q':
    case 'K':
      return 10
    default:
      return parseInt(rank)
  }
}

export function calculateHandValue(cards: Card[]): { value: number; isSoft: boolean } {
  let value = 0
  let aces = 0
  
  // Filter out hidden cards before calculating value
  const visibleCards = cards.filter(card => !card.hidden)
  
  // First, count all non-ace cards
  for (const card of visibleCards) {
    if (card.rank === 'A') {
      aces++
    } else {
      value += getCardValue(card.rank)
    }
  }
  
  // Add aces, treating them as 11 when possible
  let acesAsEleven = 0
  for (let i = 0; i < aces; i++) {
    if (value + 11 + (aces - i - 1) <= 21) {
      value += 11
      acesAsEleven++
    } else {
      value += 1
    }
  }
  
  const isSoft = acesAsEleven > 0 && value <= 21
  
  return { value, isSoft }
}

export function createHand(cards: Card[] = []): Hand {
  const { value, isSoft } = calculateHandValue(cards)
  const isBlackjack = cards.length === 2 && value === 21
  const isBusted = value > 21
  
  return {
    cards,
    value,
    isSoft,
    isBlackjack,
    isBusted
  }
}

export function addCardToHand(hand: Hand, card: Card): Hand {
  const newCards = [...hand.cards, card]
  return createHand(newCards)
}

export function canSplit(hand: Hand): boolean {
  if (hand.cards.length !== 2) return false
  
  const [card1, card2] = hand.cards
  return getCardValue(card1.rank) === getCardValue(card2.rank)
}

export function canDouble(hand: Hand): boolean {
  return hand.cards.length === 2 && !hand.isBusted
}

export function shouldDealerHit(hand: Hand): boolean {
  // Dealer hits on 16 and stands on 17
  if (hand.value < 17) return true
  if (hand.value > 17) return false
  
  // Dealer hits on soft 17 (common casino rule)
  return hand.value === 17 && hand.isSoft
}

export function determineWinner(playerHand: Hand, dealerHand: Hand): 'player' | 'dealer' | 'push' {
  if (playerHand.isBusted) return 'dealer'
  if (dealerHand.isBusted) return 'player'
  
  if (playerHand.isBlackjack && !dealerHand.isBlackjack) return 'player'
  if (dealerHand.isBlackjack && !playerHand.isBlackjack) return 'dealer'
  
  if (playerHand.value > dealerHand.value) return 'player'
  if (dealerHand.value > playerHand.value) return 'dealer'
  
  return 'push'
}

export function calculatePayout(bet: number, playerHand: Hand, dealerHand: Hand): number {
  const winner = determineWinner(playerHand, dealerHand)
  
  if (winner === 'dealer') return 0
  if (winner === 'push') return bet
  
  // Player wins - check for blackjack (3:2 payout) vs regular win (1:1)
  if (playerHand.isBlackjack && !dealerHand.isBlackjack) {
    return bet + Math.floor(bet * 1.5) // 3:2 payout for blackjack
  }
  
  return bet + bet // 1:1 payout for regular wins (return original bet + winnings)
}