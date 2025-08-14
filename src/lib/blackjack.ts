import { Card, Hand, Rank } from '@/types/game'
import { RuleSet, getDealerAction, canPlayerSplit, getBlackjackPayout, createRuleSet, GameVariant } from './ruleVariations'

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

export function canSplit(hand: Hand, rules?: RuleSet, currentSplits = 0): boolean {
  if (hand.cards.length !== 2) return false
  
  const [card1, card2] = hand.cards
  // Only allow splitting if ranks are identical (not just values)
  if (card1.rank !== card2.rank) return false
  
  if (!rules) {
    return true // Default behavior
  }
  
  // Check if we can resplit to the maximum number of hands
  if (!rules.resplitToFourHands && currentSplits >= 1) {
    return false
  }
  
  if (rules.resplitToFourHands && currentSplits >= 3) {
    return false // Maximum 4 hands total
  }
  
  // Check if we can resplit Aces
  if (card1.rank === 'A' && currentSplits > 0 && !rules.resplitAces) {
    return false
  }
  
  return true
}

export function canDouble(hand: Hand): boolean {
  return hand.cards.length === 2 && !hand.isBusted
}


export function canSurrender(hand: Hand, rules?: RuleSet): boolean {
  if (!rules || !rules.surrenderAllowed) return false
  
  // Can only surrender on first two cards
  return hand.cards.length === 2 && !hand.isBlackjack
}

export function canInsurance(dealerUpCard: Card, rules?: RuleSet): boolean {
  if (!rules || !rules.insuranceAllowed) return false
  
  // Insurance is only available when dealer shows Ace
  return dealerUpCard.rank === 'A'
}

export function shouldDealerHit(hand: Hand, rules?: RuleSet): boolean {
  if (rules) {
    return getDealerAction(rules, hand.value, hand.isSoft) === 'hit'
  }
  
  // Fallback to original logic for backward compatibility (Vegas rules)
  if (hand.value < 17) return true
  if (hand.value > 17) return false
  
  // Dealer stands on soft 17 (standard casino rule)
  return false
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

export function calculatePayout(bet: number, playerHand: Hand, dealerHand: Hand, rules?: RuleSet): number {
  const winner = determineWinner(playerHand, dealerHand)
  
  if (winner === 'dealer') return 0
  if (winner === 'push') return bet
  
  // Player wins - check for blackjack vs regular win
  if (playerHand.isBlackjack && !dealerHand.isBlackjack) {
    if (rules) {
      return bet + Math.floor(bet * getBlackjackPayout(rules))
    }
    // Fallback to original logic (3:2 payout)
    return bet + Math.floor(bet * 1.5)
  }
  
  return bet + bet // 1:1 payout for regular wins (return original bet + winnings)
}