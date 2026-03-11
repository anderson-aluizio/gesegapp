import { ScrollView, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { useSnackbar } from '@/hooks/useSnackbar';
import { useSyncProgress } from '@/hooks/useSyncProgress';
import { useCentroCustoSync } from '@/hooks/useCentroCustoSync';
import { useTheme, ThemeColors } from '@/contexts/ThemeContext';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import SyncHeader from '@/components/sync/SyncHeader';
import CentroCustoList from '@/components/sync/CentroCustoList';
import SyncProgressDialog from '@/components/sync/SyncProgressDialog';
import CustomSnackbar from '@/components/ui/feedback/CustomSnackbar';
import SendAllData from '@/components/sync/SendAllData';

export default function SyncDataScreen() {
    const router = useRouter();
    const snackbar = useSnackbar();
    const syncProgress = useSyncProgress();
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
                {/* Section: Send data to server */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <MaterialCommunityIcons name="cloud-upload-outline" size={18} color={colors.textSecondary} />
                        <Text style={styles.sectionTitle}>Envio de dados</Text>
                    </View>
                    <Text style={styles.sectionDescription}>
                        Turnos e checklists finalizados são enviados automaticamente.
                    </Text>
                    <SendAllData />
                </View>

                {/* Section: Download data from server */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <MaterialCommunityIcons name="cloud-download-outline" size={18} color={colors.textSecondary} />
                        <Text style={styles.sectionTitle}>Baixar dados</Text>
                    </View>
                    <Text style={styles.sectionDescription}>
                        Atualize os dados do centro de custo para trabalhar offline.
                    </Text>
                    <CentroCustoList
                        centroCustos={centroCustos}
                        isLoading={isLoading}
                        isSyncing={isSyncing}
                        onSync={handleSync}
                    />
                </View>
            </ScrollView>

            <SyncProgressDialog
                visible={syncProgress.visible}
                progress={syncProgress.progress}
                percentage={syncProgress.percentage}
                currentStep={syncProgress.currentStep}
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
        paddingTop: 20,
        paddingBottom: 32,
    },
    section: {
        marginBottom: 24,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 4,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    sectionDescription: {
        fontSize: 12,
        color: colors.textMuted,
        marginBottom: 10,
    },
});
