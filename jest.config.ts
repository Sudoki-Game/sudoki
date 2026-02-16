import type { Config } from 'jest';
import nextJest from 'next/jest.js';

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files
  dir: './',
});

const config: Config = {
  coverageProvider: 'v8',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testMatch: ['**/__tests__/**/*.test.ts?(x)', '**/?(*.)+(spec|test).ts?(x)'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/types/**',
    '!src/app/**/*.tsx', // Exclude Next.js app router pages from coverage
  ],
  coverageThreshold: {
    global: {
      statements: 80,
      lines: 80,
      functions: 80,
      branches: 80,
    },
    // Lib
    './src/app/actions/': {
      statements: 90,
      lines: 90,
      functions: 90,
      branches: 90,
    },
    './src/auth/lib': {
      statements: 90,
      lines: 90,
      functions: 90,
      branches: 90,
    },
    './src/firebase/': {
      statements: 90,
      lines: 90,
      functions: 90,
      branches: 90,
    },
    './src/match/lib': {
      statements: 90,
      lines: 90,
      functions: 90,
      branches: 90,
    },
    './src/user/lib': {
      statements: 90,
      lines: 90,
      functions: 90,
      branches: 90,
    },
    // Components
    './src/ui/components': {
      statements: 40,
      lines: 40,
      functions: 40,
      branches: 40,
    },
    './src/auth/components': {
      statements: 60,
      lines: 60,
      functions: 60,
      branches: 60,
    },
    './src/game/components/': {
      statements: 60,
      lines: 60,
      functions: 60,
      branches: 60,
    },
  },
};

export default createJestConfig(config);
