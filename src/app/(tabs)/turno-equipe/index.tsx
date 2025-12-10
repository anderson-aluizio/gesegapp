import { FlatList, StyleSheet, View, Animated } from 'react-native';
import { Button, Dialog, Portal, Text, Surface, IconButton, ActivityIndicator, Card, Chip, List, Divider } from 'react-native-paper';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState, useRef, useMemo } from 'react';
import { EquipeTurnoDatabaseWithRelations, useEquipeTurnoDatabase } from '@/database/models/useEquipeTurnoDatabase';
import { EquipeTurnoFuncionarioDatabaseWithRelations, useEquipeTurnoFuncionarioDatabase } from '@/database/models/useEquipeTurnoFuncionarioDatabase';
import { useChecklisEstruturaItemsDatabase } from '@/database/models/useChecklisEstruturaItemsDatabase';
import { useCentroCustoDatabase } from '@/database/models/useCentroCustoDatabase';
import { useChecklisRealizadoDatabase } from '@/database/models/useChecklisRealizadoDatabase';
import ProtectedRoute from '@/components/guards/ProtectedRoute';
import { isBeforeToday } from '@/utils/dateUtils';
import InfoDialog from '@/components/ui/dialogs/InfoDialog';
import ConfirmDialog from '@/components/ui/dialogs/ConfirmDialog';
import { useDialog } from '@/hooks/useDialog';
import { useTheme, ThemeColors } from '@/contexts/ThemeContext';

export default function TurnoEquipeScreen() {
    const router = useRouter();
    const dialog = useDialog();
    const { colors } = useTheme();
    const styles = useMemo(() => createStyles(colors), [colors]);

    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [turnos, setTurnos] = useState<EquipeTurnoDatabaseWithRelations[]>([]);
    const [selectedTurno, setSelectedTurno] = useState<EquipeTurnoDatabaseWithRelations | null>(null);
    const [isShowDeleteDialog, setIsShowDeleteDialog] = useState<boolean>(false);
    const [expandedCards, setExpandedCards] = useState<Set<number>>(new Set());
    const [funcionariosByTurno, setFuncionariosByTurno] = useState<Map<number, EquipeTurnoFuncionarioDatabaseWithRelations[]>>(new Map());
    const [confirmDialogVisible, setConfirmDialogVisible] = useState<boolean>(false);
    const [confirmDialogConfig, setConfirmDialogConfig] = useState({
        title: '',
        description: '',
        onConfirm: () => { },
        confirmText: 'Confirmar',
    });
    const fadeAnim = useRef(new Animated.Value(0)).current;

    const turnoDb = useEquipeTurnoDatabase();
    const turnoFuncionarioDb = useEquipeTurnoFuncionarioDatabase();
    const checklistEstruturaItemsDb = useChecklisEstruturaItemsDatabase();
    const centroCustoDb = useCentroCustoDatabase();
    const checklistRealizadoDb = useChecklisRealizadoDatabase();

    const showConfirmDialog = (title: string, description: string, onConfirm: () => void, confirmText: string = 'Confirmar') => {
        setConfirmDialogConfig({ title, description, onConfirm, confirmText });
        setConfirmDialogVisible(true);
    };

    const list = async () => {
        try {
            const response = await turnoDb.getNotSynced();
            setTurnos(response);

            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 500,
                useNativeDriver: true,
            }).start();
        } catch (error) {
            console.error('Erro ao buscar turnos:', error);
        }
    }

    useFocusEffect(
        useCallback(() => {
            list();
            setIsLoading(false);
        }, [])
    );

    const handleAddButton = async () => {
        try {
            const hasChecklistEstruturaItem = await checklistEstruturaItemsDb.getOneRow();
            const hasCentroCustoSynced = await centroCustoDb.getWithChecklistEstrutura();
            const dataSynced = !!(hasChecklistEstruturaItem && hasCentroCustoSynced && hasCentroCustoSynced.length > 0);

            if (!dataSynced) {
                showConfirmDialog(
                    'Dados não sincronizados',
                    'É necessário sincronizar os dados antes de criar um turno. Deseja ir para a tela de sincronização?',
                    () => {
                        setConfirmDialogVisible(false);
                        router.push('/sync-data');
                    },
                    'Sincronizar'
                );
                return;
            }

            router.push('/turno-equipe/create');
        } catch (error) {
            console.error('Erro ao validar requisitos:', error);
            dialog.show('❌ Erro', 'Ocorreu um erro ao validar os requisitos. Tente novamente.');
        }
    };

    const handleDeleteTurno = async () => {
        if (!selectedTurno) return;
        setIsShowDeleteDialog(false);

        try {
            const turnoDate = new Date(selectedTurno.date).toISOString().split('T')[0];
            const hasChecklists = await checklistRealizadoDb.hasChecklistsByDate(turnoDate);

            if (hasChecklists) {
                dialog.show('⚠️ Atenção', 'Você deve excluir todos os checklists criados nesta data antes de remover o turno.');
                setSelectedTurno(null);
                return;
            }

            await turnoDb.remove(selectedTurno.id);
            dialog.show('✅ Sucesso', 'Turno removido com sucesso.');
            await list();
        } catch (error) {
            console.error('Erro ao remover turno:', error);
            dialog.show('❌ Erro', 'Erro ao remover turno. Tente novamente.');
        } finally {
            setSelectedTurno(null);
        }
    };

    const handleDeletePress = (turno: EquipeTurnoDatabaseWithRelations) => {
        if (isBeforeToday(turno.date)) {
            dialog.show('⚠️ Atenção', 'Você não pode remover registros de turnos anteriores.');
            return;
        }
        setSelectedTurno(turno);
        setIsShowDeleteDialog(true);
    };

    const toggleCardExpansion = async (turnoId: number) => {
        const newExpanded = new Set(expandedCards);

        if (newExpanded.has(turnoId)) {
            newExpanded.delete(turnoId);
        } else {
            newExpanded.add(turnoId);
            if (!funcionariosByTurno.has(turnoId)) {
                const funcionarios = await turnoFuncionarioDb.getByEquipeTurnoId(turnoId);
                setFuncionariosByTurno(new Map(funcionariosByTurno.set(turnoId, funcionarios)));
            }
        }

        setExpandedCards(newExpanded);
    };

    const renderTurnoCard = ({ item }: { item: EquipeTurnoDatabaseWithRelations }) => {
        const isExpanded = expandedCards.has(item.id);
        const funcionarios = funcionariosByTurno.get(item.id) || [];
        const isPast = isBeforeToday(item.date);

        return (
            <Card style={styles.turnoCard}>
                <Card.Content>
                    <View style={styles.cardHeader}>
                        <View style={styles.headerLeft}>
                            <Text variant="titleMedium" style={styles.equipeName}>
                                {item.equipe_nome}
                            </Text>
                            <Text variant="bodySmall" style={styles.dateText}>
                                {new Date(item.date).toLocaleDateString('pt-BR', {
                                    weekday: 'long',
                                    day: '2-digit',
                                    month: 'long',
                                    year: 'numeric'
                                })}
                            </Text>
                        </View>
                        <View style={styles.headerRight}>
                            {!isPast ? (
                                <IconButton
                                    icon="delete"
                                    size={20}
                                    iconColor={colors.buttonDanger}
                                    onPress={() => handleDeletePress(item)}
                                    style={styles.deleteButton}
                                />
                            ) : null}
                            <IconButton
                                icon={isExpanded ? 'chevron-up' : 'chevron-down'}
                                size={24}
                                onPress={() => toggleCardExpansion(item.id)}
                                style={styles.expandButton}
                            />
                        </View>
                    </View>

                    <View style={styles.summarySection}>
                        <View style={styles.infoRow}>
                            <IconButton icon="car" size={16} style={styles.infoIcon} />
                            <Text variant="bodySmall" style={styles.infoText}>
                                {item.veiculo_nome}
                            </Text>
                        </View>

                        <View style={styles.infoRow}>
                            <IconButton icon="account-group" size={16} style={styles.infoIcon} />
                            <Text variant="bodySmall" style={styles.infoText}>
                                {Number(item.total_funcionarios) || 0} colaboradores(s)
                            </Text>
                        </View>
                    </View>

                    {isExpanded ? (
                        <View style={styles.expandedSection}>
                            <Divider style={styles.divider} />

                            {isPast ? (
                                <Surface style={styles.historicalBanner} elevation={0}>
                                    <IconButton icon="information" size={16} iconColor={colors.warning} style={styles.bannerIcon} />
                                    <Text variant="bodySmall" style={styles.bannerText}>
                                        Registro histórico - não editável
                                    </Text>
                                </Surface>
                            ) : null}

                            <Text variant="labelLarge" style={styles.sectionTitle}>
                                Informações Detalhadas
                            </Text>

                            <List.Item
                                title="Data de Criação"
                                description={new Date(item.created_at).toLocaleString('pt-BR')}
                                left={props => <List.Icon {...props} icon="clock-start" />}
                                titleStyle={styles.listItemTitle}
                            />

                            <Divider style={styles.divider} />

                            <Text variant="labelLarge" style={styles.sectionTitle}>
                                Equipe do Turno
                            </Text>

                            {funcionarios.length === 0 ? (
                                <Text variant="bodySmall" style={styles.emptyFuncionarios}>
                                    Nenhum funcionário cadastrado
                                </Text>
                            ) : (
                                funcionarios.map((funcionario, index) => (
                                    <View key={funcionario.id}>
                                        <View style={styles.funcionarioItem}>
                                            <View style={styles.funcionarioInfo}>
                                                <Text variant="bodyMedium" style={styles.funcionarioNome}>
                                                    {funcionario.funcionario_nome}
                                                </Text>
                                                <Text variant="bodySmall" style={styles.funcionarioDetails}>
                                                    {funcionario.funcionario_cargo_nome} • Mat: {funcionario.funcionario_matricula}
                                                </Text>
                                                {funcionario.is_lider === 1 ? (
                                                    <Chip icon="information">Líder</Chip>
                                                ) : null}
                                            </View>
                                        </View>
                                        {index < funcionarios.length - 1 ? <Divider style={styles.itemDivider} /> : null}
                                    </View>
                                ))
                            )}
                        </View>
                    ) : null}
                </Card.Content>
            </Card>
        );
    };

    return (
        <ProtectedRoute>
            <View style={styles.container}>
                {isLoading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" />
                    </View>
                ) : (
                    <>
                        <View style={styles.headerContainer}>
                            <View style={styles.headerTop}>
                                <IconButton
                                    icon="arrow-left"
                                    iconColor="#fff"
                                    size={24}
                                    onPress={() => router.back()}
                                    style={styles.backButton}
                                />
                                <Text style={styles.headerTitle}>Turnos de Trabalho</Text>
                                <View style={styles.headerSpacer} />
                            </View>
                        </View>

                        <View style={styles.contentContainer}>
                            {turnos.length > 0 ? (
                                <Animated.View style={[styles.listWrapper, { opacity: fadeAnim }]}>
                                    <FlatList
                                        data={turnos}
                                        keyExtractor={(item) => String(item.id)}
                                        renderItem={renderTurnoCard}
                                        contentContainerStyle={styles.listContainer}
                                        showsVerticalScrollIndicator={false}
                                    />
                                </Animated.View>
                            ) : (
                                <Animated.View style={[styles.emptyState, { opacity: fadeAnim }]}>
                                    <IconButton icon="clipboard-text-off-outline" size={64} iconColor={colors.disabled} />
                                    <Text variant="titleMedium" style={styles.emptyTitle}>
                                        Nenhum turno cadastrado
                                    </Text>
                                    <Text variant="bodySmall" style={styles.emptySubtitle}>
                                        Clique no botão abaixo para criar um novo turno.
                                    </Text>
                                </Animated.View>
                            )}
                        </View>

                        <IconButton
                            icon="plus"
                            iconColor={colors.buttonText}
                            mode="contained"
                            style={styles.fabButton}
                            size={40}
                            onPress={handleAddButton}
                        />
                    </>
                )}

                <Portal>
                    <Dialog visible={isShowDeleteDialog} onDismiss={() => setIsShowDeleteDialog(false)} style={styles.dialog}>
                        <Dialog.Title style={styles.dialogTitle}>🗑️ Remover Turno</Dialog.Title>
                        <Dialog.Content>
                            <Text variant="bodyLarge" style={styles.dialogContent}>
                                Tem certeza que deseja remover este turno? Esta ação não pode ser desfeita.
                            </Text>
                        </Dialog.Content>
                        <Dialog.Actions>
                            <View style={styles.dialogButtonsContainer}>
                                <Button
                                    mode="outlined"
                                    onPress={() => setIsShowDeleteDialog(false)}
                                    style={styles.dialogButton}
                                    textColor={colors.textSecondary}
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    mode="contained"
                                    buttonColor={colors.buttonDanger}
                                    onPress={handleDeleteTurno}
                                    style={styles.dialogButton}
                                >
                                    Remover
                                </Button>
                            </View>
                        </Dialog.Actions>
                    </Dialog>
                </Portal>

                <InfoDialog
                    visible={dialog.visible}
                    description={dialog.description}
                    title={dialog.title}
                    onDismiss={dialog.hide}
                />

                <ConfirmDialog
                    visible={confirmDialogVisible}
                    title={confirmDialogConfig.title}
                    description={confirmDialogConfig.description}
                    onConfirm={confirmDialogConfig.onConfirm}
                    onDismiss={() => setConfirmDialogVisible(false)}
                    confirmText={confirmDialogConfig.confirmText}
                    cancelText="Cancelar"
                />
            </View>
        </ProtectedRoute>
    );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerContainer: {
        backgroundColor: colors.primaryDark,
        paddingVertical: 16,
        paddingHorizontal: 16,
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
        elevation: 4,
        shadowColor: colors.shadow,
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    headerTop: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 4,
    },
    backButton: {
        margin: 0,
    },
    headerTitle: {
        color: colors.textOnPrimary,
        fontSize: 20,
        fontWeight: 'bold',
        flex: 1,
        textAlign: 'center',
    },
    headerSpacer: {
        width: 40,
    },
    contentContainer: {
        flex: 1,
        padding: 16,
    },
    listWrapper: {
        flex: 1,
    },
    listContainer: {
        paddingBottom: 80,
    },
    turnoCard: {
        marginBottom: 12,
        borderRadius: 12,
        borderLeftWidth: 4,
        borderLeftColor: colors.primaryDark,
        backgroundColor: colors.surface,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    headerLeft: {
        flex: 1,
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    equipeName: {
        fontWeight: 'bold',
        color: colors.text,
        marginBottom: 4,
    },
    dateText: {
        color: colors.textSecondary,
        textTransform: 'capitalize',
    },
    deleteButton: {
        margin: 0,
    },
    expandButton: {
        margin: 0,
    },
    summarySection: {
        gap: 4,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    infoIcon: {
        margin: 0,
        marginRight: -8,
    },
    infoText: {
        color: colors.textSecondary,
    },
    expandedSection: {
        marginTop: 12,
    },
    divider: {
        marginVertical: 12,
    },
    historicalBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.warning,
        borderRadius: 8,
        paddingVertical: 8,
        paddingHorizontal: 12,
        marginBottom: 12,
    },
    bannerIcon: {
        margin: 0,
        marginRight: -4,
    },
    bannerText: {
        color: colors.text,
        flex: 1,
    },
    sectionTitle: {
        fontWeight: 'bold',
        color: colors.text,
        marginBottom: 8,
    },
    listItemTitle: {
        fontSize: 14,
        color: colors.textSecondary,
    },
    emptyFuncionarios: {
        color: colors.textTertiary,
        textAlign: 'center',
        paddingVertical: 12,
    },
    funcionarioItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
    },
    funcionarioInfo: {
        flex: 1,
    },
    funcionarioNome: {
        fontWeight: 'bold',
        color: colors.text,
        marginBottom: 4,
    },
    funcionarioDetails: {
        color: colors.textSecondary,
        marginBottom: 6,
    },
    liderChip: {
        alignSelf: 'flex-start',
        backgroundColor: colors.info,
    },
    liderChipText: {
        color: colors.textOnPrimary,
    },
    itemDivider: {
        marginVertical: 4,
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    emptyTitle: {
        color: colors.textSecondary,
        textAlign: 'center',
        marginBottom: 8,
    },
    emptySubtitle: {
        color: colors.textMuted,
        textAlign: 'center',
    },
    fabButton: {
        position: 'absolute',
        right: 16,
        bottom: 40,
        borderRadius: 30,
        backgroundColor: colors.buttonPrimary,
        elevation: 4,
    },
    dialog: {
        borderRadius: 20,
        backgroundColor: colors.surface,
    },
    dialogTitle: {
        textAlign: 'center',
        fontSize: 20,
        fontWeight: 'bold',
        color: colors.text,
    },
    dialogContent: {
        textAlign: 'center',
        lineHeight: 24,
        color: colors.textSecondary,
    },
    dialogButtonsContainer: {
        flexDirection: 'row',
        gap: 8,
        paddingHorizontal: 8,
    },
    dialogButton: {
        flex: 1,
        borderRadius: 25,
        marginHorizontal: 4,
    },
});
