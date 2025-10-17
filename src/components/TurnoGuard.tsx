import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'expo-router';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { Text } from 'react-native-paper';
import { useAuth } from '@/contexts/AuthContext';
import { useEquipeTurnoDatabase } from '@/database/Models/useEquipeTurnoDatabase';
import { useChecklisEstruturaItemsDatabase } from '@/database/Models/useChecklisEstruturaItemsDatabase';
import { useCentroCustoDatabase } from '@/database/Models/useCentroCustoDatabase';

type TurnoGuardProps = {
  children: React.ReactNode;
};

export default function TurnoGuard({ children }: TurnoGuardProps) {
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isChecking, setIsChecking] = useState(true);
  const turnoDb = useEquipeTurnoDatabase();
  const checklistEstruturaItemsDb = useChecklisEstruturaItemsDatabase();
  const centroCustoDb = useCentroCustoDatabase();

  useEffect(() => {
    checkTurnoRequirement();
  }, [user, pathname]);

  const checkTurnoRequirement = async () => {
    try {
      const allowedPaths = [
        '/turno-equipe/create',
        '/sync-data',
        '/login',
      ];

      if (allowedPaths.some(path => pathname?.includes(path))) {
        setIsChecking(false);
        return;
      }

      if (!user || !user.is_operacao) {
        setIsChecking(false);
        return;
      }

      const hasChecklistEstruturaItem = await checklistEstruturaItemsDb.getOneRow();
      const hasCentroCustoSynced = await centroCustoDb.getWithChecklistEstrutura();
      const dataSynced = !!(hasChecklistEstruturaItem && hasCentroCustoSynced && hasCentroCustoSynced.length > 0);

      if (!dataSynced) {
        setIsChecking(false);
        return;
      }

      const hasTurno = await turnoDb.hasTodayTurno();

      if (!hasTurno) {
        router.replace('/turno-equipe/create');
        return;
      }

      setIsChecking(false);
    } catch (error) {
      console.error('Erro ao verificar requisitos do turno:', error);
      setIsChecking(false);
    }
  };

  if (isChecking) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#667eea" />
        <Text style={styles.loadingText}>Verificando turno...</Text>
      </View>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 16,
    color: '#666',
    fontSize: 16,
  },
});
