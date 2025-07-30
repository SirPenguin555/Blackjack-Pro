# Multiplayer Setup Guide

Blackjack Pro includes multiplayer functionality using Firebase. This is **optional** - the game works perfectly as a single-player experience without any setup.

## Quick Start (No Setup Required)

The game works immediately in single-player mode with all features:
- ✅ Classic blackjack gameplay
- ✅ Tutorial mode
- ✅ Easy mode with strategy hints  
- ✅ Background music and sound effects
- ✅ Statistics tracking
- ✅ All game variations

## Enabling Multiplayer (Optional)

To enable multiplayer features, you have two options:

### Option 1: Firebase Emulators (Recommended for Development)

1. Install Firebase CLI:
   ```bash
   npm install -g firebase-tools
   ```

2. Start the emulators:
   ```bash
   firebase emulators:start
   ```

3. Set environment variable:
   ```bash
   # Create .env.local file
   echo "NEXT_PUBLIC_USE_FIREBASE_EMULATORS=true" > .env.local
   ```

4. Restart your development server

### Option 2: Firebase Project (Production)

1. Create a Firebase project at https://console.firebase.google.com
2. Enable Authentication and Firestore
3. Copy your config values to `.env.local`:
   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
   NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef123456
   ```

## Multiplayer Features

Once configured, multiplayer includes:
- 🎮 **Create Tables** - Host games with custom settings
- 👥 **Join Tables** - Join existing multiplayer games  
- 💬 **Chat System** - Communicate with other players
- 🔄 **Real-time Sync** - Live game state updates
- 🔒 **Private Tables** - Password-protected games

## Troubleshooting

### "Multiplayer Not Available" Error
This means Firebase isn't configured. You can:
- Continue enjoying single-player mode (no setup needed)
- Or follow the setup steps above to enable multiplayer

### Network Request Failed
- Check if Firebase emulators are running (`firebase emulators:start`)
- Verify your Firebase project configuration
- Ensure you have internet connectivity for Firebase services

## Architecture

The multiplayer system uses:
- **Firebase Authentication** - Anonymous user authentication
- **Firestore** - Real-time game state synchronization  
- **Zustand** - Client-side state management
- **React** - Real-time UI updates

All multiplayer code is isolated and doesn't affect single-player functionality.