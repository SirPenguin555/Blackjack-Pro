/**
 * Blackjack Rule Variations System
 * Supports Vegas, European, and Atlantic City rule sets
 */

export enum GameVariant {
  VEGAS = 'vegas',
  EUROPEAN = 'european',
  ATLANTIC_CITY = 'atlantic_city'
}

export interface RuleSet {
  id: GameVariant
  name: string
  description: string
  
  // Dealer rules
  dealerHitsSoft17: boolean
  dealerPeeksForBlackjack: boolean
  noHoleCard: boolean // European style
  
  // Player options
  doubleAfterSplit: boolean
  resplitAces: boolean
  resplitToFourHands: boolean
  surrenderAllowed: boolean
  lateSurrenderOnly: boolean
  
  // Blackjack payout
  blackjackPayout: number // 1.5 for 3:2, 1.2 for 6:5
  
  // Other rules
  insuranceAllowed: boolean
  evenMoneyOnBlackjack: boolean
  numberOfDecks: number
}

// Predefined rule configurations
export const RULE_CONFIGURATIONS: Record<GameVariant, RuleSet> = {
  [GameVariant.VEGAS]: {
    id: GameVariant.VEGAS,
    name: 'Vegas Rules',
    description: 'Classic Las Vegas blackjack with dealer stands on soft 17',
    dealerHitsSoft17: false,
    dealerPeeksForBlackjack: true,
    noHoleCard: false,
    doubleAfterSplit: true,
    resplitAces: false,
    resplitToFourHands: true,
    surrenderAllowed: false,
    lateSurrenderOnly: false,
    blackjackPayout: 1.5,
    insuranceAllowed: true,
    evenMoneyOnBlackjack: true,
    numberOfDecks: 6
  },
  
  [GameVariant.EUROPEAN]: {
    id: GameVariant.EUROPEAN,
    name: 'European Rules',
    description: 'European blackjack with no hole card and dealer stands on all 17s',
    dealerHitsSoft17: false,
    dealerPeeksForBlackjack: false,
    noHoleCard: true,
    doubleAfterSplit: true,
    resplitAces: false,
    resplitToFourHands: true,
    surrenderAllowed: false,
    lateSurrenderOnly: false,
    blackjackPayout: 1.5,
    insuranceAllowed: false,
    evenMoneyOnBlackjack: false,
    numberOfDecks: 6
  },
  
  [GameVariant.ATLANTIC_CITY]: {
    id: GameVariant.ATLANTIC_CITY,
    name: 'Atlantic City Rules',
    description: 'Atlantic City blackjack with late surrender and dealer stands on soft 17',
    dealerHitsSoft17: false,
    dealerPeeksForBlackjack: true,
    noHoleCard: false,
    doubleAfterSplit: true,
    resplitAces: true,
    resplitToFourHands: true,
    surrenderAllowed: true,
    lateSurrenderOnly: true,
    blackjackPayout: 1.5,
    insuranceAllowed: true,
    evenMoneyOnBlackjack: true,
    numberOfDecks: 8
  }
}

export class VariationEngine {
  private currentRules: RuleSet
  
  constructor(variant: GameVariant = GameVariant.VEGAS) {
    this.currentRules = RULE_CONFIGURATIONS[variant]
  }
  
  getCurrentRules(): RuleSet {
    return this.currentRules
  }
  
  setVariant(variant: GameVariant): void {
    this.currentRules = RULE_CONFIGURATIONS[variant]
  }
  
  // Rule validation methods
  canDoubleAfterSplit(): boolean {
    return this.currentRules.doubleAfterSplit
  }
  
  canResplitAces(): boolean {
    return this.currentRules.resplitAces
  }
  
  canSurrender(): boolean {
    return this.currentRules.surrenderAllowed
  }
  
  shouldDealerHitSoft17(): boolean {
    return this.currentRules.dealerHitsSoft17
  }
  
  shouldDealerPeekForBlackjack(): boolean {
    return this.currentRules.dealerPeeksForBlackjack
  }
  
  isNoHoleCardVariant(): boolean {
    return this.currentRules.noHoleCard
  }
  
  getBlackjackPayout(): number {
    return this.currentRules.blackjackPayout
  }
  
  isInsuranceAllowed(): boolean {
    return this.currentRules.insuranceAllowed
  }
  
  getNumberOfDecks(): number {
    return this.currentRules.numberOfDecks
  }
  
  // Utility methods
  getVariantName(): string {
    return this.currentRules.name
  }
  
  getVariantDescription(): string {
    return this.currentRules.description
  }
  
  getAvailableVariants(): GameVariant[] {
    return Object.values(GameVariant)
  }
  
  /**
   * Get rule differences compared to Vegas rules (baseline)
   */
  getRuleDifferences(): string[] {
    const vegasRules = RULE_CONFIGURATIONS[GameVariant.VEGAS]
    const differences: string[] = []
    
    if (this.currentRules.id === GameVariant.VEGAS) {
      return ['Standard Vegas rules']
    }
    
    // Compare key rule differences
    if (this.currentRules.dealerHitsSoft17 !== vegasRules.dealerHitsSoft17) {
      differences.push(
        this.currentRules.dealerHitsSoft17 
          ? 'Dealer hits soft 17' 
          : 'Dealer stands on soft 17'
      )
    }
    
    if (this.currentRules.noHoleCard !== vegasRules.noHoleCard) {
      differences.push('No hole card - dealer receives second card after all players complete their hands')
    }
    
    if (this.currentRules.surrenderAllowed !== vegasRules.surrenderAllowed) {
      differences.push('Late surrender allowed')
    }
    
    if (this.currentRules.resplitAces !== vegasRules.resplitAces) {
      differences.push('Can resplit aces')
    }
    
    if (!this.currentRules.insuranceAllowed && vegasRules.insuranceAllowed) {
      differences.push('Insurance not available')
    }
    
    if (this.currentRules.numberOfDecks !== vegasRules.numberOfDecks) {
      differences.push(`Uses ${this.currentRules.numberOfDecks} decks`)
    }
    
    return differences
  }
}

// Global instance for easy access
export const variationEngine = new VariationEngine()

// Helper functions for backward compatibility
export function createRuleSet(variant: GameVariant): RuleSet {
  return RULE_CONFIGURATIONS[variant]
}

export function canPlayerSplit(rules: RuleSet): boolean {
  return rules.resplitToFourHands
}

export function canPlayerSurrender(rules: RuleSet): boolean {
  return rules.surrenderAllowed
}

export function canPlayerDoubleAfterSplit(rules: RuleSet): boolean {
  return rules.doubleAfterSplit
}

export function getDealerAction(rules: RuleSet, dealerValue: number, isSoft: boolean): 'hit' | 'stand' {
  if (dealerValue < 17) {
    return 'hit'
  } else if (dealerValue === 17 && isSoft && rules.dealerHitsSoft17) {
    return 'hit'
  } else {
    return 'stand'
  }
}

export function getBlackjackPayout(rules: RuleSet): number {
  return rules.blackjackPayout
}