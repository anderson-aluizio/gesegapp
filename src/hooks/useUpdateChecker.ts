import { useEffect, useCallback } from 'react';
import { Alert, Linking } from 'react-native';
import { UpdateRequiredError } from '@/services/api/apiClient';
import type { UpdateInfo } from '@/services/updateChecker';

/**
 * Hook to handle update required errors and prompt user to download new version
 */
export function useUpdateChecker() {
    const handleUpdateRequired = useCallback((updateInfo: UpdateInfo) => {
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
    }, []);

    const handleApiError = useCallback((error: any) => {
        if (error instanceof UpdateRequiredError && error.updateInfo) {
            handleUpdateRequired(error.updateInfo);
            return true;
        }
        return false;
    }, [handleUpdateRequired]);

    return { handleApiError, handleUpdateRequired };
}
