# Technical Stack

> Last Updated: 2025-07-29
> Version: 2.0.0

## Application Framework
- **Framework:** Next.js
- **Version:** 14+ (App Router)
- **Language:** TypeScript
- **Type Checking:** Strict mode enabled

## Database System
- **Primary:** Firestore
- **Type:** NoSQL Document Database
- **Real-time:** Yes for multiplayer features
- **Offline Support:** Yes for single-player modes

## JavaScript Framework
- **Framework:** React
- **Version:** Latest stable
- **Build Tool:** Next.js built-in (Turbopack)

## Import Strategy
- **Strategy:** ES Modules
- **Package Manager:** npm
- **Node Version:** 20 LTS or 22 LTS

## CSS Framework
- **Framework:** TailwindCSS
- **Version:** 4.0+
- **PostCSS:** Yes

## UI Component Library
- **Library:** Tailwind Plus (Tailwind UI)
- **Design System:** Catalyst UI Kit
- **Implementation:** React components
- **Customization:** Tailwind config

## State Management
- **Library:** Zustand
- **Purpose:** Client-side game state management
- **Use Cases:** Game logic, player actions, UI state

## Data Fetching & Server State
- **Library:** TanStack Query (React Query)
- **Purpose:** Server state management
- **Features:** Caching, synchronization, background refetching
- **Integration:** Firestore real-time listeners for multiplayer

## Fonts Provider
- **Provider:** Google Fonts
- **Loading Strategy:** Next.js Font Optimization
- **Fallback:** System font stack

## Icon Library
- **Library:** Phosphor Icons
- **Implementation:** @phosphor-icons/react
- **Default Weight:** Regular
- **Available Weights:** 6 variants (thin, light, regular, bold, fill, duotone)

## Application Hosting
- **Platform:** Firebase App Hosting
- **Integration:** GitHub deployments
- **Previews:** Automatic PR previews
- **Rollbacks:** One-click rollbacks

## Database Hosting
- **Service:** Firestore
- **Structure:** Collections & Documents
- **Security:** Security Rules
- **Indexing:** Automatic & composite

## Asset Hosting
- **Service:** Firebase Cloud Storage
- **CDN:** Global edge caching
- **Processing:** Next.js Image Component optimization

## Deployment Solution
- **CI/CD:** GitHub Actions
- **Integration:** Firebase CLI
- **Environments:** Production, Staging, Development
- **Preview Deployments:** Automatic for PRs

## Authentication
- **Service:** Firebase Authentication
- **Providers:** Email, Google (for save/load and multiplayer)
- **Sessions:** JWT tokens
- **Use Case:** Optional for progress saving and multiplayer features

## Code Repository
- **Platform:** GitHub
- **URL:** To be configured during project setup
- **Branching:** GitHub Flow
- **Protection:** Main branch protected