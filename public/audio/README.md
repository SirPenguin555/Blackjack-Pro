# Audio Files

This directory contains the audio files for Blackjack Pro.

## Required Files

To enable background music, add the following audio file:

- `casino-ambient.mp3` - Main casino background music track

To enable sound effects, add the following audio files:

### Card Sounds
- `card-deal.mp3` - Card dealing sound
- `card-flip.mp3` - Card flip/reveal sound

### Chip Sounds  
- `chip-place.mp3` - Placing bet sound
- `chip-stack.mp3` - Chip stacking sound
- `chip-collect.mp3` - Collecting winnings sound

### Outcome Sounds
- `win.mp3` - Regular win sound
- `lose.mp3` - Loss sound  
- `blackjack.mp3` - Blackjack win sound
- `push.mp3` - Push/tie sound
- `bust.mp3` - Player bust sound

## Audio File Requirements

- **Format**: MP3 (recommended for best browser compatibility)
- **Quality**: 128kbps or higher for good quality
- **Length**: 2-5 minutes (will loop automatically)
- **Content**: Ambient casino sounds, light jazz, or instrumental music
- **Volume**: Pre-normalized to avoid sudden volume spikes

## Alternative Formats

For better browser compatibility, you can also provide:
- `casino-ambient.ogg` - OGG Vorbis format (fallback for Firefox)

## Dynamic Music System

The game features a dynamic music system that adjusts volume based on game state and tension levels. The system currently uses:

- `casino-ambient.mp3` - Main casino background music (required)

### Enhanced Dynamic Music (Optional)

For a more immersive experience, you can add these additional tracks:

- `casino-tense.mp3` - For high-stakes moments and close hands
- `casino-victory.mp3` - For big wins and blackjack celebrations  
- `casino-chill.mp3` - For casual gameplay and low-stress moments

These tracks would be automatically selected based on game context and player hand values.

## Adding New Tracks

To add more background music tracks:

1. Add audio files to this directory
2. Update the `CASINO_TRACKS` array in `src/hooks/useAudio.ts`
3. Add corresponding entries with unique IDs and proper file paths

## Audio Sources

Some sources for royalty-free casino/ambient music:
- Freesound.org
- Zapsplat.com
- Adobe Stock Audio
- YouTube Audio Library
- Incompetech.com

## Sound Effects Integration

The game includes comprehensive sound effects that are triggered automatically during gameplay:

### Card Sounds
- **Card Deal**: Played when dealing initial cards or hitting
- **Card Flip**: Played when dealer reveals hole card

### Chip Sounds  
- **Chip Place**: Played when placing bets
- **Chip Stack**: Played when receiving loans
- **Chip Collect**: Played after winning hands

### Outcome Sounds
- **Win**: Regular win sound
- **Blackjack**: Special blackjack win sound  
- **Push**: Tie/push sound
- **Lose**: Loss sound
- **Bust**: Player bust sound

All sound effects are played automatically based on game events and respect the user's sound effects volume and mute preferences.

## Note

The audio system is designed to gracefully handle missing audio files. If no audio files are present, the game will still function normally with audio controls disabled.