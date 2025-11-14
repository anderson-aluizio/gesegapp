import { useState, useEffect } from 'react';
import { useSQLiteContext } from 'expo-sqlite';
import { CentroCustoDatabase, useCentroCustoDatabase } from '@/database/models/useCentroCustoDatabase';
import { createDatabaseSyncService, type SyncProgress } from '@/services';
import { checkNetworkConnection } from './useNetworkConnection';

interface UseCentroCustoSyncOptions {
    onError: (message: string) => void;
    onSuccess: (message: string) => void;
    onProgressUpdate: (message: string) => void;
    onProgressChange: (step: string, percentage: number) => void;
}

export function useCentroCustoSync({
    onError,
    onSuccess,
    onProgressUpdate,
    onProgressChange,
}: UseCentroCustoSyncOptions) {
    const db = useSQLiteContext();
    const centroCustoDb = useCentroCustoDatabase();
    const [centroCustos, setCentroCustos] = useState<CentroCustoDatabase[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSyncing, setIsSyncing] = useState(false);

    const loadCentroCustos = async () => {
        try {
            setIsLoading(true);
            const data = await centroCustoDb.getAll();
            setCentroCustos(data);
        } catch (error) {
            onError('Erro ao carregar centros de custo');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadCentroCustos();
    }, []);

    const syncCentroCusto = async (centroCustoId: string) => {
        setIsSyncing(true);

        try {
            onProgressUpdate('🔍 Verificando conexão com servidor...');

            const networkInfo = await checkNetworkConnection();

            if (networkInfo.connectionType) {
                onProgressUpdate(networkInfo.connectionType);
            }
            if (networkInfo.connectionDetails) {
                onProgressUpdate(networkInfo.connectionDetails);
            }

            onProgressUpdate('🔄 Iniciando sincronização de dados...');
            const dbSyncService = createDatabaseSyncService(db);

            const progressCallback = (progress: SyncProgress) => {
                onProgressChange(progress.step, progress.percentage);
                onProgressUpdate(
                    `📊 ${progress.step} (${progress.currentStep}/${progress.totalSteps})`
                );
            };

            await dbSyncService.syncAllDataStreaming(progressCallback, centroCustoId);

            onProgressChange('Concluído', 100);
            onProgressUpdate('✅ Sincronização concluída com sucesso!');
            await loadCentroCustos();

            setTimeout(() => {
                onSuccess('Dados atualizados com sucesso!');
                setIsSyncing(false);
            }, 1500);

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
            onProgressUpdate(`❌ Erro: ${errorMessage}`);

            setTimeout(() => {
                onError('Erro ao atualizar dados');
                setIsSyncing(false);
            }, 1500);
        }
    };

    return {
        centroCustos,
        isLoading,
        isSyncing,
        syncCentroCusto,
        refreshCentroCustos: loadCentroCustos,
    };
}
