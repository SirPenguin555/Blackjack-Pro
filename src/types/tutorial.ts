export interface TutorialStep {
  id: string
  title: string
  content: string
  action?: 'bet' | 'deal' | 'hit' | 'stand' | 'observe'
  highlight?: 'chips' | 'cards' | 'actions' | 'dealer' | 'player'
  autoAdvance?: boolean
  delay?: number
}

export interface TutorialState {
  currentStep: number
  isActive: boolean
  completed: boolean
  steps: TutorialStep[]
}

export interface VariantTutorialSteps {
  vegas: TutorialStep[]
  european: TutorialStep[]
  atlantic_city: TutorialStep[]
}

export const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Blackjack Tutorial',
    content: 'Learn the basics of blackjack! The goal is to get cards totaling as close to 21 as possible without going over. Let\'s start!'
  },
  {
    id: 'betting',
    title: 'Place Your Bet',
    content: 'First, you need to place a bet. Click on the chip values below to add them to your bet. Try betting $5.',
    action: 'bet',
    highlight: 'chips'
  },
  {
    id: 'dealing',
    title: 'Deal the Cards',
    content: 'Great! Now click "Deal Cards" to start the hand. You\'ll get 2 cards face up, and the dealer gets 2 cards with one face down.',
    action: 'deal',
    highlight: 'cards'
  },
  {
    id: 'card-values',
    title: 'Understanding Card Values',
    content: 'Number cards = face value, Face cards (J,Q,K) = 10, Aces = 1 or 11 (whichever is better). Your hand value is shown below your cards.'
  },
  {
    id: 'player-turn',
    title: 'Your Turn - Hit or Stand',
    content: 'Now it\'s your turn! "Hit" to take another card, or "Stand" to keep your current total. Try to get close to 21 without going over.',
    action: 'hit',
    highlight: 'actions'
  },
  {
    id: 'dealer-turn',
    title: 'Dealer\'s Turn',
    content: 'After you stand, the dealer reveals their hidden card and must hit if their total is 16 or less, and stand on 17 or more.',
    action: 'observe',
    highlight: 'dealer'
  },
  {
    id: 'winning',
    title: 'Determining the Winner',
    content: 'Closest to 21 wins! If you go over 21, you "bust" and lose. If dealer busts, you win. Equal totals = "push" (tie).'
  },
  {
    id: 'blackjack',
    title: 'Blackjack!',
    content: 'If your first 2 cards total exactly 21 (Ace + 10-value card), that\'s "Blackjack" and pays 3:2 instead of 1:1!'
  },
  {
    id: 'complete',
    title: 'Tutorial Complete!',
    content: 'You\'ve learned the basics! Try playing a few hands to practice, or switch to Easy Mode for helpful hints.'
  }
]

// Vegas Rules Tutorial Steps
export const VEGAS_TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 'vegas-welcome',
    title: 'Welcome to Vegas Rules Blackjack',
    content: 'Welcome to classic Las Vegas blackjack! This tutorial will teach you the specific Vegas rules where the dealer hits soft 17 and insurance is available.'
  },
  {
    id: 'vegas-betting',
    title: 'Place Your Vegas Bet',
    content: 'Start by placing your bet. Vegas tables have varying betting limits, and you\'ll need to bet before each hand.',
    action: 'bet',
    highlight: 'chips'
  },
  {
    id: 'vegas-dealing',
    title: 'Vegas Deal Style',
    content: 'Cards are dealt Vegas style: you get 2 cards face up, dealer gets 1 face up and 1 face down (hole card). Click Deal Cards.',
    action: 'deal',
    highlight: 'cards'
  },
  {
    id: 'vegas-hole-card',
    title: 'The Hole Card Advantage',
    content: 'Notice the dealer has a hidden hole card. In Vegas rules, the dealer peeks for blackjack when showing Ace or 10, protecting your double/split bets.'
  },
  {
    id: 'vegas-soft17',
    title: 'Dealer Hits Soft 17',
    content: 'KEY VEGAS RULE: When the dealer has Ace+6 (soft 17), they must hit. This increases the house edge slightly compared to standing on soft 17.'
  },
  {
    id: 'vegas-insurance-demo',
    title: 'Insurance Opportunity', 
    content: 'When dealer shows an Ace, you can buy insurance for half your bet. If dealer has blackjack, insurance pays 2:1. Generally not recommended.',
    highlight: 'dealer'
  },
  {
    id: 'vegas-your-turn',
    title: 'Vegas Decision Time',
    content: 'Now make your decision. In Vegas rules, you can hit, stand, double down, or split pairs. Try hitting or standing based on your total.',
    action: 'hit',
    highlight: 'actions'
  },
  {
    id: 'vegas-splits-allowed',
    title: 'Vegas Splitting Rules',
    content: 'Vegas allows: double after split, resplit pairs up to 4 hands, but NO resplitting Aces. Each split hand gets exactly one more card if splitting Aces.'
  },
  {
    id: 'vegas-complete',
    title: 'Vegas Rules Mastered!',
    content: 'You\'ve learned Vegas blackjack! Key points: dealer hits soft 17, hole card with peek, insurance available, double after split OK, can\'t resplit Aces.'
  }
]

// European Rules Tutorial Steps  
export const EUROPEAN_TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 'european-welcome',
    title: 'Welcome to European Blackjack',
    content: 'Welcome to European blackjack! This version has unique rules: NO hole card, dealer stands on soft 17, and NO insurance. More player-friendly overall!'
  },
  {
    id: 'european-betting',
    title: 'Place Your European Bet', 
    content: 'Betting works the same way. Place your chips to start learning the European differences.',
    action: 'bet',
    highlight: 'chips'
  },
  {
    id: 'european-dealing',
    title: 'European Deal - Only One Card!',
    content: 'MAJOR DIFFERENCE: Watch the deal! You get 2 cards face up, but the dealer gets only ONE card face up. No hole card!',
    action: 'deal',
    highlight: 'cards'
  },
  {
    id: 'european-no-hole-card',
    title: 'No Hole Card Strategy Impact',
    content: 'This is crucial! The dealer doesn\'t get a second card until after you play. This means no blackjack peek, changing optimal strategy against Ace/10.'
  },
  {
    id: 'european-your-decisions',
    title: 'European Decision Making',
    content: 'Make your move! Be more cautious doubling/splitting against dealer Ace or 10 since they might draw blackjack after you risk extra chips.',
    action: 'hit',
    highlight: 'actions'
  },
  {
    id: 'european-no-insurance',
    title: 'No Insurance Here',
    content: 'IMPORTANT: European rules have NO insurance bets. Even when dealer shows Ace, no insurance option appears because there\'s no hole card to check.'
  },
  {
    id: 'european-dealer-advantage',
    title: 'Dealer Stands Soft 17',
    content: 'PLAYER ADVANTAGE: When dealer gets Ace+6 (soft 17), they must stand. This is better for you than Vegas rules where dealer hits soft 17.'
  },
  {
    id: 'european-splits-rules',
    title: 'European Splitting Rules',
    content: 'Splitting works normally: double after split allowed, resplit to 4 hands, but no resplitting Aces. Same as Vegas for splits.'
  },
  {
    id: 'european-complete',
    title: 'European Rules Mastered!',
    content: 'You\'ve mastered European blackjack! Key differences: no hole card (dealer gets 2nd card after you), stands soft 17, no insurance. More strategic!'
  }
]

// Atlantic City Rules Tutorial Steps
export const ATLANTIC_CITY_TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 'atlantic-welcome',
    title: 'Welcome to Atlantic City Blackjack',
    content: 'Welcome to Atlantic City blackjack - the most player-friendly variant! Features: late surrender, resplit Aces, dealer stands soft 17, hole card with peek.'
  },
  {
    id: 'atlantic-betting',
    title: 'Place Your Atlantic City Bet',
    content: 'Start by betting. Atlantic City uses 8 decks and offers the best player advantages of any major variant.',
    action: 'bet',
    highlight: 'chips'
  },
  {
    id: 'atlantic-dealing',
    title: 'Atlantic City Deal Style',
    content: 'Cards dealt normally: 2 face up for you, 1 up + 1 hole card for dealer. Like Vegas but with better rules for you!',
    action: 'deal', 
    highlight: 'cards'
  },
  {
    id: 'atlantic-soft17-stands',
    title: 'Dealer Stands Soft 17',
    content: 'PLAYER ADVANTAGE: Dealer stands on soft 17 (Ace+6). Unlike Vegas where dealer hits, this reduces house edge in your favor!'
  },
  {
    id: 'atlantic-surrender-option',
    title: 'Late Surrender Available!',
    content: 'HUGE ADVANTAGE: You can surrender after seeing dealer\'s upcard! Give up half your bet with terrible hands like 16 vs 10. Look for Surrender button.',
    highlight: 'actions'
  },
  {
    id: 'atlantic-your-turn',
    title: 'Atlantic City Decisions',
    content: 'Make your move! You have all standard options PLUS surrender when things look bad. Try hitting, standing, or surrender if available.',
    action: 'hit',
    highlight: 'actions'
  },
  {
    id: 'atlantic-resplit-aces',
    title: 'Resplit Aces Allowed!',
    content: 'UNIQUE ADVANTAGE: Atlantic City lets you resplit Aces! If you split Aces and get another Ace, you can split again. This is rare and valuable.'
  },
  {
    id: 'atlantic-when-surrender',
    title: 'Smart Surrender Strategy',
    content: 'Surrender these losing situations: Hard 16 vs dealer 9/10/A, Hard 15 vs dealer 10. You save money on hopeless hands!'
  },
  {
    id: 'atlantic-complete',
    title: 'Atlantic City Rules Mastered!',
    content: 'You\'ve mastered the best blackjack variant! Remember: surrender available, stands soft 17, resplit Aces OK, hole card peek. Lowest house edge!'
  }
]

// Consolidated variant tutorial steps
export const VARIANT_TUTORIAL_STEPS: VariantTutorialSteps = {
  vegas: VEGAS_TUTORIAL_STEPS,
  european: EUROPEAN_TUTORIAL_STEPS,
  atlantic_city: ATLANTIC_CITY_TUTORIAL_STEPS
}