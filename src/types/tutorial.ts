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