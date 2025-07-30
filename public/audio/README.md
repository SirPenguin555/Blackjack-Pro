# Audio Files

This directory contains the audio files for Blackjack Pro.

## Required Files

To enable background music, add the following audio file:

- `casino-ambient.mp3` - Main casino background music track

## Audio File Requirements

- **Format**: MP3 (recommended for best browser compatibility)
- **Quality**: 128kbps or higher for good quality
- **Length**: 2-5 minutes (will loop automatically)
- **Content**: Ambient casino sounds, light jazz, or instrumental music
- **Volume**: Pre-normalized to avoid sudden volume spikes

## Alternative Formats

For better browser compatibility, you can also provide:
- `casino-ambient.ogg` - OGG Vorbis format (fallback for Firefox)

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

## Note

The audio system is designed to gracefully handle missing audio files. If no audio files are present, the game will still function normally with audio controls disabled.