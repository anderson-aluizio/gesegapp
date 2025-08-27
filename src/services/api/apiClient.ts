import AsyncStorage from '@react-native-async-storage/async-storage';

export interface ApiResponse<T> {
    data: T;
    success: boolean;
    message?: string;
}

export class ApiClient {
    private baseURL: string;

    constructor() {
        const envUrl = process.env.EXPO_PUBLIC_API_URL;
        if (envUrl) {
            this.baseURL = envUrl.startsWith('http') ? envUrl : `http://${envUrl}`;
        } else {
            this.baseURL = 'https://geseg2.dinamo.srv.br/api';
        }
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

    async get<T>(endpoint: string): Promise<T> {
        const fullUrl = `${this.baseURL}${endpoint}`;
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
        try {
            const headers = await this.getAuthHeaders();
            const response = await fetch(fullUrl, {
                method: 'POST',
                headers,
                body: JSON.stringify(body),
            });

            if (!response.ok) {
                const responseText = await response.text();
                console.error(`HTTP Error Response Body:`, responseText);

                if (response.status === 422) {
                    try {
                        const errorData = JSON.parse(responseText);
                        throw new Error(`Validation Error: ${JSON.stringify(errorData)}`);
                    } catch (parseError) {
                        throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}. Response: ${responseText}`);
                    }
                }

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
