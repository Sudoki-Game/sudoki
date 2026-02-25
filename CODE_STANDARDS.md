# Sudoki Code Standards

This document defines mandatory engineering standards for all code changes in this repository.

## 1) Architecture & Boundaries

- Use Next.js App Router architecture.
- Prefer Server Components by default; add `use client` only when required by interactivity or browser APIs.
- Keep server logic in server actions and server-only modules.
- Do not import server-only modules into client components, hooks, or client libraries.
- Enforce feature boundaries:
  - `src/app/actions/*`: server action entrypoints only
  - `src/*/lib/server.ts`: server-side feature logic
  - `src/*/lib/client.ts`: client-side feature adapters only
- Avoid circular dependencies and cross-feature leakage.
- Prefer composition and feature-level adapters over direct cross-layer calls.

## 2) Next.js 16 Standards

- Use App Router conventions for pages, layouts, loading, and error boundaries.
- Prefer route-level caching/revalidation primitives over ad-hoc caching where practical.
- Choose runtime intentionally (`edge` or `node`) based on dependency needs.
- Prefer server actions over custom API routes for internal app mutations.
- Keep metadata and route config typed and colocated.

## 3) React 19 Standards

- Component declaration style: arrow function components only.
- One exported component per file.
- Keep components pure, declarative, and predictable.
- Prefer composition over prop drilling.
- Minimize `useEffect`; use declarative data/action flows first.
- Hooks must be single-responsibility and side effects must remain inside hooks.

## 4) TypeScript Standards

- Keep `strict: true`.
- Avoid `any`; use explicit domain types, generics, or `unknown` with narrowing.
- Prefer `satisfies`, `as const`, discriminated unions, and exhaustive union handling.
- Avoid unsafe assertions and non-null assertions unless documented and justified.
- Export and reuse shared types for API/action contracts.

## 5) Documentation Standards (TSDoc)

All exported symbols must include TSDoc:

- Components
- Hooks
- Utilities
- Server actions
- Public types/interfaces

Required sections where applicable:

- Summary
- `@param` for each parameter
- `@returns`
- `@throws` for error cases
- Side effects and important runtime constraints

## 6) Error Handling & Validation

- Validate external input at boundaries (form data, search params, storage payloads, network data).
- Prefer schema-based validation (`zod` or `valibot`) for complex payloads.
- Use typed result objects for expected failures.
- Do not silently swallow errors.
- Use predictable logging (`console.warn` / `console.error`) with actionable context.
- Ensure switch statements over unions are exhaustive.

## 7) Testing Standards

Follow repository Jest conventions in `jest.config.ts` and `jest.setup.ts`:

- Test environment: `jsdom`
- Setup file: `jest.setup.ts`
- Module alias: `@/*` to `src/*`
- Test naming: `*.test.ts`, `*.test.tsx`, `*.spec.ts`, `*.spec.tsx`
- Test placement: colocated under `__tests__/` where practical

Required tests:

- Hooks
- Utilities
- Server actions
- Business logic modules

Strongly recommended tests:

- Critical UI flows
- Forms and validation behavior
- Key state transitions

Coverage policy:

- Respect configured thresholds in `jest.config.ts`.
- Target production-grade minimums over time:
  - Lines ≥ 85%
  - Branches ≥ 80%
  - Functions ≥ 85%
  - Statements ≥ 85%

## 8) Tooling & Quality Gates

Run these commands for all substantial changes:

- `yarn lint`
- `yarn typecheck`
- `yarn test:ci`

Full validation command:

- `yarn validate`

CI must enforce lint, typecheck, and tests as blocking gates.
Coverage reporting is phased and can start non-blocking before ratcheting to strict enforcement.

## 9) Naming & Imports

- Use `@/` path aliases for source imports.
- Keep naming consistent with existing feature conventions.
- Keep public APIs explicit; avoid accidental deep-import coupling.
- Prefer type-only imports where appropriate.

## 10) Refactoring Principles

- Use incremental, safe refactors.
- Fix root causes rather than patching symptoms.
- Avoid broad unrelated formatting or behavior changes.
- Preserve public behavior unless a change is explicitly part of the task.