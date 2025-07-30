import { GameVariant, RULE_CONFIGURATIONS, VariationEngine } from '../ruleVariations'

describe('Rule Variations System', () => {
  describe('GameVariant enum', () => {
    it('should have correct variant values', () => {
      expect(GameVariant.VEGAS).toBe('vegas')
      expect(GameVariant.EUROPEAN).toBe('european')
      expect(GameVariant.ATLANTIC_CITY).toBe('atlantic_city')
    })
  })

  describe('RULE_CONFIGURATIONS', () => {
    it('should have configurations for all variants', () => {
      expect(RULE_CONFIGURATIONS[GameVariant.VEGAS]).toBeDefined()
      expect(RULE_CONFIGURATIONS[GameVariant.EUROPEAN]).toBeDefined()
      expect(RULE_CONFIGURATIONS[GameVariant.ATLANTIC_CITY]).toBeDefined()
    })

    describe('Vegas Rules', () => {
      const vegasRules = RULE_CONFIGURATIONS[GameVariant.VEGAS]

      it('should have correct Vegas rule settings', () => {
        expect(vegasRules.id).toBe(GameVariant.VEGAS)
        expect(vegasRules.name).toBe('Vegas Rules')
        expect(vegasRules.dealerHitsSoft17).toBe(true)
        expect(vegasRules.dealerPeeksForBlackjack).toBe(true)
        expect(vegasRules.noHoleCard).toBe(false)
        expect(vegasRules.doubleAfterSplit).toBe(true)
        expect(vegasRules.resplitAces).toBe(false)
        expect(vegasRules.surrenderAllowed).toBe(false)
        expect(vegasRules.blackjackPayout).toBe(1.5)
        expect(vegasRules.insuranceAllowed).toBe(true)
        expect(vegasRules.numberOfDecks).toBe(6)
      })
    })

    describe('European Rules', () => {
      const europeanRules = RULE_CONFIGURATIONS[GameVariant.EUROPEAN]

      it('should have correct European rule settings', () => {
        expect(europeanRules.id).toBe(GameVariant.EUROPEAN)
        expect(europeanRules.name).toBe('European Rules')
        expect(europeanRules.dealerHitsSoft17).toBe(false)
        expect(europeanRules.dealerPeeksForBlackjack).toBe(false)
        expect(europeanRules.noHoleCard).toBe(true)
        expect(europeanRules.doubleAfterSplit).toBe(true)
        expect(europeanRules.resplitAces).toBe(false)
        expect(europeanRules.surrenderAllowed).toBe(false)
        expect(europeanRules.blackjackPayout).toBe(1.5)
        expect(europeanRules.insuranceAllowed).toBe(false)
        expect(europeanRules.numberOfDecks).toBe(6)
      })
    })

    describe('Atlantic City Rules', () => {
      const acRules = RULE_CONFIGURATIONS[GameVariant.ATLANTIC_CITY]

      it('should have correct Atlantic City rule settings', () => {
        expect(acRules.id).toBe(GameVariant.ATLANTIC_CITY)
        expect(acRules.name).toBe('Atlantic City Rules')
        expect(acRules.dealerHitsSoft17).toBe(false)
        expect(acRules.dealerPeeksForBlackjack).toBe(true)
        expect(acRules.noHoleCard).toBe(false)
        expect(acRules.doubleAfterSplit).toBe(true)
        expect(acRules.resplitAces).toBe(true)
        expect(acRules.surrenderAllowed).toBe(true)
        expect(acRules.lateSurrenderOnly).toBe(true)
        expect(acRules.blackjackPayout).toBe(1.5)
        expect(acRules.insuranceAllowed).toBe(true)
        expect(acRules.numberOfDecks).toBe(8)
      })
    })
  })

  describe('VariationEngine', () => {
    let engine: VariationEngine

    beforeEach(() => {
      engine = new VariationEngine()
    })

    it('should initialize with Vegas rules by default', () => {
      expect(engine.getCurrentRules().id).toBe(GameVariant.VEGAS)
      expect(engine.getVariantName()).toBe('Vegas Rules')
    })

    it('should allow setting different variants', () => {
      engine.setVariant(GameVariant.EUROPEAN)
      expect(engine.getCurrentRules().id).toBe(GameVariant.EUROPEAN)
      expect(engine.getVariantName()).toBe('European Rules')

      engine.setVariant(GameVariant.ATLANTIC_CITY)
      expect(engine.getCurrentRules().id).toBe(GameVariant.ATLANTIC_CITY)
      expect(engine.getVariantName()).toBe('Atlantic City Rules')
    })

    describe('rule validation methods', () => {
      it('should validate Vegas rules correctly', () => {
        engine.setVariant(GameVariant.VEGAS)
        
        expect(engine.canDoubleAfterSplit()).toBe(true)
        expect(engine.canResplitAces()).toBe(false)
        expect(engine.canSurrender()).toBe(false)
        expect(engine.shouldDealerHitSoft17()).toBe(true)
        expect(engine.shouldDealerPeekForBlackjack()).toBe(true)
        expect(engine.isNoHoleCardVariant()).toBe(false)
        expect(engine.getBlackjackPayout()).toBe(1.5)
        expect(engine.isInsuranceAllowed()).toBe(true)
        expect(engine.getNumberOfDecks()).toBe(6)
      })

      it('should validate European rules correctly', () => {
        engine.setVariant(GameVariant.EUROPEAN)
        
        expect(engine.canDoubleAfterSplit()).toBe(true)
        expect(engine.canResplitAces()).toBe(false)
        expect(engine.canSurrender()).toBe(false)
        expect(engine.shouldDealerHitSoft17()).toBe(false)
        expect(engine.shouldDealerPeekForBlackjack()).toBe(false)
        expect(engine.isNoHoleCardVariant()).toBe(true)
        expect(engine.getBlackjackPayout()).toBe(1.5)
        expect(engine.isInsuranceAllowed()).toBe(false)
        expect(engine.getNumberOfDecks()).toBe(6)
      })

      it('should validate Atlantic City rules correctly', () => {
        engine.setVariant(GameVariant.ATLANTIC_CITY)
        
        expect(engine.canDoubleAfterSplit()).toBe(true)
        expect(engine.canResplitAces()).toBe(true)
        expect(engine.canSurrender()).toBe(true)
        expect(engine.shouldDealerHitSoft17()).toBe(false)
        expect(engine.shouldDealerPeekForBlackjack()).toBe(true)
        expect(engine.isNoHoleCardVariant()).toBe(false)
        expect(engine.getBlackjackPayout()).toBe(1.5)
        expect(engine.isInsuranceAllowed()).toBe(true)
        expect(engine.getNumberOfDecks()).toBe(8)
      })
    })

    describe('utility methods', () => {
      it('should return correct variant information', () => {
        engine.setVariant(GameVariant.EUROPEAN)
        
        expect(engine.getVariantName()).toBe('European Rules')
        expect(engine.getVariantDescription()).toContain('European blackjack')
        expect(engine.getAvailableVariants()).toEqual([
          GameVariant.VEGAS,
          GameVariant.EUROPEAN,
          GameVariant.ATLANTIC_CITY
        ])
      })

      it('should return rule differences for Vegas rules', () => {
        engine.setVariant(GameVariant.VEGAS)
        const differences = engine.getRuleDifferences()
        
        expect(differences).toEqual(['Standard Vegas rules'])
      })

      it('should return rule differences for European rules', () => {
        engine.setVariant(GameVariant.EUROPEAN)
        const differences = engine.getRuleDifferences()
        
        expect(differences).toContain('Dealer stands on soft 17')
        expect(differences).toContain('No hole card - dealer receives second card after all players complete their hands')
        expect(differences).toContain('Insurance not available')
      })

      it('should return rule differences for Atlantic City rules', () => {
        engine.setVariant(GameVariant.ATLANTIC_CITY)
        const differences = engine.getRuleDifferences()
        
        expect(differences).toContain('Dealer stands on soft 17')
        expect(differences).toContain('Late surrender allowed')
        expect(differences).toContain('Can resplit aces')
        expect(differences).toContain('Uses 8 decks')
      })
    })

    describe('constructor with variant parameter', () => {
      it('should initialize with specified variant', () => {
        const europeanEngine = new VariationEngine(GameVariant.EUROPEAN)
        expect(europeanEngine.getCurrentRules().id).toBe(GameVariant.EUROPEAN)

        const acEngine = new VariationEngine(GameVariant.ATLANTIC_CITY)
        expect(acEngine.getCurrentRules().id).toBe(GameVariant.ATLANTIC_CITY)
      })
    })
  })
})