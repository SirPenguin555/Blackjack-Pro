# Blackjack Pro

A comprehensive, casino-style blackjack web application featuring authentic casino rules, interactive tutorials, and progressive gameplay. Built with Next.js, TypeScript, and Supabase.

## For Players

### 🎮 Game Features

- **Authentic Casino Rules**: True casino blackjack with proper dealer behavior, insurance, splitting, doubling down, and surrender options
- **Multiple Variants**: Vegas, European, and Atlantic City rule variations
- **Interactive Tutorials**: Step-by-step guidance for each game variant
- **Progressive Unlocking**: Unlock new tables and variants as you improve
- **Strategy Guidance**: Real-time hints and basic strategy recommendations
- **Account System**: Save your progress, statistics, and achievements
- **Multiplayer Mode**: Play with friends at private or public tables
- **Complete Audio**: Immersive casino sounds and dynamic background music

### 🎯 Game Modes

- **Single Player**: Practice with authentic casino rules
- **Easy Mode**: Beginner-friendly with hints and strategy suggestions
- **Multiplayer**: Join or host tables with up to 4 players
- **Tutorial Mode**: Learn the rules for each blackjack variant

### 📊 Features

- **Statistics Tracking**: Comprehensive gameplay analytics
- **Achievement System**: Unlock achievements as you play
- **Save/Load System**: Export/import your progress with codes
- **Responsive Design**: Play on desktop, tablet, or mobile
- **Table Progression**: Start with low stakes and work your way up

### 🚀 Getting Started

1. Visit the application in your web browser
2. Play instantly as a guest or create an account to save progress
3. Start with the tutorial to learn the basics
4. Practice in single-player mode
5. Join multiplayer tables when you're ready

## For Developers

### 🛠 Tech Stack

- **Frontend**: Next.js 15, React 18, TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Audio**: Web Audio API
- **Testing**: Vitest, React Testing Library
- **Deployment**: Vercel (recommended)

### 📦 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/SirPenguin555/Blackjack-Pro.git
   cd Blackjack-Pro
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env.local` file:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   NEXT_PUBLIC_DEMO_MODE=false
   ```

4. **Set up Supabase database**
   - Create a new Supabase project
   - Run the migrations in the `supabase/migrations/` directory
   - Enable Row Level Security (RLS) for all tables

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open [http://localhost:3000](http://localhost:3000)**

### 🗃️ Database Schema

The application uses Supabase with the following main tables:

- `user_profiles`: User account information and preferences
- `user_game_data`: Game statistics and progression data
- `tables`: Multiplayer table information
- `game_states`: Real-time multiplayer game state

Run the migrations in `supabase/migrations/` to set up the complete schema.

### 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### 🚀 Deployment

#### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Add environment variables in the Vercel dashboard
3. Deploy automatically on push to main branch

#### Manual Deployment
```bash
# Build the application
npm run build

# Start the production server
npm start
```

### 📁 Project Structure

```
src/
├── app/                    # Next.js app router pages
├── components/             # React components
│   ├── auth/              # Authentication components
│   └── ...
├── hooks/                  # Custom React hooks
├── lib/                    # Core game logic and utilities
│   ├── supabase/          # Supabase client and services
│   ├── audio/             # Audio management
│   └── ...
├── store/                  # Zustand state management
└── types/                  # TypeScript type definitions
```

### 🎵 Audio Assets

The application includes a complete audio system with:
- Background music (casino ambient, chill, tense, victory)
- Sound effects (card dealing, chip sounds, win/loss notifications)
- Dynamic music that responds to game tension

Audio files are stored in `public/audio/` and managed by the AudioManager service.

### 🔧 Configuration

Key configuration files:
- `src/lib/tableSystem.ts`: Table levels and unlock requirements
- `src/lib/ruleVariations.ts`: Game variant rules and configurations
- `src/lib/achievementSystem.ts`: Achievement definitions and logic
- `src/lib/supabase/config.ts`: Database configuration

### 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

Please ensure all tests pass and follow the existing code style.

### 🐛 Debugging

For development debugging:
- Enable demo mode: Set `NEXT_PUBLIC_DEMO_MODE=true` in `.env.local`
- Check browser console for detailed logging
- Use React DevTools for component inspection
- Monitor network requests for Supabase queries

### 📋 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | Yes |
| `NEXT_PUBLIC_DEMO_MODE` | Enable demo mode (true/false) | No |

### 🏗️ Architecture

The application follows these key architectural patterns:

- **Component Architecture**: Modular React components with clear separation of concerns
- **State Management**: Zustand stores for game state and multiplayer coordination
- **Service Layer**: Dedicated services for audio, authentication, and game logic
- **Real-time Updates**: Supabase subscriptions for multiplayer synchronization
- **Progressive Enhancement**: Works offline in single-player mode

## License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Inspired by authentic casino blackjack rules and procedures
- Built with modern web technologies for optimal performance
- Designed for both entertainment and educational purposes

---

**Version**: 1.3  
**Last Updated**: August 2025