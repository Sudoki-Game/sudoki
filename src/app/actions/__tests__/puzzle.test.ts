/**
 * Tests for puzzle server action cache flow
 *
 * Verifies tiered caching behavior:
 * 1) memory cache
 * 2) Firestore cache
 * 3) generated fallback
 */

import type { Board, Difficulty } from '@/game/types';

type FirestoreDocData = {
  puzzle: string;
  solution: string;
  difficulty: Difficulty;
  createdAt: number;
};

function createBoard(value: number): Board {
  return Array.from({ length: 9 }, () =>
    Array.from({ length: 9 }, () => value),
  ) as Board;
}

type SetupOptions = {
  dateString?: string;
  firestoreData?: FirestoreDocData | null;
  firestoreReadError?: Error;
  firestoreWriteError?: Error;
  generatedPuzzle?: Board;
  generatedSolution?: Board;
};

async function setupPuzzleModule(options: SetupOptions = {}) {
  jest.resetModules();

  const dateString = options.dateString ?? '2026-02-16';
  const generatedPuzzle = options.generatedPuzzle ?? createBoard(1);
  const generatedSolution = options.generatedSolution ?? createBoard(2);

  const getMock = jest.fn();
  if (options.firestoreReadError) {
    getMock.mockRejectedValue(options.firestoreReadError);
  } else {
    getMock.mockResolvedValue({
      exists: !!options.firestoreData,
      data: () => options.firestoreData,
    });
  }

  const setMock = options.firestoreWriteError
    ? jest.fn().mockRejectedValue(options.firestoreWriteError)
    : jest.fn().mockResolvedValue(undefined);

  const docMock = jest.fn(() => ({
    get: getMock,
    set: setMock,
  }));

  const collectionMock = jest.fn(() => ({
    doc: docMock,
  }));

  const generateDailyPuzzleMock = jest.fn(() => ({
    puzzle: generatedPuzzle,
    solution: generatedSolution,
  }));

  const getTodayDateStringMock = jest.fn(() => dateString);

  jest.doMock('@/firebase/server', () => ({
    serverDb: {
      collection: collectionMock,
    },
  }));

  jest.doMock('@/game/util', () => ({
    generateDailyPuzzle: generateDailyPuzzleMock,
    getTodayDateString: getTodayDateStringMock,
  }));

  const puzzleActions = await import('../puzzle');

  return {
    puzzleActions,
    mocks: {
      collectionMock,
      docMock,
      getMock,
      setMock,
      generateDailyPuzzleMock,
      getTodayDateStringMock,
      generatedPuzzle,
      generatedSolution,
      dateString,
    },
  };
}

describe('getDailyPuzzle', () => {
  let consoleLogSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => undefined);
    consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  it('uses memory cache on repeated calls for the same date and difficulty', async () => {
    const { puzzleActions, mocks } = await setupPuzzleModule({
      firestoreData: null,
    });

    const first = await puzzleActions.getDailyPuzzle('medium');
    const second = await puzzleActions.getDailyPuzzle('medium');

    expect(first).toEqual(second);
    expect(mocks.getMock).toHaveBeenCalledTimes(1);
    expect(mocks.generateDailyPuzzleMock).toHaveBeenCalledTimes(1);
  });

  it('returns Firestore cached puzzle when available', async () => {
    const firestorePuzzle = createBoard(3);
    const firestoreSolution = createBoard(4);

    const { puzzleActions, mocks } = await setupPuzzleModule({
      firestoreData: {
        puzzle: JSON.stringify(firestorePuzzle),
        solution: JSON.stringify(firestoreSolution),
        difficulty: 'hard',
        createdAt: Date.now(),
      },
    });

    const result = await puzzleActions.getDailyPuzzle('hard');

    expect(result.puzzle).toEqual(firestorePuzzle);
    expect(result.solution).toEqual(firestoreSolution);
    expect(result.difficulty).toBe('hard');
    expect(result.dateString).toBe(mocks.dateString);
    expect(mocks.generateDailyPuzzleMock).not.toHaveBeenCalled();
    expect(mocks.setMock).not.toHaveBeenCalled();
  });

  it('generates and writes puzzle to Firestore when cache misses', async () => {
    const { puzzleActions, mocks } = await setupPuzzleModule({
      firestoreData: null,
    });

    const result = await puzzleActions.getDailyPuzzle('easy');

    expect(result.puzzle).toEqual(mocks.generatedPuzzle);
    expect(result.solution).toEqual(mocks.generatedSolution);
    expect(result.difficulty).toBe('easy');
    expect(mocks.generateDailyPuzzleMock).toHaveBeenCalledWith(
      mocks.dateString,
      'easy',
    );
    expect(mocks.setMock).toHaveBeenCalledTimes(1);
    expect(mocks.setMock).toHaveBeenCalledWith(
      expect.objectContaining({
        puzzle: JSON.stringify(mocks.generatedPuzzle),
        solution: JSON.stringify(mocks.generatedSolution),
        difficulty: 'easy',
        createdAt: expect.any(Number),
      }),
    );
  });

  it('falls back to generation when Firestore read throws', async () => {
    const { puzzleActions, mocks } = await setupPuzzleModule({
      firestoreReadError: new Error('read failed'),
    });

    const result = await puzzleActions.getDailyPuzzle('medium');

    expect(result.puzzle).toEqual(mocks.generatedPuzzle);
    expect(result.solution).toEqual(mocks.generatedSolution);
    expect(mocks.generateDailyPuzzleMock).toHaveBeenCalledTimes(1);
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      '[getDailyPuzzle] Firestore read error:',
      expect.any(Error),
    );
  });

  it('returns puzzle even when Firestore write fails', async () => {
    const { puzzleActions, mocks } = await setupPuzzleModule({
      firestoreData: null,
      firestoreWriteError: new Error('write failed'),
    });

    const result = await puzzleActions.getDailyPuzzle('medium');

    expect(result.puzzle).toEqual(mocks.generatedPuzzle);
    expect(result.solution).toEqual(mocks.generatedSolution);
    expect(mocks.generateDailyPuzzleMock).toHaveBeenCalledTimes(1);
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      '[getDailyPuzzle] Firestore write error:',
      expect.any(Error),
    );
  });
});
