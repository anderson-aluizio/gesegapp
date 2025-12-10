import { useEffect, useState, useCallback } from 'react';
import { useEquipeTurnoDatabase } from '@/database/models/useEquipeTurnoDatabase';
import { useChecklisRealizadoDatabase } from '@/database/models/useChecklisRealizadoDatabase';

type PendingSyncData = {
  pendingTurnos: number;
  pendingChecklists: number;
  totalPending: number;
  hasPendingData: boolean;
};

export const usePendingSyncAlert = () => {
  const turnoDb = useEquipeTurnoDatabase();
  const checklistDb = useChecklisRealizadoDatabase();

  const [pendingData, setPendingData] = useState<PendingSyncData>({
    pendingTurnos: 0,
    pendingChecklists: 0,
    totalPending: 0,
    hasPendingData: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [showAlert, setShowAlert] = useState(false);

  const checkPendingSync = useCallback(async () => {
    try {
      setIsLoading(true);

      const [notSyncedTurnos, notSyncedChecklists] = await Promise.all([
        turnoDb.getNotSynced(),
        checklistDb.getFinalizadosNotSynced(),
      ]);

      const pendingTurnos = notSyncedTurnos?.length || 0;
      const pendingChecklists = notSyncedChecklists?.length || 0;
      const totalPending = pendingTurnos + pendingChecklists;
      const hasPendingData = totalPending > 0;

      setPendingData({
        pendingTurnos,
        pendingChecklists,
        totalPending,
        hasPendingData,
      });

      if (hasPendingData) {
        setShowAlert(true);
      }

      return hasPendingData;
    } catch (error) {
      console.error('Error checking pending sync data:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [turnoDb, checklistDb]);

  const dismissAlert = useCallback(() => {
    setShowAlert(false);
  }, []);

  const getAlertMessage = useCallback(() => {
    const { pendingTurnos, pendingChecklists } = pendingData;
    const parts: string[] = [];

    if (pendingTurnos > 0) {
      parts.push(`${pendingTurnos} turno${pendingTurnos > 1 ? 's' : ''}`);
    }
    if (pendingChecklists > 0) {
      parts.push(`${pendingChecklists} checklist${pendingChecklists > 1 ? 's' : ''}`);
    }

    return `Você possui ${parts.join(' e ')} pendente${pendingData.totalPending > 1 ? 's' : ''} de sincronização. Deseja sincronizar agora?`;
  }, [pendingData]);

  useEffect(() => {
    checkPendingSync();
  }, []);

  return {
    pendingData,
    isLoading,
    showAlert,
    checkPendingSync,
    dismissAlert,
    getAlertMessage,
  };
};
