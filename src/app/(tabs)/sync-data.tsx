import { ScrollView, StyleSheet, View, Animated, Dimensions, Alert } from 'react-native';
import { Button, Dialog, Portal, Text, ProgressBar, Card, Surface, IconButton, Snackbar } from 'react-native-paper';
import { useState, useEffect, useRef } from 'react';
import { useSQLiteContext } from 'expo-sqlite';
import { createDatabaseSyncService, type SyncProgress } from '@/services';
import { CentroCustoDatabase, useCentroCustoDatabase } from '@/database/Models/useCentroCustoDatabase';
import SendChecklistRealizado from '@/components/SendChecklistRealizado';
import SendEquipeTurno from '@/components/SendEquipeTurno';
import NetInfo from '@react-native-community/netinfo';
import { checkForUpdate } from '@/services/updateChecker';
import { useAuth } from '@/contexts/AuthContext';

interface ShowDialogProps {
    desc: string;
}

export default function SyncDataScreen() {
    const { user } = useAuth();
    const [dialogVisible, setDialogVisible] = useState<boolean>(false);
    const [dialogDesc, setDialogDesc] = useState<string>('');
    const [syncProgressDialogVisible, setSyncProgressDialogVisible] = useState<boolean>(false);
    const [syncProgress, setSyncProgress] = useState<string[]>([]);
    const [syncPercentage, setSyncPercentage] = useState<number>(0);
    const [currentSyncStep, setCurrentSyncStep] = useState<string>('');
    const [snackbarVisible, setSnackbarVisible] = useState<boolean>(false);
    const [snackbarMessage, setSnackbarMessage] = useState<string>('');
    const [snackbarType, setSnackbarType] = useState<'success' | 'error' | 'info'>('info');
    const centroCustoDb = useCentroCustoDatabase();
    const db = useSQLiteContext();
    const [centroCustos, setCentroCustos] = useState<CentroCustoDatabase[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(50)).current;
    const progressAnim = useRef(new Animated.Value(0)).current;

    const showTurnoEquipe = user?.is_operacao === true;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 800,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 800,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    useEffect(() => {
        if (syncPercentage > 0) {
            Animated.timing(progressAnim, {
                toValue: syncPercentage / 100,
                duration: 300,
                useNativeDriver: false,
            }).start();
        }
    }, [syncPercentage]);

    const loadCentroCustos = async () => {
        try {
            setIsLoading(true);
            const data = await centroCustoDb.getAll();
            setCentroCustos(data);
        } catch (error) {
            showSnackbar('Erro ao carregar centros de custo', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadCentroCustos();
    }, []);

    const showSnackbar = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
        setSnackbarMessage(message);
        setSnackbarType(type);
        setSnackbarVisible(true);
    };

    const showDialog = (desc: ShowDialogProps['desc']) => {
        setDialogDesc(desc);
        setDialogVisible(true);
    };

    const hideDialog = () => {
        setDialogVisible(false);
    };

    const showSyncProgressDialog = () => {
        setSyncProgressDialogVisible(true);
        setSyncProgress([]);
        setSyncPercentage(0);
        setCurrentSyncStep('');
    };

    const hideSyncProgressDialog = () => {
        setSyncProgressDialogVisible(false);
        setSyncProgress([]);
        setSyncPercentage(0);
        setCurrentSyncStep('');
    };

    const updateSyncProgress = (message: string) => {
        setSyncProgress(prev => [...prev, message]);
    };

    const testConnection = async (): Promise<boolean> => {
        try {
            const netInfoState = await NetInfo.fetch();

            if (!netInfoState.isConnected) {
                showDialog('❌ Dispositivo sem conexão de rede. Verifique se está conectado ao Wi-Fi ou dados móveis.');
                return false;
            }

            if (!netInfoState.isInternetReachable) {
                showDialog('❌ Sem acesso à internet. Verifique sua conexão e tente novamente.');
                return false;
            }

            const connectionType = netInfoState.type;
            const connectionDetails = netInfoState.details;
            updateSyncProgress(`🌐 Conectado via ${connectionType.toUpperCase()}`);

            if (connectionType === 'wifi' && connectionDetails) {
                updateSyncProgress(`📶 Wi-Fi: ${(connectionDetails as any).ssid || 'Rede conectada'}`);
            } else if (connectionType === 'cellular' && connectionDetails) {
                updateSyncProgress(`📱 Dados móveis: ${(connectionDetails as any).cellularGeneration || 'Conectado'}`);
            }
            return true;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
            showDialog(`❌ Erro ao testar conexão: ${errorMessage}`);
            return false;
        }
    };

    const updateData = async (centroCustoId: string) => {
        showSyncProgressDialog();
        const updateRequired = await checkForUpdate();
        if (updateRequired) {
            Alert.alert('Atenção', 'É necessário atualizar o aplicativo antes de continuar');
            hideSyncProgressDialog();
            return;
        }

        try {
            updateSyncProgress('🔍 Verificando conexão com servidor...');
            const isConnected = await testConnection();

            if (!isConnected) {
                hideSyncProgressDialog();
                showSnackbar('Falha na conexão com a internet. Verifique sua conexão e tente novamente.', 'error');
                return;
            }

            updateSyncProgress('🔄 Iniciando sincronização de dados...');
            const dbSyncService = createDatabaseSyncService(db);

            const progressCallback = (progress: SyncProgress) => {
                setSyncPercentage(progress.percentage);
                setCurrentSyncStep(progress.step);
                updateSyncProgress(`📊 ${progress.step} (${progress.currentStep}/${progress.totalSteps})`);
            };

            await dbSyncService.syncAllDataStreaming(progressCallback, centroCustoId);

            setSyncPercentage(100);
            updateSyncProgress('✅ Sincronização concluída com sucesso!');
            loadCentroCustos();

            setTimeout(() => {
                hideSyncProgressDialog();
                showSnackbar('Dados atualizados com sucesso!', 'success');
            }, 1500);

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
            updateSyncProgress(`❌ Erro: ${errorMessage}`);

            setTimeout(() => {
                hideSyncProgressDialog();
                showSnackbar(`Erro ao atualizar dados`, 'error');
            }, 1500);
        }
    };
    return (
        <View style={styles.container}>
            <ScrollView
                style={styles.scrollContainer}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                <SendChecklistRealizado />
                {showTurnoEquipe && <SendEquipeTurno />}
                <Animated.View style={[
                    styles.contentContainer,
                    {
                        opacity: fadeAnim,
                        transform: [{ translateY: slideAnim }]
                    }
                ]}>
                    {isLoading ? (
                        <View style={styles.loadingContainer}>
                            <ProgressBar indeterminate color="#0439c9" style={styles.loadingBar} />
                            <Text variant="bodyMedium" style={styles.loadingText}>
                                Carregando centros de custo...
                            </Text>
                        </View>
                    ) : centroCustos.length === 0 ? (
                        <Surface style={styles.emptyState} elevation={2}>
                            <View style={styles.infoHeader}>
                                <Text variant="titleMedium" style={styles.infoTitle}>
                                    Nenhum centro de custo encontrado
                                </Text>
                            </View>
                            <Text variant="bodyMedium" style={styles.emptyStateText}>
                                Verifique sua configuração ou tente novamente mais tarde.
                            </Text>
                        </Surface>
                    ) : (
                        <>
                            <Surface style={styles.infoCard} elevation={2}>
                                <View style={styles.infoHeader}>
                                    <Text variant="titleMedium" style={styles.infoTitle}>
                                        Centros de Custo Disponíveis
                                    </Text>
                                </View>
                                <Text variant="bodySmall" style={styles.infoDescription}>
                                    Selecione um centro de custo para sincronizar seus dados
                                </Text>
                            </Surface>

                            <View style={styles.cardsContainer}>
                                {centroCustos.map((cc, index) => (
                                    <Animated.View
                                        key={cc.id}
                                        style={[
                                            styles.cardWrapper,
                                            {
                                                transform: [{
                                                    translateY: slideAnim.interpolate({
                                                        inputRange: [0, 50],
                                                        outputRange: [0, 50 + (index * 20)],
                                                        extrapolate: 'clamp',
                                                    })
                                                }]
                                            }
                                        ]}
                                    >
                                        <Card style={styles.centroCustoCard} elevation={2}>
                                            <Card.Content style={styles.cardContent}>
                                                <View style={styles.cardRow}>
                                                    <View style={styles.cardInfo}>
                                                        <Text variant="titleSmall" style={styles.cardTitle} numberOfLines={1}>
                                                            {cc.nome}
                                                        </Text>
                                                        <Text variant="bodySmall" style={styles.cardSubtitle}>
                                                            {cc.synced_at ? (
                                                                <Text style={styles.syncDate}>
                                                                    Atualizado em &nbsp;
                                                                    {new Date(cc.synced_at).toLocaleDateString('pt-BR', {
                                                                        day: '2-digit',
                                                                        month: '2-digit',
                                                                        hour: '2-digit',
                                                                        minute: '2-digit'
                                                                    })}
                                                                </Text>
                                                            ) : (
                                                                <Text style={styles.syncDate}>
                                                                    Não sincronizado
                                                                </Text>
                                                            )}
                                                        </Text>
                                                    </View>
                                                    <IconButton
                                                        icon="sync"
                                                        size={20}
                                                        onPress={() => updateData(cc.id)}
                                                        disabled={syncProgressDialogVisible}
                                                        style={[
                                                            styles.syncButton,
                                                            syncProgressDialogVisible && styles.syncButtonDisabled
                                                        ]}
                                                        iconColor={syncProgressDialogVisible ? "#cccccc" : "#ffffff"}
                                                    />
                                                </View>
                                            </Card.Content>
                                        </Card>
                                    </Animated.View>
                                ))}
                            </View>
                        </>
                    )}
                </Animated.View>
            </ScrollView>

            <Portal>
                <Dialog visible={dialogVisible} onDismiss={hideDialog} style={styles.dialog}>
                    <Dialog.Title style={styles.dialogTitle}>Informação</Dialog.Title>
                    <Dialog.Content>
                        <Text variant="bodyMedium" style={styles.dialogText}>
                            {dialogDesc}
                        </Text>
                    </Dialog.Content>
                    <Dialog.Actions>
                        <Button onPress={hideDialog} mode="contained">
                            Fechar
                        </Button>
                    </Dialog.Actions>
                </Dialog>

                <Dialog visible={syncProgressDialogVisible} dismissable={false} style={styles.syncDialog}>
                    <Dialog.Title style={styles.syncDialogTitle}>
                        Sincronizando Dados
                    </Dialog.Title>
                    <Dialog.Content>
                        {syncPercentage > 0 && (
                            <View style={styles.progressContainer}>
                                <View style={styles.progressHeader}>
                                    <Text variant="labelMedium" style={styles.progressStep}>
                                        {currentSyncStep}
                                    </Text>
                                    <Text variant="labelMedium" style={styles.progressPercent}>
                                        {syncPercentage}%
                                    </Text>
                                </View>
                                <Animated.View style={styles.progressBarContainer}>
                                    <ProgressBar
                                        progress={syncPercentage / 100}
                                        color="#0439c9"
                                        style={styles.progressBar}
                                    />
                                </Animated.View>
                            </View>
                        )}

                        <Surface style={styles.logContainer} elevation={1}>
                            <Text variant="labelSmall" style={styles.logHeader}>
                                Log de Sincronização
                            </Text>
                            <ScrollView style={styles.logScroll} showsVerticalScrollIndicator={false}>
                                {[...syncProgress].reverse().map((item, index) => (
                                    <Animated.View
                                        key={index}
                                        style={[
                                            styles.logItem,
                                            { opacity: fadeAnim }
                                        ]}
                                    >
                                        <Text variant="bodySmall" style={styles.logText}>
                                            {item}
                                        </Text>
                                    </Animated.View>
                                ))}
                            </ScrollView>
                        </Surface>
                    </Dialog.Content>
                </Dialog>
            </Portal>

            <Snackbar
                visible={snackbarVisible}
                onDismiss={() => setSnackbarVisible(false)}
                duration={4000}
                style={[
                    styles.snackbar,
                    { backgroundColor: snackbarType === 'success' ? '#4caf50' : snackbarType === 'error' ? '#f44336' : '#2196f3' }
                ]}
            >
                {snackbarMessage}
            </Snackbar>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    headerSurface: {
        backgroundColor: '#0439c9',
        paddingHorizontal: 20,
        paddingVertical: 32,
        paddingTop: 20,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
    },
    headerContent: {
        alignItems: 'center',
    },
    headerIcon: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    headerIconText: {
        fontSize: 32,
    },
    headerTitle: {
        color: '#ffffff',
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 8,
    },
    headerSubtitle: {
        color: '#ffffff',
        opacity: 0.9,
        textAlign: 'center',
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
    contentContainer: {
        flex: 1,
    },
    loadingContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 40,
    },
    loadingBar: {
        width: '80%',
        height: 6,
        borderRadius: 3,
        marginBottom: 16,
    },
    loadingText: {
        color: '#666',
        textAlign: 'center',
    },
    emptyState: {
        padding: 22,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 12,
        backgroundColor: '#ffffff',
        marginVertical: 10,
    },
    emptyStateTitle: {
        color: '#333',
        textAlign: 'center',
        marginBottom: 12,
    },
    emptyStateText: {
        color: '#666',
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 20,
    },
    retryButton: {
        marginTop: 8,
    },
    infoCard: {
        backgroundColor: '#ffffff',
        borderRadius: 12,
        padding: 10,
        marginBottom: 14,
    },
    infoHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    infoTitle: {
        color: '#333',
        fontWeight: 'bold',
    },
    infoDescription: {
        color: '#666',
        lineHeight: 18,
    },
    cardsContainer: {
        gap: 8,
    },
    cardWrapper: {
        marginBottom: 4,
    },
    centroCustoCard: {
        backgroundColor: '#ffffff',
        borderRadius: 12,
        overflow: 'hidden',
    },
    cardContent: {
        paddingVertical: 10,
        paddingHorizontal: 10,
    },
    cardRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    cardInfo: {
        flex: 1,
        marginRight: 12,
    },
    cardTitle: {
        color: '#333',
        fontWeight: 'bold',
        marginBottom: 2,
    },
    cardSubtitle: {
        color: '#666',
        fontSize: 12,
        lineHeight: 16,
    },
    syncDate: {
        color: '#999',
        fontSize: 12,
    },
    syncButton: {
        borderRadius: 8,
        elevation: 2,
        backgroundColor: '#0439c9',
        color: '#ffffff',
    },
    syncButtonDisabled: {
        backgroundColor: '#cccccc',
        elevation: 0,
        opacity: 0.6,
    },
    syncButtonLabel: {
        fontSize: 12,
        fontWeight: 'bold',
    },
    dialog: {
        borderRadius: 16,
    },
    dialogTitle: {
        color: '#333',
        fontWeight: 'bold',
    },
    dialogText: {
        color: '#666',
        lineHeight: 20,
    },
    syncDialog: {
        borderRadius: 16,
        maxHeight: '80%',
    },
    syncDialogTitle: {
        color: '#333',
        fontWeight: 'bold',
        textAlign: 'center',
    },
    progressContainer: {
        marginBottom: 24,
    },
    progressHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    progressStep: {
        color: '#333',
        flex: 1,
        marginRight: 16,
    },
    progressPercent: {
        color: '#0439c9',
        fontWeight: 'bold',
    },
    progressBarContainer: {
        backgroundColor: '#f0f0f0',
        borderRadius: 6,
        overflow: 'hidden',
    },
    progressBar: {
        height: 12,
        borderRadius: 6,
    },
    logContainer: {
        backgroundColor: '#fafafa',
        borderRadius: 12,
        padding: 16,
        maxHeight: 200,
    },
    logHeader: {
        color: '#666',
        fontWeight: 'bold',
        marginBottom: 12,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    logScroll: {
        maxHeight: 150,
    },
    logItem: {
        paddingVertical: 4,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    logText: {
        color: '#555',
        lineHeight: 16,
        fontFamily: 'monospace',
    },
    snackbar: {
        marginBottom: 16,
        borderRadius: 8,
    },
});

