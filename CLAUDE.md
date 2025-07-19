# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

SuperInu River is a Farcaster Mini App game where players control SuperInu to collect SuperFluid tokens while navigating a river. Built with React, TypeScript, and Vite, it integrates with the Farcaster ecosystem through the Frame SDK and features real-time token data from the Streme.fun API.

## Core Architecture

### Tech Stack
- **Frontend Framework**: React 19.1.0 with TypeScript
- **Build Tool**: Vite 6.3.5
- **Animations**: Framer Motion 12.19.1
- **Farcaster Integration**: @farcaster/frame-sdk for mini app capabilities
- **External APIs**: Streme.fun API for real-time token data
- **Deployment**: Netlify with serverless functions

### Key Services

1. **Token Service** (`src/services/tokenService.ts`)
   - Fetches trending tokens from Streme.fun API
   - Caches token data for 5 minutes
   - Provides fallback tokens if API fails
   - Calculates token values based on market data

2. **Leaderboard Service** (`src/services/serverLeaderboard.ts`)
   - Manages score submissions and rankings
   - Server-side persistence via Netlify Functions
   - Local fallback storage for offline capability
   - Farcaster user validation

3. **Farcaster Hook** (`src/hooks/useFarcaster.ts`)
   - Integrates with Farcaster Frame SDK
   - Retrieves user context (fid, username, displayName, pfpUrl)
   - Handles authentication state

### Game Architecture

The main game component (`src/components/StremeGame.tsx`) manages:
- Game state (score, lives, level, tokens collected)
- Character movement with tap-to-move controls
- Token spawning and collision detection
- Real-time token collection popups
- Integration with leaderboard and sharing features

## Development Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Lint code
npm run lint

# Preview production build
npm run preview
```

## Environment Configuration

Create a `.env` file with:
```
VITE_NEYNAR_API_KEY=your_api_key_here
VITE_NEYNAR_CLIENT_ID=your_client_id_here
```

These are used for enhanced Farcaster functionality (optional - app works without them).

## Key Development Patterns

### State Management
- Uses React hooks (useState, useEffect, useCallback) for local state
- No global state management library - component-level state is sufficient
- Game stats are passed to parent via callback props

### API Integration
- Token data fetched from `https://api.streme.fun/api/tokens/trending`
- Implements caching to reduce API calls
- Graceful fallback to hardcoded tokens on API failure

### Mobile-First Design
- Touch controls for character movement
- Responsive layout capped at 424px width
- Optimized for Farcaster Mini App viewport

### Performance Considerations
- Uses requestAnimationFrame for smooth game loop
- Implements token pooling to reduce garbage collection
- Lazy loads images with fallback emojis

## Deployment

The app is deployed on Netlify with:
- Automatic builds from git commits
- Serverless functions for leaderboard API
- Environment variables configured in Netlify dashboard

### Netlify Functions
- `netlify/functions/leaderboard.ts` handles score persistence
- In-memory storage (should be replaced with database for production)
- CORS headers configured for cross-origin requests

## Testing Locally

1. The game can be tested in browser without Farcaster context
2. Farcaster-specific features (user info, leaderboard submission) require running inside a Farcaster Frame
3. Use the share buttons to test embed functionality with different states

## Common Issues

1. **Token images not loading**: The API may return invalid image URLs. The app falls back to SuperInu image.
2. **Leaderboard submission fails**: Only real Farcaster users (fid < 888888) can submit scores.
3. **Touch controls not working**: Ensure the game is in playing state and not showing menus.