/**
 * Sync-related type definitions
 */

export interface SyncCallbacks {
    onError: (message: string) => void;
    onSuccess: (message: string) => void;
    onProgressUpdate: (message: string) => void;
    onProgressChange: (step: string, percentage: number) => void;
}

export interface DialogState {
    visible: boolean;
    description: string;
}

export interface SnackbarState {
    visible: boolean;
    message: string;
    type: 'success' | 'error' | 'info';
}

export interface SyncProgressState {
    visible: boolean;
    progress: string[];
    percentage: number;
    currentStep: string;
}
