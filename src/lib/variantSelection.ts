import { GameVariant, RuleSet, createRuleSet, getVariantDescription, getRuleSummary } from './ruleVariations'

/**
 * Configuration for variant selection UI
 */
export interface VariantOption {
  variant: GameVariant
  name: string
  description: string
  rules: RuleSet
  recommended: boolean
  difficulty: 'beginner' | 'intermediate' | 'advanced'
}

/**
 * Gets all available variant options with metadata
 */
export function getAvailableVariants(): VariantOption[] {
  return [
    {
      variant: GameVariant.VEGAS,
      name: 'Vegas Strip',
      description: 'Classic Las Vegas Strip rules with dealer hitting soft 17',
      rules: createRuleSet(GameVariant.VEGAS),
      recommended: true,
      difficulty: 'beginner'
    },
    {
      variant: GameVariant.EUROPEAN,
      name: 'European',
      description: 'European no-hole-card rules with limited splitting',
      rules: createRuleSet(GameVariant.EUROPEAN),
      recommended: false,
      difficulty: 'intermediate'
    },
    {
      variant: GameVariant.ATLANTIC_CITY,
      name: 'Atlantic City',
      description: 'Player-friendly rules with surrender and resplit aces',
      rules: createRuleSet(GameVariant.ATLANTIC_CITY),
      recommended: true,
      difficulty: 'advanced'
    }
  ]
}

/**
 * Gets a specific variant option by variant type
 */
export function getVariantOption(variant: GameVariant): VariantOption {
  const options = getAvailableVariants()
  const option = options.find(opt => opt.variant === variant)
  if (!option) {
    throw new Error(`Unknown variant: ${variant}`)
  }
  return option
}

/**
 * Gets the default variant for new games
 */
export function getDefaultVariant(): VariantOption {
  return getVariantOption(GameVariant.VEGAS)
}

/**
 * Gets recommended variants for beginners
 */
export function getBeginnerVariants(): VariantOption[] {
  return getAvailableVariants().filter(option => 
    option.difficulty === 'beginner' || option.recommended
  )
}

/**
 * Compares two rule sets and returns the differences
 */
export function compareRuleSets(rules1: RuleSet, rules2: RuleSet): string[] {
  const differences: string[] = []

  if (rules1.dealerHitsOnSoft17 !== rules2.dealerHitsOnSoft17) {
    differences.push(`Dealer action on soft 17: ${rules1.dealerHitsOnSoft17 ? 'hits' : 'stands'} vs ${rules2.dealerHitsOnSoft17 ? 'hits' : 'stands'}`)
  }

  if (rules1.doubleAfterSplit !== rules2.doubleAfterSplit) {
    differences.push(`Double after split: ${rules1.doubleAfterSplit ? 'allowed' : 'not allowed'} vs ${rules2.doubleAfterSplit ? 'allowed' : 'not allowed'}`)
  }

  if (rules1.resplitAces !== rules2.resplitAces) {
    differences.push(`Resplit aces: ${rules1.resplitAces ? 'allowed' : 'not allowed'} vs ${rules2.resplitAces ? 'allowed' : 'not allowed'}`)
  }

  if (rules1.surrenderAllowed !== rules2.surrenderAllowed) {
    differences.push(`Surrender: ${rules1.surrenderAllowed ? 'allowed' : 'not allowed'} vs ${rules2.surrenderAllowed ? 'allowed' : 'not allowed'}`)
  }

  if (rules1.blackjackPayout !== rules2.blackjackPayout) {
    differences.push(`Blackjack payout: ${rules1.blackjackPayout}:1 vs ${rules2.blackjackPayout}:1`)
  }

  if (rules1.insuranceAllowed !== rules2.insuranceAllowed) {
    differences.push(`Insurance: ${rules1.insuranceAllowed ? 'available' : 'not available'} vs ${rules2.insuranceAllowed ? 'available' : 'not available'}`)
  }

  if (rules1.maxSplits !== rules2.maxSplits) {
    differences.push(`Max splits: ${rules1.maxSplits} vs ${rules2.maxSplits}`)
  }

  if (rules1.dealerPeeksForBlackjack !== rules2.dealerPeeksForBlackjack) {
    differences.push(`Dealer peek: ${rules1.dealerPeeksForBlackjack ? 'yes' : 'no'} vs ${rules2.dealerPeeksForBlackjack ? 'yes' : 'no'}`)
  }

  return differences
}

/**
 * Gets house edge information for different variants
 * These are approximate values for basic strategy play
 */
export function getHouseEdge(variant: GameVariant): number {
  switch (variant) {
    case GameVariant.VEGAS:
      return 0.28 // Slightly higher due to dealer hitting soft 17
    case GameVariant.EUROPEAN:
      return 0.39 // Higher due to no-hole-card rule
    case GameVariant.ATLANTIC_CITY:
      return 0.35 // Better for player due to surrender and resplit aces
    default:
      return 0.50 // Conservative estimate
  }
}

/**
 * Gets strategic tips specific to each variant
 */
export function getVariantTips(variant: GameVariant): string[] {
  switch (variant) {
    case GameVariant.VEGAS:
      return [
        'Dealer hits soft 17, so be more cautious with marginal hands',
        'Insurance is available but generally not recommended',
        'Double after split gives you more strategic options'
      ]
    case GameVariant.EUROPEAN:
      return [
        'No hole card means dealer can have blackjack after you act',
        'Limited splitting means pair strategy is less flexible',
        'No insurance available - one less decision to worry about'
      ]
    case GameVariant.ATLANTIC_CITY:
      return [
        'Use surrender on hard 15 vs 10 and hard 16 vs 9,10,A',
        'Take advantage of resplit aces when you get them',
        'Most player-friendly rules overall'
      ]
    default:
      return []
  }
}

/**
 * Determines if a variant is suitable for a player's skill level
 */
export function isVariantSuitableForSkill(
  variant: GameVariant, 
  handsPlayed: number, 
  winRate: number
): boolean {
  const option = getVariantOption(variant)
  
  switch (option.difficulty) {
    case 'beginner':
      return true // Always suitable
    case 'intermediate':
      return handsPlayed >= 50 && winRate >= 40
    case 'advanced':
      return handsPlayed >= 100 && winRate >= 45
    default:
      return false
  }
}