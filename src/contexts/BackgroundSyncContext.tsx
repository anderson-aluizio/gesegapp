import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { useChecklisRealizadoDatabase } from '@/database/models/useChecklisRealizadoDatabase';
import { useChecklisRealizadoItemsDatabase } from '@/database/models/useChecklisRealizadoItemsDatabase';
import { useChecklistRealizadoFuncionarioDatabase } from '@/database/models/useChecklistRealizadoFuncionarioDatabase';
import { useChecklisRealizadoControleRiscosDatabase } from '@/database/models/useChecklisRealizadoControleRiscosDatabase';
import { useChecklistRealizadoAcaoCampoDatabase } from '@/database/models/useChecklistRealizadoAcaoCampoDatabase';
import { useEquipeTurnoDatabase } from '@/database/models/useEquipeTurnoDatabase';
import { useEquipeTurnoFuncionarioDatabase } from '@/database/models/useEquipeTurnoFuncionarioDatabase';
import { apiClientWrapper } from '@/services';
import { useAuth } from '@/contexts/AuthContext';

const SYNC_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

type SyncStatus = 'idle' | 'syncing' | 'success' | 'error';

type BackgroundSyncContextType = {
    syncStatus: SyncStatus;
    lastSyncAt: Date | null;
    pendingCount: number;
    syncNow: () => Promise<void>;
};

const BackgroundSyncContext = createContext<BackgroundSyncContextType>({
    syncStatus: 'idle',
    lastSyncAt: null,
    pendingCount: 0,
    syncNow: async () => { },
});

export const useBackgroundSync = () => useContext(BackgroundSyncContext);

export function BackgroundSyncProvider({ children }: { children: React.ReactNode }) {
    const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
    const [lastSyncAt, setLastSyncAt] = useState<Date | null>(null);
    const [pendingCount, setPendingCount] = useState(0);
    const isSyncingRef = useRef(false);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const { user } = useAuth();

    const checklistDb = useChecklisRealizadoDatabase();
    const checklistItemsDb = useChecklisRealizadoItemsDatabase();
    const checklistFuncionariosDb = useChecklistRealizadoFuncionarioDatabase();
    const realizadoControlesDb = useChecklisRealizadoControleRiscosDatabase();
    const realizadoAcaoCamposDb = useChecklistRealizadoAcaoCampoDatabase();
    const turnoDb = useEquipeTurnoDatabase();
    const turnoFuncionarioDb = useEquipeTurnoFuncionarioDatabase();

    const updatePendingCount = useCallback(async () => {
        try {
            const checklists = await checklistDb.getFinalizadosNotSynced();
            const turnos = await turnoDb.getNotSynced();
            setPendingCount(checklists.length + turnos.length);
        } catch {
            // silent
        }
    }, []);

    const syncData = useCallback(async () => {
        if (isSyncingRef.current || !user) return;

        // Check connectivity
        try {
            const netInfo = await NetInfo.fetch();
            if (!netInfo.isConnected || !netInfo.isInternetReachable) return;
        } catch {
            return;
        }

        isSyncingRef.current = true;
        setSyncStatus('syncing');

        let hasError = false;

        try {
            // Send turnos
            const turnos = await turnoDb.getNotSynced();
            for (const turno of turnos) {
                try {
                    const funcionarios = await turnoFuncionarioDb.getByEquipeTurnoId(turno.id);
                    await apiClientWrapper.post('/store-equipe-turno', {
                        equipe_id: turno.equipe_id,
                        date: turno.date,
                        veiculo_id: turno.veiculo_id,
                        funcionarios: funcionarios.map(f => ({
                            funcionario_cpf: f.funcionario_cpf,
                            is_lider: f.is_lider,
                        })),
                    });
                    await turnoDb.markAsSynced(turno.id);
                } catch (error) {
                    hasError = true;
                    console.log(`[BackgroundSync] Erro ao enviar turno ${turno.id}:`, error);
                }
            }

            // Send checklists
            const checklists = await checklistDb.getFinalizadosNotSynced();
            for (const checklist of checklists) {
                try {
                    const funcionarios = await checklistFuncionariosDb.getByChecklistRealizadoId(checklist.id);
                    const items = await checklistItemsDb.getByChecklistRealizadoId(checklist.id);
                    const controle_riscos = await realizadoControlesDb.getByChecklistRealizadoId(checklist.id);
                    const acao_campos = await realizadoAcaoCamposDb.getByChecklistRealizadoId(checklist.id);
                    const hasPhotos = items.some(item => item.foto_path);

                    const itemsWithPhotos = items.map(item => {
                        if (item.foto_path && item.foto_path.startsWith('file://')) {
                            return { ...item, foto: { uri: item.foto_path } };
                        }
                        return item;
                    });

                    const payload = {
                        ...checklist,
                        funcionarios,
                        items: itemsWithPhotos,
                        controle_riscos,
                        acao_campos,
                    };

                    if (hasPhotos) {
                        await apiClientWrapper.postWithFiles('/store-checklist-realizado', payload);
                    } else {
                        await apiClientWrapper.post('/store-checklist-realizado', payload);
                    }

                    await checklistDb.markAsSynced(checklist.id);
                } catch (error) {
                    hasError = true;
                    console.log(`[BackgroundSync] Erro ao enviar checklist ${checklist.id}:`, error);
                }
            }

            // Clean old synced data
            if (!hasError) {
                try {
                    await turnoDb.cleanOldSyncedData(7);
                    await checklistDb.cleanOldSyncedData(7);
                } catch {
                    // silent
                }
            }

            setSyncStatus(hasError ? 'error' : 'success');
            setLastSyncAt(new Date());
        } catch (error) {
            console.log('[BackgroundSync] Erro geral:', error);
            setSyncStatus('error');
        } finally {
            isSyncingRef.current = false;
            await updatePendingCount();
        }
    }, [user]);

    // Start/stop interval based on app state
    useEffect(() => {
        if (!user) return;

        const startInterval = () => {
            if (intervalRef.current) return;
            // Initial count + sync
            updatePendingCount();
            syncData();
            intervalRef.current = setInterval(() => {
                syncData();
            }, SYNC_INTERVAL_MS);
        };

        const stopInterval = () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        };

        const handleAppState = (state: AppStateStatus) => {
            if (state === 'active') {
                startInterval();
            } else {
                stopInterval();
            }
        };

        startInterval();
        const subscription = AppState.addEventListener('change', handleAppState);

        return () => {
            stopInterval();
            subscription.remove();
        };
    }, [user, syncData, updatePendingCount]);

    return (
        <BackgroundSyncContext.Provider value={{
            syncStatus,
            lastSyncAt,
            pendingCount,
            syncNow: syncData,
        }}>
            {children}
        </BackgroundSyncContext.Provider>
    );
}
