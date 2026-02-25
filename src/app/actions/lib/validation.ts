import type { z } from 'zod';

/**
 * Safely read a string value from FormData.
 *
 * @param formData - The incoming form data payload
 * @param key - Form field name
 * @returns String value when present and typed correctly, otherwise null
 */
export const getFormDataString = (
  formData: FormData,
  key: string,
): string | null => {
  const value = formData.get(key);
  return typeof value === 'string' ? value : null;
};

/**
 * Convert unknown errors to a safe message for user-facing action results.
 *
 * @param error - Unknown thrown value
 * @param fallbackMessage - Fallback message when error shape is unknown
 * @returns Safe string message
 */
export const getErrorMessage = (
  error: unknown,
  fallbackMessage: string,
): string => {
  if (error instanceof Error) {
    return error.message;
  }
  return fallbackMessage;
};

/**
 * Extract the first zod issue message from a failed parse result.
 *
 * @param result - Result from zod safeParse
 * @param fallbackMessage - Message to use when no issue details exist
 * @returns Validation message string
 */
export const getZodIssueMessage = (
  result: z.ZodSafeParseResult<unknown>,
  fallbackMessage: string,
): string => {
  if (result.success) {
    return fallbackMessage;
  }
  return result.error.issues[0]?.message ?? fallbackMessage;
};

/**
 * Log action failures with a stable prefix and full error payload.
 *
 * @param actionName - Friendly action identifier
 * @param error - Unknown thrown value
 */
export const logActionError = (actionName: string, error: unknown): void => {
  console.error(`[${actionName}]`, error);
};
