/**
 * API Error Types and Utilities
 *
 * This module provides type definitions and utility functions for handling
 * API errors in a type-safe manner throughout the application.
 */

/**
 * Validation error returned by the API when input validation fails (HTTP 422)
 */
export type ValidationError = {
    status: 422;
    message: string;
    isValidationError: true;
}

export const isValidationError = (error: unknown): error is ValidationError => {
    return (
        typeof error === 'object' &&
        error !== null &&
        'isValidationError' in error &&
        error.isValidationError === true &&
        'status' in error &&
        error.status === 422 &&
        'message' in error &&
        typeof error.message === 'string'
    );
}

/**
 * Extracts a user-friendly error message from any error type
 *
 * @param error - Unknown error from which to extract the message
 * @returns A string message suitable for displaying to users
 *
 * @example
 * try {
 *   await apiClient.post('/endpoint', data);
 * } catch (error) {
 *   const message = getErrorMessage(error);
 *   Alert.alert('Erro', message);
 * }
 */
export const getErrorMessage = (error: unknown): string => {
    if (isValidationError(error)) {
        return error.message;
    }

    if (error instanceof Error) {
        return error.message;
    }

    if (typeof error === 'string') {
        return error;
    }

    return 'Erro desconhecido';
}
