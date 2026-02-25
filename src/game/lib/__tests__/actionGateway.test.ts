// Mocks must be hoisted before imports
jest.mock('@/app/actions/puzzle', () => ({
  getDailyPuzzle: jest.fn(),
}));

import { getDailyPuzzle } from '../actionGateway';
import * as puzzleActions from '@/app/actions/puzzle';
import type { DailyPuzzleResponse } from '@/app/actions/puzzle';
import type { Difficulty } from '@/game/types';

const mockedPuzzleActions = puzzleActions as jest.Mocked<typeof puzzleActions>;

describe('Game Action Gateway', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getDailyPuzzle', () => {
    it('should delegate to getDailyPuzzle action without difficulty', async () => {
      const mockResponse: DailyPuzzleResponse = {
        puzzle: Array(81).fill(0),
        solution: Array(81).fill(1),
        dateString: '2024-01-01',
        difficulty: 'easy',
      };

      mockedPuzzleActions.getDailyPuzzle.mockResolvedValue(mockResponse);

      const result = await getDailyPuzzle();

      expect(puzzleActions.getDailyPuzzle).toHaveBeenCalledWith(undefined);
      expect(result).toBe(mockResponse);
    });

    it('should delegate to getDailyPuzzle action with difficulty', async () => {
      const difficulty: Difficulty = 'medium';
      const mockResponse: DailyPuzzleResponse = {
        puzzle: Array(81).fill(0),
        solution: Array(81).fill(2),
        dateString: '2024-01-01',
        difficulty: 'medium',
      };

      mockedPuzzleActions.getDailyPuzzle.mockResolvedValue(mockResponse);

      const result = await getDailyPuzzle(difficulty);

      expect(puzzleActions.getDailyPuzzle).toHaveBeenCalledWith(difficulty);
      expect(result).toBe(mockResponse);
    });

    it('should pass through action errors', async () => {
      const mockError = new Error('Puzzle generation failed');

      mockedPuzzleActions.getDailyPuzzle.mockRejectedValue(mockError);

      await expect(getDailyPuzzle('hard')).rejects.toThrow(
        'Puzzle generation failed',
      );
    });
  });
});
