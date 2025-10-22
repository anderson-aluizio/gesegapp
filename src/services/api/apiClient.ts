import AsyncStorage from '@react-native-async-storage/async-storage';
import { checkForUpdate, type UpdateInfo } from '../updateChecker';

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
                    throw errorMessage;
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
            console.error(`API Error for POST ${endpoint}:`, error);
            throw error;
        }
    }
}

export const apiClient = new ApiClient();
