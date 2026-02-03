# Sudoki

Sudoki is a modern, multiplayer Sudoku web application built with Next.js 16, React 19, and TypeScript. Play solo or compete with others in real-time multiplayer matches!

Created by [Dylan Almond](https://dylanalmond.net/work/sudoki), this project represents the evolution of a simple Sudoku game into a full-featured multiplayer experience with real-time synchronization and competitive gameplay.

## Features

- **Interactive Sudoku Gameplay** - Classic Sudoku with intuitive controls and drag-and-drop support
- **Multiplayer Mode** - Real-time matches with other players
- **Random Board Generation** - Endless variety of puzzles with different difficulty levels
- **Daily Puzzles** - Fresh challenges every day
- **Scoring System** - Track your performance and compete with others
- **Hint System** - Get help when you're stuck
- **Lives System** - Challenge yourself with limited mistakes
- **Firebase Authentication** - Secure user authentication and email sign-in
- **User Statistics** - Track your progress and performance over time
- **Responsive Design** - Works seamlessly on desktop and mobile devices
- **Sound Effects** - Engaging audio feedback for game actions
- **Real-time Sync** - Live game state synchronization across players
- **Dark Mode** - Choose between light and dark themes

## Tech Stack

- **Frontend**: Next.js 16.1.5, React 19.2.0, TypeScript 5
- **Backend**: Firebase (Authentication & Firestore)
- **Testing**: Jest 30.2.0 with React Testing Library
- **Styling**: CSS Modules
- **Package Manager**: Yarn 4.12.0 (via Corepack)
- **Deployment**: Firebase App Hosting

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

Sudoki is created by Dylan Almond, a full-stack developer. This project represents the evolution of a simple web-based Sudoku game into a comprehensive multiplayer experience with real-time synchronization and competitive features.

For more information about the creator and other projects, visit [dylanalmond.net](https://dylanalmond.net/work/sudoki).

## License

This project is private and proprietary.

## Support

For bug reports or feature requests, please open an issue on the GitHub repository.
