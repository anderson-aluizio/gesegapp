import { FlatList, StyleSheet, View, Animated, Alert } from 'react-native';
import { Button, Dialog, Portal, Text, Surface, IconButton, ActivityIndicator, Card, Chip, List, Divider } from 'react-native-paper';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState, useRef } from 'react';
import { EquipeTurnoDatabaseWithRelations, useEquipeTurnoDatabase } from '@/database/Models/useEquipeTurnoDatabase';
import { EquipeTurnoFuncionarioDatabaseWithRelations, useEquipeTurnoFuncionarioDatabase } from '@/database/Models/useEquipeTurnoFuncionarioDatabase';
import ProtectedRoute from '@/components/ProtectedRoute';
import { isBeforeToday } from '@/utils/dateUtils';

export default function TurnoEquipeScreen() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [turnos, setTurnos] = useState<EquipeTurnoDatabaseWithRelations[]>([]);
    const [selectedTurno, setSelectedTurno] = useState<EquipeTurnoDatabaseWithRelations | null>(null);
    const [isShowDeleteDialog, setIsShowDeleteDialog] = useState<boolean>(false);
    const [expandedCards, setExpandedCards] = useState<Set<number>>(new Set());
    const [funcionariosByTurno, setFuncionariosByTurno] = useState<Map<number, EquipeTurnoFuncionarioDatabaseWithRelations[]>>(new Map());
    const fadeAnim = useRef(new Animated.Value(0)).current;

    const turnoDb = useEquipeTurnoDatabase();
    const turnoFuncionarioDb = useEquipeTurnoFuncionarioDatabase();

    const list = async () => {
        try {
            const response = await turnoDb.getAll();
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

    const handleAddButton = () => {
        router.push('/turno-equipe/create');
    };

    const handleDeleteTurno = async () => {
        if (!selectedTurno) return;
        setIsShowDeleteDialog(false);

        try {
            await turnoDb.remove(selectedTurno.id);
            Alert.alert('Sucesso', 'Turno removido com sucesso.');
            await list();
        } catch (error) {
            console.error('Erro ao remover turno:', error);
            Alert.alert('Erro', 'Erro ao remover turno. Tente novamente.');
        } finally {
            setSelectedTurno(null);
        }
    };

    const handleDeletePress = (turno: EquipeTurnoDatabaseWithRelations) => {
        if (isBeforeToday(turno.date)) {
            Alert.alert('Atenção', 'Você não pode remover registros de turnos anteriores.');
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
                                    iconColor="#e74c3c"
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
                                    <IconButton icon="information" size={16} iconColor="#856404" style={styles.bannerIcon} />
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
                        <Surface style={styles.headerSurface} elevation={2}>
                            <Text variant="headlineSmall" style={styles.headerTitle}>
                                Turnos de Trabalho
                            </Text>
                        </Surface>

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
                                    <IconButton icon="clipboard-text-off-outline" size={64} iconColor="#ccc" />
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
                            iconColor="#fff"
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
                                    textColor="#666"
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    mode="contained"
                                    buttonColor="#e74c3c"
                                    onPress={handleDeleteTurno}
                                    style={styles.dialogButton}
                                >
                                    Remover
                                </Button>
                            </View>
                        </Dialog.Actions>
                    </Dialog>
                </Portal>
            </View>
        </ProtectedRoute>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerSurface: {
        backgroundColor: '#667eea',
        paddingHorizontal: 20,
        paddingVertical: 24,
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
    },
    headerTitle: {
        color: '#ffffff',
        fontWeight: 'bold',
        marginBottom: 4,
    },
    headerSubtitle: {
        color: '#ffffff',
        opacity: 0.9,
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
        borderLeftColor: '#667eea',
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
        color: '#333',
        marginBottom: 4,
    },
    dateText: {
        color: '#666',
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
        color: '#666',
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
        backgroundColor: '#fff3cd',
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
        color: '#856404',
        flex: 1,
    },
    sectionTitle: {
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 8,
    },
    listItemTitle: {
        fontSize: 14,
        color: '#666',
    },
    emptyFuncionarios: {
        color: '#999',
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
        color: '#333',
        marginBottom: 4,
    },
    funcionarioDetails: {
        color: '#666',
        marginBottom: 6,
    },
    liderChip: {
        alignSelf: 'flex-start',
        backgroundColor: '#e3f2fd',
    },
    liderChipText: {
        color: '#1976d2',
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
        color: '#6c757d',
        textAlign: 'center',
        marginBottom: 8,
    },
    emptySubtitle: {
        color: '#9ca3af',
        textAlign: 'center',
    },
    fabButton: {
        position: 'absolute',
        right: 16,
        bottom: 40,
        borderRadius: 30,
        backgroundColor: '#0439c9',
        elevation: 4,
    },
    dialog: {
        borderRadius: 20,
        backgroundColor: '#ffffff',
    },
    dialogTitle: {
        textAlign: 'center',
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
    },
    dialogContent: {
        textAlign: 'center',
        lineHeight: 24,
        color: '#666',
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
