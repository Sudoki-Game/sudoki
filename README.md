# Sudoki

Sudoki is a web-based Sudoku game built around a **single daily puzzle** that everyone plays. Built with Next.js 16, React 19, and TypeScript, it features a risk/reward scoring system where players earn points for valid placements while lives limit mistakes. Daily streak bonuses reward persistence, encouraging players to return while staying competitive.

Created by [Dylan Almond](https://dylanalmond.net/work/sudoki), Sudoki delivers a daily puzzle experience that's challenging and encouraging—balancing tension through scoring mechanics with positive reinforcement via streaks and shared competition.

**Play now at [sudoki.uk](https://sudoki.uk/)**

## Overview

Many Sudoku apps overwhelm users with clutter, endless modes, or harsh penalties for mistakes. Sudoki solves this by focusing on a **single daily puzzle** that all players tackle together—creating consistent difficulty and fair competition without punishment.

### The Problem

Players need a Sudoku experience that is **challenging but fair**, rewarding effort and persistence while keeping them engaged and motivated to return daily—without overwhelming complexity or harsh mistake penalties.

### The Solution

Sudoki balances challenge and encouragement through a **risk/reward scoring system**:

- Every valid placement increases your score
- Invalid placements **cost a life and reduce your score**
- Players can continue solving as long as they have lives
- Daily **streak bonuses** reward consistency and habit formation

Because the **daily puzzle is the same for everyone**, difficulty remains consistent, letting players compete fairly while staying motivated to improve their scores and maintain streaks.

## Features

### Core Gameplay

- **Single Daily Puzzle** - Everyone plays the same puzzle each day for fair competition
- **Risk/Reward Scoring** - Earn points for valid placements, lose points and lives for mistakes
- **Lives System** - Limited mistakes create tension while allowing recovery
- **Daily Streak Bonuses** - Reward consistency and encourage daily engagement
- **Persistent Progress** - Continue playing as long as you have lives remaining

### Design & Experience

- **Minimal, Focused Interface** - Clean design with the puzzle grid dominating the screen
- **Responsive Design** - Seamless experience on desktop and mobile devices
- **Multi-Input Support** - Touch, keyboard, and mouse controls for accessibility
- **Drag-and-Drop Gameplay** - Intuitive controls for placing values
- **Clear Feedback** - Unobtrusive visual feedback for invalid placements
- **Sound Effects** - Engaging audio feedback for game actions

### Technical Excellence

- **Server-Side Match Validation** - Anti-cheat system ensures fair, accurate scores
- **Offline Data Syncing** - Link existing progress to new accounts without losing streaks
- **Firebase Authentication** - Secure user authentication and account management
- **Real-Time Leaderboards** - Compare your performance with players worldwide
- **User Statistics** - Track your progress, streaks, and performance over time

## Tech Stack

- **Frontend**: Next.js 16.1.5, React 19.2.0, TypeScript 5
- **Backend**: Firebase (Authentication & Firestore)
- **Testing**: Jest 30.2.0 with React Testing Library
- **Styling**: CSS Modules
- **Package Manager**: Yarn 4.12.0 (via Corepack)
- **Deployment**: Firebase App Hosting

## Design Philosophy

The interface is **minimal and focused**. The puzzle grid dominates the screen, ensuring players can concentrate on gameplay. Feedback for invalid placements is clear but unobtrusive, maintaining flow without frustration.

By combining **score, lives, and streak bonuses**, Sudoki encourages persistence, habit formation, and friendly competition—without clutter or overwhelming complexity. The shared daily puzzle creates a sense of community and fair competition, as everyone faces the same challenge.

## Prerequisites

- **Node.js**: v20.x or higher
- **Corepack**: Required for Yarn 4.12.0 support

## Getting Started

### 1. Enable Corepack

This project uses Yarn 4.12.0, which requires Corepack:

```bash
corepack enable
```

### 2. Install Dependencies

```bash
yarn install
```

### 3. Configure Environment Variables

Copy the example environment file and fill in your Firebase configuration:

```bash
cp .env.example .env.local
```

Edit `.env.local` and add your Firebase project credentials:

```env
# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id

# HMAC Secret for data signing
NEXT_PUBLIC_HMAC_SECRET=your_hmac_secret

# Bug reporting (optional)
EMAIL_HOST=your_email_host
EMAIL_USER=your_email_user
EMAIL_PASS=your_email_password
BUG_REPORT_TO=your_bug_report_email
```

### 4. Run the Development Server

```bash
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## Available Scripts

### Development

- `yarn dev` - Start the development server (runs on http://localhost:3000)
- `yarn build` - Build the application for production
- `yarn start` - Start the production server

### Code Quality

- `yarn lint` - Run ESLint and TypeScript type checking
- `yarn prettier` - Format code with Prettier
- `yarn test` - Run all tests
- `yarn test:watch` - Run tests in watch mode
- `yarn test:coverage` - Generate test coverage report

## Project Structure

```
/src
├── app/              # Next.js App Router pages and layouts
│   ├── (auth)/       # Auth-protected routes
│   ├── actions/      # Server actions
│   ├── login/        # Login page
│   └── privacy/      # Privacy policy
├── auth/             # Authentication module
├── firebase/         # Firebase configuration
├── game/             # Sudoku game logic and components
├── match/            # Multiplayer match functionality
├── user/             # User data management
└── ui/               # Reusable UI components
```

## Firebase Configuration

The application uses Firebase for:

- **Authentication**: Email/password and email link sign-in
- **Firestore Database**: User data, game state, and match information
- **App Hosting**: Deployment platform

### Firestore Security Rules

Security rules are defined in `firestore.rules` and deployed with the application.

## Testing

The project includes comprehensive tests for core functionality:

```bash
# Run all tests
yarn test

# Run tests in watch mode for development
yarn test:watch

# Generate coverage report
yarn test:coverage
```

Tests are located in `__tests__/` directories alongside the code they test.

## Deployment

This application is deployed via Firebase App Hosting. The configuration is defined in:

- `firebase.json` - Firebase project configuration
- `apphosting.yaml` - App Hosting specific settings
- `firestore.rules` - Firestore security rules
- `firestore.indexes.json` - Firestore index definitions

To deploy:

1. Install Firebase CLI: `npm install -g firebase-tools`
2. Login: `firebase login`
3. Deploy: `firebase deploy`

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make your changes
4. Run tests: `yarn test`
5. Run linter: `yarn lint`
6. Format code: `yarn prettier`
7. Commit your changes: `git commit -am 'Add new feature'`
8. Push to the branch: `git push origin feature/my-feature`
9. Submit a pull request

## About the Project

Sudoki is created by Dylan Almond, a full-stack developer. The game delivers a **daily puzzle experience that's challenging and encouraging**—creating tension through the risk/reward mechanic while promoting engagement via streaks and positive scoring.

The shared daily puzzle ensures **consistent difficulty**, making competition fair and motivating players to return daily to improve scores and maintain streaks. For more information about the creator and other projects, visit [dylanalmond.net](https://dylanalmond.net/work/sudoki).

## Future Enhancements

Planned features for future iterations include:

- **Difficulty Tiers** - Challenge advanced players with harder puzzles
- **Extended Progression** - Personalized scoring and achievement systems
- **Optional Notifications** - Reminders to increase daily engagement
- **Social Features** - Friend challenges or cooperative puzzle modes
- **Enhanced Statistics** - Deeper analytics and performance tracking

## License

This project is private and proprietary.

## Support

For bug reports or feature requests, please open an issue on the GitHub repository.
