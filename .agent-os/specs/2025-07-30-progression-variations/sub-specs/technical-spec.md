# Technical Specification

This is the technical specification for the spec detailed in @.agent-os/specs/2025-07-30-progression-variations/spec.md

> Created: 2025-07-30
> Version: 1.0.0

## Technical Requirements

- Extend existing Zustand game store to include player progression data (level, unlocked tables, statistics)
- Create configurable rule engine that can switch between Vegas, European, and Atlantic City blackjack variants
- Implement progressive table system with distinct betting limits, visual themes, and unlock logic
- Build comprehensive statistics tracking system with persistence via localStorage and optional Firestore sync
- Design achievement system with badge graphics and progress tracking
- Update existing strategy engine to provide optimal advice for each rule variation
- Enhance UI to display progression status, achievements, and detailed statistics

## Approach Options

**Option A: Monolithic Progression System**
- Pros: Simpler architecture, single source of truth for progression data
- Cons: Tight coupling between features, harder to maintain individual components

**Option B: Modular Component Architecture** (Selected)
- Pros: Clean separation of concerns, reusable components, easier testing and maintenance
- Cons: More initial setup, requires careful interface design between modules

**Option C: Database-First Approach**
- Pros: Centralized data management, easier multiplayer integration later
- Cons: Adds unnecessary complexity for single-player focused features

**Rationale:** Option B provides the best balance of maintainability and flexibility. The modular approach allows each progression system (tables, variations, achievements) to be developed and tested independently while maintaining clean interfaces. This aligns with the existing codebase architecture and prepares for future Phase 5 features.

## External Dependencies

- **react-spring** - Enhanced animations for table transitions and achievement celebrations
- **Justification:** The progression system requires smooth visual transitions between table levels and celebratory animations for achievements. React-spring provides performant, physics-based animations that integrate well with React components.

- **date-fns** - Advanced date handling for statistics time ranges and achievement tracking
- **Justification:** The statistics system needs sophisticated date calculations for weekly/monthly analytics and time-based achievements. Date-fns provides reliable utilities without the bundle size of moment.js.

## Implementation Architecture

### Progressive Table System
- `TableLevel` enum with five tiers (Beginner, Bronze, Silver, Gold, Diamond)
- `ProgressionService` class managing unlock logic and requirements
- `TableTheme` components providing distinct visual atmospheres
- Integration with existing betting system for dynamic limit enforcement

### Rule Variations Engine
- `RuleSet` interface defining blackjack variant parameters
- `VariationEngine` class implementing rule-specific game logic
- Extension of existing strategy engine for variation-specific advice
- Rule selection UI integrated with table selection

### Statistics & Achievement System
- `StatsTracker` service for real-time performance monitoring
- `AchievementEngine` with milestone definitions and progress tracking
- Persistent storage layer with localStorage primary, Firestore optional
- Dashboard components for detailed analytics visualization