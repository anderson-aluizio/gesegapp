import { Alert, Linking } from 'react-native';
import { apiClient, UpdateRequiredError } from './apiClient';
import type { UpdateInfo } from '../updateChecker';

/**
 * Custom error class to indicate that update alert was already shown
 */
export class UpdateRequiredHandledError extends Error {
    constructor(message: string = 'Update required and alert shown') {
        super(message);
        this.name = 'UpdateRequiredHandledError';
    }
}

/**
 * Shows an alert to the user prompting them to download the new version
 */
function showUpdateAlert(updateInfo: UpdateInfo): void {
    const { description, url, versionName } = updateInfo;

    Alert.alert(
        '📱 Atualização Necessária',
        `Uma nova versão (${versionName}) está disponível e é necessária para continuar usando o aplicativo.\n\n${description || 'Por favor, atualize para a versão mais recente.'}`,
        [
            {
                text: 'Cancelar',
                style: 'cancel',
            },
            {
                text: 'Baixar Atualização',
                onPress: async () => {
                    try {
                        const supported = await Linking.canOpenURL(url);
                        if (supported) {
                            await Linking.openURL(url);
                        } else {
                            Alert.alert(
                                'Erro',
                                'Não foi possível abrir o link de download. Por favor, contate o suporte.'
                            );
                        }
                    } catch (error) {
                        console.error('Error opening download URL:', error);
                        Alert.alert(
                            'Erro',
                            'Ocorreu um erro ao tentar abrir o link de download.'
                        );
                    }
                },
            },
        ],
        { cancelable: false }
    );
}

/**
 * Wrapper for API client that automatically handles UpdateRequiredError
 */
export class ApiClientWrapper {
    async get<T>(endpoint: string): Promise<T> {
        try {
            return await apiClient.get<T>(endpoint);
        } catch (error) {
            if (error instanceof UpdateRequiredError && error.updateInfo) {
                showUpdateAlert(error.updateInfo);
                // Throw a different error type to indicate the update alert was shown
                throw new UpdateRequiredHandledError();
            }
            throw error;
        }
    }

    async post<T>(endpoint: string, body: any): Promise<T> {
        try {
            return await apiClient.post<T>(endpoint, body);
        } catch (error) {
            if (error instanceof UpdateRequiredError && error.updateInfo) {
                showUpdateAlert(error.updateInfo);
                // Throw a different error type to indicate the update alert was shown
                throw new UpdateRequiredHandledError();
            }
            throw error;
        }
    }

    /**
     * Enables or disables automatic update checking on API requests.
     */
    setUpdateCheckEnabled(enabled: boolean): void {
        apiClient.setUpdateCheckEnabled(enabled);
    }
}

export const apiClientWrapper = new ApiClientWrapper();
