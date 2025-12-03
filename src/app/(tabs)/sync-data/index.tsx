import { ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { useSnackbar } from '@/hooks/useSnackbar';
import { useDialog } from '@/hooks/useDialog';
import { useSyncProgress } from '@/hooks/useSyncProgress';
import { useAnimations } from '@/hooks/useAnimations';
import { useCentroCustoSync } from '@/hooks/useCentroCustoSync';
import { useTheme, ThemeColors } from '@/contexts/ThemeContext';
import SyncHeader from '@/components/sync/SyncHeader';
import CentroCustoList from '@/components/sync/CentroCustoList';
import InfoDialog from '@/components/ui/dialogs/InfoDialog';
import SyncProgressDialog from '@/components/sync/SyncProgressDialog';
import CustomSnackbar from '@/components/ui/feedback/CustomSnackbar';
import SendAllData from '@/components/sync/SendAllData';

export default function SyncDataScreen() {
    const router = useRouter();
    const snackbar = useSnackbar();
    const dialog = useDialog();
    const syncProgress = useSyncProgress();
    const { fadeAnim, slideAnim } = useAnimations();
    const { colors } = useTheme();

    const styles = useMemo(() => createStyles(colors), [colors]);

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
                <SendAllData />

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
                title={dialog.title}
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

const createStyles = (colors: ThemeColors) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
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
