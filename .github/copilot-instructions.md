# Sudoki Repository - Copilot Coding Agent Instructions

## Repository Overview

Sudoki is a modern, multiplayer Sudoku web application built with Next.js 16.1.5, React 19, and TypeScript. The project uses Firebase for authentication and data storage, and is deployed via Firebase App Hosting. The codebase contains ~78 TypeScript/TSX files with ~10,600 lines of code across a well-organized modular architecture.

**Key Technologies:**

- **Framework:** Next.js 16.1.5 with React 19.2.0 and Turbopack
- **Language:** TypeScript 5
- **Package Manager:** Yarn 4.12.0 (requires Corepack)
- **Backend:** Firebase (Auth, Firestore)
- **Testing:** Jest 30.2.0 with React Testing Library
- **Linting:** ESLint 9 with Next.js config
- **Formatting:** Prettier 3.7.4
- **Build Tools:** ts-jest, babel-plugin-react-compiler

## Build and Validation Instructions

### Initial Setup (Required for Fresh Environment)

**CRITICAL:** This project requires Corepack to be enabled before running any yarn commands:

```bash
corepack enable
yarn install
```

**Without `corepack enable`, yarn will fail** with an error about packageManager version mismatch.

### Environment Configuration

The application requires Firebase configuration to build successfully. For local development or CI:

1. Copy `.env.example` to `.env.local`:

   ```bash
   cp .env.example .env.local
   ```

2. Fill in the Firebase configuration values (or use placeholder values like "xxxxxx" for CI builds where Firebase isn't needed).

**Without a `.env.local` file, the build will fail** with Firebase API key errors during the build/export phase.

### Build Commands

```bash
# Install dependencies (always run first after clone or package.json changes)
corepack enable  # Required once per environment
yarn install     # Takes ~30s, downloads ~579 MB

# Lint / Typecheck
yarn lint        # ESLint checks
yarn typecheck   # TypeScript checks

# Run tests (includes 200+ tests across 9 test suites)
yarn test        # Takes ~3s, all tests should pass
yarn test:ci     # CI mode, deterministic
yarn test:watch  # Run tests in watch mode
yarn test:coverage  # Generate coverage report

# Combined quality checks
yarn validate

# Build for production
yarn build       # Takes ~30s, requires .env.local file

# Development server
yarn dev         # Starts on http://localhost:3000
yarn start       # Run production build
```

### Command Order and Dependencies

1. **Always enable Corepack first:** `corepack enable`
2. **Always install dependencies after cloning:** `yarn install`
3. **Always create `.env.local` before building:** `cp .env.example .env.local`
4. **Run lint and typecheck before build:** `yarn lint && yarn typecheck`
5. **Run tests after code changes:** `yarn test:ci`
6. **Run full validation before push:** `yarn validate`

### Common Issues and Workarounds

**Issue:** `yarn` command fails with "packageManager" version mismatch
**Solution:** Run `corepack enable` first

**Issue:** Build fails with "Firebase: Error (auth/invalid-api-key)"
**Solution:** Ensure `.env.local` exists with Firebase config (even placeholder values work for build)

**Issue:** Tests fail with "ts-node is required"
**Solution:** Add `ts-node` to devDependencies with `yarn add -D ts-node` (this is a known missing dependency in the project)

**Issue:** Style consistency concerns during cleanup
**Solution:** Run `yarn lint` and address ESLint/TypeScript findings; Prettier remains supported in the repo but is intentionally not run in this cleanup stream to avoid large formatting-only diffs

## Project Architecture

### Directory Structure

```
/src
├── app/              # Next.js App Router pages and layouts
│   ├── (auth)/       # Auth-protected routes group
│   │   └── onboarding/
│   ├── actions/      # Server actions (auth, match, puzzle, reportBug, user)
│   ├── finishSignIn/ # Email link sign-in completion
│   ├── login/        # Login page
│   └── privacy/      # Privacy policy
├── auth/             # Authentication module
│   ├── components/   # LoginForm, OnboardingForm
│   ├── context/      # AuthContext
│   ├── lib/          # Firebase auth helpers, server-side auth
│   └── types.ts
├── firebase/         # Firebase configuration
│   ├── client.ts     # Client-side Firebase initialization
│   ├── server.ts     # Server-side Firebase Admin SDK
│   └── firestore.ts  # Firestore helpers
├── game/             # Core Sudoku game module
│   ├── components/   # Game UI (Sudoku, BoardCell, SudokuGrid, etc.)
│   │   └── modal/    # Modal components (GameOver, Settings, Solution, etc.)
│   ├── context/      # SudokuGameContext, ModalRouterContext
│   ├── hooks/        # useSudokuControls
│   ├── lib/          # Game logic, sound
│   ├── types/        # Game type definitions
│   └── util/         # Game utilities, daily puzzle logic
├── match/            # Multiplayer match functionality
│   ├── lib/          # Match client/server logic, encoding, validation, sync
│   │   └── __tests__/
│   └── types.ts
├── user/             # User data management
│   ├── lib/          # User client/server logic, stats, sync
│   │   └── __tests__/
│   └── types.ts
├── ui/               # Reusable UI components
│   └── components/   # Button, Form, Input, Label, Select, Textarea, Copyright
└── types/            # Global type definitions (CSS modules, etc.)
```

### Key Configuration Files

- **package.json:** Scripts and dependencies (packageManager: "yarn@4.12.0")
- **tsconfig.json:** TypeScript config with path aliases (`@/*` → `./src/*`)
- **next.config.ts:** Next.js config (reactCompiler enabled)
- **eslint.config.mjs:** ESLint config using Next.js presets
- **jest.config.ts:** Jest config with jsdom environment
- **jest.setup.ts:** Jest setup file for Testing Library
- **.prettierrc:** Prettier config (2-space tabs, single quotes)
- **firebase.json:** Firebase hosting and Firestore config
- **firestore.rules:** Firestore security rules
- **firestore.indexes.json:** Firestore index definitions
- **.env.example:** Template for environment variables

### Module Organization

The codebase follows a feature-based organization:

- **`app/`:** Next.js 16 App Router pages, layouts, and server actions
- **`auth/`:** Complete authentication module (Firebase auth, login, onboarding)
- **`game/`:** Self-contained Sudoku game logic and components
- **`match/`:** Multiplayer match system with client/server separation
- **`user/`:** User data management and statistics
- **`ui/`:** Shared UI components library
- **`firebase/`:** Firebase SDK initialization and helpers

Each module typically has:

- `components/` - React components
- `lib/` - Business logic (often split into `client.ts` and `server.ts`)
- `types.ts` - TypeScript type definitions
- `__tests__/` - Jest test files

### Testing

- **Framework:** Jest with jsdom environment
- **Location:** Tests are co-located with code in `__tests__/` directories
- **Pattern:** `*.test.ts` or `*.test.tsx` files
- **Coverage:** 200+ tests across 9 test suites
- **Path Aliases:** Tests use `@/` prefix for imports (mapped to `src/`)

### Important Implementation Details

1. **TypeScript Strict Mode:** The project uses strict TypeScript. All code must be type-safe.

2. **Path Aliases:** Use `@/` prefix for imports from `src/` (e.g., `import { X } from '@/game/lib'`)

3. **Server vs Client Code:**
   - Server actions live in `app/actions/`
   - Client-side Firebase in `firebase/client.ts`
   - Server-side Firebase Admin in `firebase/server.ts`
   - Many modules have both `client.ts` and `server.ts` files

4. **Firebase Integration:**
   - Authentication via Firebase Auth
   - Data storage via Firestore
   - Security rules defined in `firestore.rules`
   - Requires environment variables for API keys

5. **React Compiler:** The project uses React 19's experimental compiler (enabled in next.config.ts)

6. **CSS Modules:** Component styles use CSS Modules (`.module.css` files)

7. **Data Encoding:** The match and user modules use HMAC-based data signing for tamper detection (see `match/lib/encoding.ts`)

## Validation Checklist

Before submitting changes, ensure:

1. ✅ Code style is validated via lint: `yarn lint`
2. ✅ TypeScript checks pass: `yarn typecheck`
3. ✅ All tests pass: `yarn test:ci`
4. ✅ Build succeeds: `yarn build` (requires `.env.local`)
5. ✅ Full validation passes: `yarn validate`
6. ✅ New files follow the existing module structure
7. ✅ Import paths use `@/` prefix where appropriate
8. ✅ Server-side code is in appropriate locations (app/actions/, lib/server.ts)
9. ✅ Tests added for new functionality (if applicable)

## CI/CD

GitHub Actions quality workflow is defined in `.github/workflows/quality-gates.yml`.

- Blocking gates: lint, typecheck, tests
- Coverage job: currently phased and non-blocking, with artifact upload

Always run local checks before pushing to reduce CI iteration time.

## Additional Notes

- **Node Version:** Tested with Node v20.20.0
- **Yarn Version:** Must use Yarn 4.12.0 via Corepack
- **Total Install Size:** ~579 MB in node_modules
- **Build Time:** ~30 seconds for production build
- **Test Time:** ~3 seconds for full test suite

## Quick Reference

```bash
# Complete setup from scratch
corepack enable
yarn install
cp .env.example .env.local

# Pre-commit validation
yarn lint
yarn typecheck
yarn test:ci
yarn validate

# Build verification
yarn build
```

## AI Governance Rules (Mandatory)

These rules are mandatory for AI-generated code in this repository.

### Framework and Architecture

- Use Next.js App Router conventions.
- Prefer Server Components by default.
- Add `use client` only when necessary.
- Prefer server actions for internal mutations.
- Respect clean server/client boundaries; do not import server-only modules into client code.

### React Component Rules

- Arrow function components only.
- One exported component per file.
- Keep components pure, declarative, and composable.
- Minimize `useEffect`; avoid effect-driven control flow when declarative alternatives exist.

### Hook Rules

- One responsibility per hook.
- Keep hook composition flat and predictable.
- Side effects must remain inside hooks.

### TypeScript Rules

- Keep strict typing.
- Avoid `any` and unsafe assertions.
- Prefer discriminated unions and exhaustive handling.
- Use `satisfies` and `as const` for stronger compile-time guarantees.

### Documentation Rules (TSDoc Required)

All exported components, hooks, utilities, server actions, and public types must include TSDoc with:

- summary
- `@param`
- `@returns`
- `@throws` (when applicable)
- side effects/runtime constraints (when applicable)

### Error Handling & Validation

- Validate boundary inputs (form data, storage/network payloads).
- Prefer schema validation (`zod` or `valibot`) for complex payloads.
- No silent failures.
- Log with actionable context using `console.warn` / `console.error`.

### Testing & Coverage

- Add tests for hooks, utilities, server actions, and business logic changes.
- Follow Jest conventions from `jest.config.ts` and colocated `__tests__` patterns.
- Preserve or improve coverage; never lower thresholds without explicit approval.

### Performance and Safety

- Favor server-first data fetching.
- Use route-level caching/revalidation intentionally.
- Keep refactors incremental and behavior-preserving unless scope requires functional changes.

**Trust these instructions.** Only search for additional information if you encounter errors not covered here or if you need to understand specific implementation details beyond build/test procedures.
