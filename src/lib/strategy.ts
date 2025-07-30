import { Hand, Card } from '@/types/game'
import { RuleSet, canPlayerSplit, canPlayerDoubleAfterSplit, canPlayerSurrender } from './ruleVariations'

export interface StrategyAdvice {
  action: 'hit' | 'stand' | 'double' | 'split' | 'surrender'
  reason: string
  confidence: 'high' | 'medium' | 'low'
}

// Basic Strategy Chart for Single Deck Blackjack
export function getBasicStrategyAdvice(
  playerHand: Hand,
  dealerUpCard: Card,
  canDouble: boolean,
  canSplit: boolean,
  rules?: RuleSet,
  currentSplits: number = 0,
  isAfterSplit: boolean = false
): StrategyAdvice {
  const playerValue = playerHand.value
  const dealerValue = getCardValue(dealerUpCard.rank)
  const isSoft = playerHand.isSoft

  // Check for surrender first (only on first two cards)
  if (rules && canPlayerSurrender(rules) && playerHand.cards.length === 2 && !isAfterSplit) {
    const surrenderAdvice = checkSurrender(playerValue, dealerValue, isSoft)
    if (surrenderAdvice) {
      return surrenderAdvice
    }
  }

  // Validate split using rules if provided
  let canActuallySplit = canSplit
  if (rules && playerHand.cards.length === 2) {
    canActuallySplit = canPlayerSplit(playerHand, rules, currentSplits)
  }

  const isPair = canActuallySplit && playerHand.cards.length === 2 && 
                 getCardValue(playerHand.cards[0].rank) === getCardValue(playerHand.cards[1].rank)

  // Handle pairs first
  if (isPair) {
    return handlePairs(playerHand.cards[0].rank, dealerValue, rules, currentSplits)
  }

  // Adjust double down availability after split
  let canActuallyDouble = canDouble
  if (rules && isAfterSplit) {
    canActuallyDouble = canDouble && canPlayerDoubleAfterSplit(rules)
  }

  // Handle soft hands (hands with an Ace counted as 11)
  if (isSoft) {
    return handleSoftHands(playerValue, dealerValue, canActuallyDouble)
  }

  // Handle hard hands
  return handleHardHands(playerValue, dealerValue, canActuallyDouble)
}

function getCardValue(rank: string): number {
  switch (rank) {
    case 'A': return 11
    case 'J':
    case 'Q':
    case 'K': return 10
    default: return parseInt(rank)
  }
}

function checkSurrender(playerValue: number, dealerValue: number, isSoft: boolean): StrategyAdvice | null {
  // Basic surrender strategy - only on hard totals
  if (isSoft) return null

  // Hard 16 vs dealer 9, 10, A
  if (playerValue === 16 && (dealerValue >= 9 || dealerValue === 11)) {
    return {
      action: 'surrender',
      reason: 'Surrender hard 16 against dealer\'s strong cards',
      confidence: 'high'
    }
  }

  // Hard 15 vs dealer 10
  if (playerValue === 15 && dealerValue === 10) {
    return {
      action: 'surrender',
      reason: 'Surrender hard 15 against dealer 10',
      confidence: 'high'
    }
  }

  return null
}

function handlePairs(rank: string, dealerValue: number, rules?: RuleSet, currentSplits: number = 0): StrategyAdvice {
  const pairValue = getCardValue(rank)

  switch (rank) {
    case 'A':
      // Check resplit aces rule
      if (rules && currentSplits > 0 && !rules.resplitAces) {
        return {
          action: 'hit',
          reason: 'Cannot resplit Aces under current rules',
          confidence: 'high'
        }
      }
      return {
        action: 'split',
        reason: 'Always split Aces - each Ace can become 21',
        confidence: 'high'
      }
    case '8':
      return {
        action: 'split',
        reason: 'Always split 8s - 16 is a weak hand, but 8s have potential',
        confidence: 'high'
      }
    case '10':
    case 'J':
    case 'Q':
    case 'K':
      return {
        action: 'stand',
        reason: 'Never split 10s - 20 is an excellent hand',
        confidence: 'high'
      }
    case '5':
      if (dealerValue >= 2 && dealerValue <= 9) {
        return {
          action: 'double',
          reason: 'Double down with pair of 5s against weak dealer cards',
          confidence: 'high'
        }
      }
      return {
        action: 'hit',
        reason: 'Hit with pair of 5s against strong dealer cards',
        confidence: 'high'
      }
    case '4':
      if (dealerValue === 5 || dealerValue === 6) {
        return {
          action: 'split',
          reason: 'Split 4s against dealer\'s weakest cards',
          confidence: 'medium'
        }
      }
      return {
        action: 'hit',
        reason: 'Hit with pair of 4s - splitting creates weak hands',
        confidence: 'high'
      }
    default:
      // For 2s, 3s, 6s, 7s, 9s
      if (pairValue <= 3) {
        if (dealerValue >= 2 && dealerValue <= 7) {
          return {
            action: 'split',
            reason: `Split ${rank}s against dealer's weak cards`,
            confidence: 'high'
          }
        }
      } else if (pairValue === 6) {
        if (dealerValue >= 2 && dealerValue <= 6) {
          return {
            action: 'split',
            reason: 'Split 6s against dealer\'s weak cards',
            confidence: 'high'
          }
        }
      } else if (pairValue === 7) {
        if (dealerValue >= 2 && dealerValue <= 7) {
          return {
            action: 'split',
            reason: 'Split 7s against dealer\'s weak cards',
            confidence: 'high'
          }
        }
      } else if (pairValue === 9) {
        if ((dealerValue >= 2 && dealerValue <= 6) || dealerValue === 8 || dealerValue === 9) {
          return {
            action: 'split',
            reason: 'Split 9s against these dealer cards',
            confidence: 'high'
          }
        }
        return {
          action: 'stand',
          reason: '18 is strong against dealer\'s 7, 10, or Ace',
          confidence: 'high'
        }
      }
      
      return {
        action: 'hit',
        reason: 'Hit - splitting would create weak hands',
        confidence: 'medium'
      }
  }
}

function handleSoftHands(playerValue: number, dealerValue: number, canDouble: boolean): StrategyAdvice {
  // Soft hands (Ace + other card)
  if (playerValue >= 19) {
    return {
      action: 'stand',
      reason: 'Soft 19-21 is very strong - stand',
      confidence: 'high'
    }
  }

  if (playerValue === 18) {
    if (dealerValue >= 2 && dealerValue <= 6) {
      if (canDouble) {
        return {
          action: 'double',
          reason: 'Double soft 18 against dealer\'s weak cards',
          confidence: 'high'
        }
      }
      return {
        action: 'stand',
        reason: 'Stand on soft 18 against dealer\'s weak cards',
        confidence: 'high'
      }
    }
    if (dealerValue === 7 || dealerValue === 8) {
      return {
        action: 'stand',
        reason: 'Soft 18 is competitive against 7 or 8',
        confidence: 'high'
      }
    }
    return {
      action: 'hit',
      reason: 'Hit soft 18 against dealer\'s strong cards',
      confidence: 'high'
    }
  }

  // Soft 13-17
  if (dealerValue >= 4 && dealerValue <= 6 && canDouble) {
    return {
      action: 'double',
      reason: 'Double soft hands against dealer\'s weakest cards',
      confidence: 'high'
    }
  }

  return {
    action: 'hit',
    reason: 'Hit to improve soft hand - no risk of busting',
    confidence: 'high'
  }
}

function handleHardHands(playerValue: number, dealerValue: number, canDouble: boolean): StrategyAdvice {
  if (playerValue >= 17) {
    return {
      action: 'stand',
      reason: '17+ is strong enough to stand',
      confidence: 'high'
    }
  }

  if (playerValue >= 13 && playerValue <= 16) {
    if (dealerValue >= 2 && dealerValue <= 6) {
      return {
        action: 'stand',
        reason: 'Stand on stiff hands against dealer\'s weak cards',
        confidence: 'high'
      }
    }
    return {
      action: 'hit',
      reason: 'Hit stiff hands against dealer\'s strong cards',
      confidence: 'high'
    }
  }

  if (playerValue === 12) {
    if (dealerValue >= 4 && dealerValue <= 6) {
      return {
        action: 'stand',
        reason: 'Stand on 12 against dealer\'s weakest cards',
        confidence: 'medium'
      }
    }
    return {
      action: 'hit',
      reason: 'Hit 12 - risk is worth the potential improvement',
      confidence: 'high'
    }
  }

  if (playerValue === 11) {
    if (canDouble) {
      return {
        action: 'double',
        reason: 'Always double on 11 - best doubling opportunity',
        confidence: 'high'
      }
    }
    return {
      action: 'hit',
      reason: 'Hit on 11 - can\'t bust and likely to improve',
      confidence: 'high'
    }
  }

  if (playerValue === 10) {
    if (dealerValue >= 2 && dealerValue <= 9 && canDouble) {
      return {
        action: 'double',
        reason: 'Double on 10 against dealer\'s weak cards',
        confidence: 'high'
      }
    }
    return {
      action: 'hit',
      reason: 'Hit on 10 - good chance to make a strong hand',
      confidence: 'high'
    }
  }

  if (playerValue === 9) {
    if (dealerValue >= 3 && dealerValue <= 6 && canDouble) {
      return {
        action: 'double',
        reason: 'Double on 9 against dealer\'s weakest cards',
        confidence: 'high'
      }
    }
    return {
      action: 'hit',
      reason: 'Hit on 9 - need to improve this hand',
      confidence: 'high'
    }
  }

  // 8 or less
  return {
    action: 'hit',
    reason: 'Always hit on 8 or less - no risk of busting',
    confidence: 'high'
  }
}