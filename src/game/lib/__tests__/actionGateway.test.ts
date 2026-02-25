// Mocks must be hoisted before imports
jest.mock('@/app/actions/puzzle', () => ({
  getDailyPuzzle: jest.fn(),
}));

jest.mock('@/app/actions/reportBug', () => ({
  reportBug: jest.fn(),
}));

import { getDailyPuzzle, reportBug } from '../actionGateway';
import * as puzzleActions from '@/app/actions/puzzle';
import * as reportBugActions from '@/app/actions/reportBug';
import type { DailyPuzzleResponse } from '@/app/actions/puzzle';
import type { BugReportState } from '@/app/actions/reportBug';
import type { Difficulty } from '@/game/types';

const mockedPuzzleActions = puzzleActions as jest.Mocked<typeof puzzleActions>;
const mockedReportBugActions = reportBugActions as jest.Mocked<
  typeof reportBugActions
>;

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

  describe('reportBug', () => {
    it('should delegate to reportBug action and return result', async () => {
      const prevState: BugReportState = { success: false, message: '' };
      const formData = new FormData();
      formData.set('category', 'bug');
      formData.set('description', 'Test bug report');

      const mockResult: BugReportState = {
        success: true,
        message: 'Bug report submitted',
      };

      mockedReportBugActions.reportBug.mockResolvedValue(mockResult);

      const result = await reportBug(prevState, formData);

      expect(reportBugActions.reportBug).toHaveBeenCalledWith(
        prevState,
        formData,
      );
      expect(result).toBe(mockResult);
    });

    it('should pass through validation errors from action', async () => {
      const prevState: BugReportState = { success: false, message: '' };
      const formData = new FormData();

      const mockResult: BugReportState = {
        success: false,
        message: 'Category is required',
      };

      mockedReportBugActions.reportBug.mockResolvedValue(mockResult);

      const result = await reportBug(prevState, formData);

      expect(result).toEqual(mockResult);
    });

    it('should pass through action errors', async () => {
      const mockError = new Error('Network error');
      const prevState: BugReportState = { success: false, message: '' };
      const formData = new FormData();

      mockedReportBugActions.reportBug.mockRejectedValue(mockError);

      await expect(reportBug(prevState, formData)).rejects.toThrow(
        'Network error',
      );
    });
  });
});
