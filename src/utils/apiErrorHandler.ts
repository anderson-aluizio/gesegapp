import { UpdateRequiredError } from '@/services/api/apiClient';
import type { UpdateInfo } from '@/services/updateChecker';

type ShowUpdateModalFunction = (updateInfo?: UpdateInfo) => void;

let globalShowUpdateModal: ShowUpdateModalFunction | null = null;

/**
 * Registers the global update modal handler.
 * This should be called once from the UpdateProvider.
 */
export function registerUpdateModalHandler(handler: ShowUpdateModalFunction): void {
    globalShowUpdateModal = handler;
}

/**
 * Handles API errors and automatically shows the update modal for UpdateRequiredError.
 * Use this wrapper around any API calls to automatically handle update requirements.
 *
 * @param promise - The API promise to handle
 * @returns The result of the promise if successful
 * @throws The original error if it's not an UpdateRequiredError
 */
export async function handleApiError<T>(promise: Promise<T>): Promise<T> {
    try {
        return await promise;
    } catch (error) {
        if (error instanceof UpdateRequiredError) {
            if (globalShowUpdateModal) {
                globalShowUpdateModal(error.updateInfo);
            } else {
                console.warn('Update modal handler not registered. Cannot show update modal.');
            }
            // Don't re-throw UpdateRequiredError, as it's been handled
            throw error;
        }
        // Re-throw other errors
        throw error;
    }
}

/**
 * Higher-order function that wraps an async function with update error handling.
 * Use this to wrap component functions that make API calls.
 *
 * @example
 * const handleSubmit = withUpdateErrorHandler(async () => {
 *   await apiClient.post('/endpoint', data);
 * });
 */
export function withUpdateErrorHandler<T extends (...args: any[]) => Promise<any>>(
    fn: T
): (...args: Parameters<T>) => Promise<ReturnType<T>> {
    return async (...args: Parameters<T>): Promise<ReturnType<T>> => {
        try {
            return await fn(...args);
        } catch (error) {
            if (error instanceof UpdateRequiredError) {
                if (globalShowUpdateModal) {
                    globalShowUpdateModal(error.updateInfo);
                } else {
                    console.warn('Update modal handler not registered. Cannot show update modal.');
                }
                throw error;
            }
            throw error;
        }
    };
}
