import { ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useSnackbar } from '@/hooks/useSnackbar';
import { useDialog } from '@/hooks/useDialog';
import { useSyncProgress } from '@/hooks/useSyncProgress';
import { useAnimations } from '@/hooks/useAnimations';
import { useCentroCustoSync } from '@/hooks/useCentroCustoSync';
import {
    SyncHeader,
    CentroCustoList,
    InfoDialog,
    SyncProgressDialog,
    CustomSnackbar,
} from '@/components/sync-data';
import SendChecklistRealizado from '@/components/SendChecklistRealizado';
import SendEquipeTurno from '@/components/SendEquipeTurno';

export default function SyncDataScreen() {
    const router = useRouter();
    const { user } = useAuth();
    const snackbar = useSnackbar();
    const dialog = useDialog();
    const syncProgress = useSyncProgress();
    const { fadeAnim, slideAnim } = useAnimations();

    const { centroCustos, isLoading, isSyncing, syncCentroCusto } = useCentroCustoSync({
        onError: (message) => {
            syncProgress.hide();
            snackbar.show(message, 'error');
        },
        onSuccess: (message) => {
            syncProgress.hide();
            snackbar.show(message, 'success');
        },
        onProgressUpdate: (message) => {
            syncProgress.addProgress(message);
        },
        onProgressChange: (step, percentage) => {
            syncProgress.updateProgress(step, percentage);
        },
    });

    const showTurnoEquipe = user?.is_operacao === true;

    const handleSync = async (centroCustoId: string) => {
        syncProgress.show();
        await syncCentroCusto(centroCustoId);
    };

    return (
        <View style={styles.container}>
            <SyncHeader onBack={() => router.replace('/(tabs)/home')} />

            <ScrollView
                style={styles.scrollContainer}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                <SendChecklistRealizado />
                {showTurnoEquipe && <SendEquipeTurno />}

                <CentroCustoList
                    centroCustos={centroCustos}
                    isLoading={isLoading}
                    isSyncing={isSyncing}
                    onSync={handleSync}
                    fadeAnim={fadeAnim}
                    slideAnim={slideAnim}
                />
            </ScrollView>

            <InfoDialog
                visible={dialog.visible}
                description={dialog.description}
                onDismiss={dialog.hide}
            />

            <SyncProgressDialog
                visible={syncProgress.visible}
                progress={syncProgress.progress}
                percentage={syncProgress.percentage}
                currentStep={syncProgress.currentStep}
                fadeAnim={fadeAnim}
            />

            <CustomSnackbar
                visible={snackbar.visible}
                message={snackbar.message}
                type={snackbar.type}
                onDismiss={snackbar.hide}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    scrollContainer: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: 16,
        paddingTop: 24,
        paddingBottom: 32,
    },
});
