import { useEffect } from 'react';
import { useCentroCustoDatabase } from '@/database/Models/useCentroCustoDatabase';
import UserInterface, { useAuth } from '@/contexts/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

export const useCentroCustosRefresh = () => {
    const { shouldRefreshCentroCustos, clearRefreshFlag } = useAuth();
    const centroCustoDb = useCentroCustoDatabase();

    useEffect(() => {
        const refreshCentroCustos = async () => {
            if (shouldRefreshCentroCustos) {
                try {
                    const userData = await AsyncStorage.getItem('userData');
                    const user: UserInterface = userData ? JSON.parse(userData) : null;

                    if (user && user.centro_custos && user.centro_custos.length > 0) {
                        await centroCustoDb.deleteAndInsert(user.centro_custos);
                    }
                } catch (error) {
                    console.error('Error refreshing centro custos:', error);
                    Alert.alert('Erro', 'Não foi possível atualizar os centros de custo.');
                } finally {
                    clearRefreshFlag();
                }
            }
        };

        refreshCentroCustos();
    }, [shouldRefreshCentroCustos, centroCustoDb, clearRefreshFlag]);
};
