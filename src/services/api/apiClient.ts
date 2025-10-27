import AsyncStorage from '@react-native-async-storage/async-storage';
import { checkForUpdate, type UpdateInfo } from '../updateChecker';
import { type ValidationError, isValidationError } from './apiErrors';

export interface ApiResponse<T> {
    data: T;
    success: boolean;
    message?: string;
}

export class UpdateRequiredError extends Error {
    updateInfo?: UpdateInfo;

    constructor(message: string, updateInfo?: UpdateInfo) {
        super(message);
        this.name = 'UpdateRequiredError';
        this.updateInfo = updateInfo;
    }
}

export class ApiClient {
    private baseURL: string;
    private updateCheckEnabled: boolean = true;

    constructor() {
        const envUrl = process.env.EXPO_PUBLIC_API_URL;
        if (!envUrl) {
            throw new Error(
                'EXPO_PUBLIC_API_URL is not defined. Please create a .env file based on .env.example and set the API URL.'
            );
        }
        this.baseURL = envUrl.startsWith('http') ? envUrl : `http://${envUrl}`;
    }

    /**
     * Enables or disables automatic update checking on API requests.
     * Useful for testing or specific scenarios where update check should be skipped.
     */
    public setUpdateCheckEnabled(enabled: boolean): void {
        this.updateCheckEnabled = enabled;
    }

    private async getAuthHeaders(): Promise<Record<string, string>> {
        const authToken = await AsyncStorage.getItem('authToken');
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        };

        if (authToken) {
            headers['Authorization'] = `Bearer ${authToken}`;
        }

        return headers;
    }

    private async getAuthHeadersWithoutContentType(): Promise<Record<string, string>> {
        const authToken = await AsyncStorage.getItem('authToken');
        const headers: Record<string, string> = {
            'Accept': 'application/json',
        };

        if (authToken) {
            headers['Authorization'] = `Bearer ${authToken}`;
        }

        return headers;
    }

    /**
     * Interceptor that checks if an app update is required before making API requests.
     * Throws UpdateRequiredError if an update is needed.
     */
    private async checkUpdateBeforeRequest(): Promise<void> {
        if (!this.updateCheckEnabled) {
            return;
        }

        const updateCheck = await checkForUpdate();
        if (updateCheck.updateRequired) {
            throw new UpdateRequiredError(
                'App update required. Please update to continue.',
                updateCheck.updateInfo
            );
        }
    }

    async get<T>(endpoint: string): Promise<T> {
        const fullUrl = `${this.baseURL}${endpoint}`;
        await this.checkUpdateBeforeRequest();
        try {
            const headers = await this.getAuthHeaders();
            const response = await fetch(fullUrl, {
                method: 'GET',
                headers,
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error(`API Error for ${endpoint}:`, error);
            throw error;
        }
    }

    async post<T>(endpoint: string, body: any): Promise<T> {
        const fullUrl = `${this.baseURL}${endpoint}`;
        await this.checkUpdateBeforeRequest();
        try {
            const headers = await this.getAuthHeaders();
            const response = await fetch(fullUrl, {
                method: 'POST',
                headers,
                body: JSON.stringify(body),
            });

            if (!response.ok) {
                const responseText = await response.text();

                if (response.status === 422) {
                    const errorData = JSON.parse(responseText);
                    const errorMessage = errorData && typeof errorData === 'object' && 'message' in errorData && errorData.message
                        ? String(errorData.message)
                        : 'Erro desconhecido';
                    const validationError: ValidationError = {
                        status: 422,
                        message: errorMessage,
                        isValidationError: true
                    };
                    throw validationError;
                }
                console.error(`HTTP Error Response Body:`, responseText);
                throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}. Response: ${responseText.substring(0, 200)}...`);
            }

            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                const responseText = await response.text();
                console.error('Expected JSON but received:', contentType);
                console.error('Response body:', responseText);
                throw new Error(`Server returned non-JSON response. Content-Type: ${contentType}. Response: ${responseText.substring(0, 200)}...`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            // Don't log validation errors (422) to console as they are expected user input errors
            if (isValidationError(error)) {
                throw error;
            }
            console.error(`API Error for POST ${endpoint}:`, error);
            throw error;
        }
    }

    /**
     * Uploads data with file attachments using multipart/form-data.
     * Handles photo uploads for checklist items.
     */
    async postWithFiles<T>(endpoint: string, data: any): Promise<T> {
        const fullUrl = `${this.baseURL}${endpoint}`;
        await this.checkUpdateBeforeRequest();
        try {
            const headers = await this.getAuthHeadersWithoutContentType();
            const formData = new FormData();

            const appendToFormData = (key: string, value: any) => {
                if (value === null || value === undefined) {
                    return;
                }

                if (Array.isArray(value)) {
                    value.forEach((item, index) => {
                        if (typeof item === 'object' && item !== null) {
                            Object.keys(item).forEach(subKey => {
                                const fullKey = `${key}[${index}][${subKey}]`;
                                appendToFormData(fullKey, item[subKey]);
                            });
                        } else {
                            formData.append(`${key}[${index}]`, item);
                        }
                    });
                } else if (typeof value === 'object' && value !== null && !value.uri) {
                    Object.keys(value).forEach(subKey => {
                        appendToFormData(`${key}[${subKey}]`, value[subKey]);
                    });
                } else if (typeof value === 'object' && value.uri) {
                    const uriParts = value.uri.split('.');
                    const fileType = uriParts[uriParts.length - 1];
                    formData.append(key, {
                        uri: value.uri,
                        name: `photo_${Date.now()}.${fileType}`,
                        type: `image/${fileType}`,
                    } as any);
                } else if (typeof value === 'boolean') {
                    formData.append(key, value ? '1' : '0');
                } else {
                    formData.append(key, String(value));
                }
            };

            Object.keys(data).forEach(key => {
                appendToFormData(key, data[key]);
            });


            const response = await fetch(fullUrl, {
                method: 'POST',
                headers,
                body: formData,
            });
            console.log(formData);

            if (!response.ok) {
                const responseText = await response.text();

                if (response.status === 422) {
                    const errorData = JSON.parse(responseText);
                    const errorMessage = errorData && typeof errorData === 'object' && 'message' in errorData && errorData.message
                        ? String(errorData.message)
                        : 'Erro desconhecido';
                    const validationError: ValidationError = {
                        status: 422,
                        message: errorMessage,
                        isValidationError: true
                    };
                    throw validationError;
                }
                console.error(`HTTP Error Response Body:`, responseText);
                throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}. Response: ${responseText.substring(0, 200)}...`);
            }

            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                const responseText = await response.text();
                console.error('Expected JSON but received:', contentType);
                console.error('Response body:', responseText);
                throw new Error(`Server returned non-JSON response. Content-Type: ${contentType}. Response: ${responseText.substring(0, 200)}...`);
            }

            const responseData = await response.json();
            return responseData;
        } catch (error) {
            // Don't log validation errors (422) to console as they are expected user input errors
            if (isValidationError(error)) {
                throw error;
            }
            console.error(`API Error for POST ${endpoint}:`, error);
            throw error;
        }
    }
}

export const apiClient = new ApiClient();
