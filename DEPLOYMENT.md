# Deployment Configuration

This file contains deployment configuration for various hosting platforms.

## Firebase Configuration

The app is configured to work with the following Firebase project:
- Project ID: `blackjack-pro-555`
- API Key: `AIzaSyBWAK1PJIX9J6xNRpNPGu5ZJc0bpBvzDsQ`

## Environment Variables

If your hosting platform supports environment variables, add:

```
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyBWAK1PJIX9J6xNRpNPGu5ZJc0bpBvzDsQ
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=blackjack-pro-555.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=blackjack-pro-555
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=blackjack-pro-555.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=5499124659
NEXT_PUBLIC_FIREBASE_APP_ID=1:5499124659:web:963654c8101c65a68aa9c6
```

## Platform-Specific Instructions

### Vercel
1. Go to your project settings
2. Add the environment variables above in the "Environment Variables" section
3. Redeploy

### Netlify
1. Go to Site settings > Environment variables
2. Add each variable from the list above
3. Redeploy

### Firebase Hosting
1. Run `firebase deploy` with the included firebase.json configuration

### GitHub Pages
Environment variables are not supported. The app will use the fallback values embedded in the code.

## Note
The Firebase configuration values are public and safe to include in client-side code.