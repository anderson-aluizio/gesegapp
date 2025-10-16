import { FlatList, StyleSheet, View, Animated, Alert } from 'react-native';
import { Button, Dialog, Portal, Text, Surface, IconButton, ActivityIndicator, Card } from 'react-native-paper';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState, useRef } from 'react';
import { EquipeTurnoDatabaseWithRelations, useEquipeTurnoDatabase } from '@/database/Models/useEquipeTurnoDatabase';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function TurnoEquipeScreen() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [turnos, setTurnos] = useState<EquipeTurnoDatabaseWithRelations[]>([]);
    const [selectedTurno, setSelectedTurno] = useState<EquipeTurnoDatabaseWithRelations | null>(null);
    const [isShowEncerrarDialog, setIsShowEncerrarDialog] = useState<boolean>(false);
    const [isShowDeleteDialog, setIsShowDeleteDialog] = useState<boolean>(false);
    const fadeAnim = useRef(new Animated.Value(0)).current;

    const turnoDb = useEquipeTurnoDatabase();
    const { user } = useAuth();

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

    const handleClickTurno = (turno: EquipeTurnoDatabaseWithRelations) => {
        if (!turno) return;
        router.push(`/turno-equipe/${turno.id}`);
    };

    const handleEncerrarTurno = async () => {
        if (!selectedTurno || !user) return;
        setIsShowEncerrarDialog(false);

        try {
            await turnoDb.updateEncerrado(selectedTurno.id, user.id);
            Alert.alert('Sucesso', 'Turno encerrado com sucesso.');
            await list();
        } catch (error) {
            console.error('Erro ao encerrar turno:', error);
            Alert.alert('Erro', 'Erro ao encerrar turno. Tente novamente.');
        } finally {
            setSelectedTurno(null);
        }
    };

    const handleDeleteTurno = async () => {
        if (!selectedTurno) return;
        setIsShowDeleteDialog(false);

        try {
            await turnoDb.remove(selectedTurno.id);
            Alert.alert('Sucesso', 'Turno excluído com sucesso.');
            await list();
        } catch (error) {
            console.error('Erro ao excluir turno:', error);
            Alert.alert('Erro', 'Erro ao excluir turno. Tente novamente.');
        } finally {
            setSelectedTurno(null);
        }
    };

    const handleLongPressTurno = (turno: EquipeTurnoDatabaseWithRelations) => {
        setSelectedTurno(turno);
        setIsShowDeleteDialog(true);
    };

    const handleEncerrarPress = (turno: EquipeTurnoDatabaseWithRelations) => {
        setSelectedTurno(turno);
        setIsShowEncerrarDialog(true);
    };

    const renderTurnoCard = ({ item }: { item: EquipeTurnoDatabaseWithRelations }) => (
        <Card
            style={[
                styles.turnoCard,
                item.is_encerrado ? styles.turnoCardEncerrado : styles.turnoCardAberto
            ]}
            onPress={() => handleClickTurno(item)}
            onLongPress={() => handleLongPressTurno(item)}
        >
            <Card.Content>
                <View style={styles.cardHeader}>
                    <View style={styles.statusBadge}>
                        <Text style={[
                            styles.statusText,
                            item.is_encerrado ? styles.statusTextEncerrado : styles.statusTextAberto
                        ]}>
                            {item.is_encerrado ? 'Encerrado' : 'Aberto'}
                        </Text>
                    </View>
                    {!item.is_encerrado ? (
                        <IconButton
                            icon="check-circle"
                            size={20}
                            iconColor="#4caf50"
                            onPress={() => handleEncerrarPress(item)}
                            style={styles.encerrarButton}
                        />
                    ) : null}
                </View>

                <Text variant="titleMedium" style={styles.equipeName}>
                    {item.equipe_nome}
                </Text>

                <View style={styles.infoRow}>
                    <IconButton icon="calendar" size={16} style={styles.infoIcon} />
                    <Text variant="bodySmall" style={styles.infoText}>
                        {new Date(item.date).toLocaleDateString('pt-BR')}
                    </Text>
                </View>

                <View style={styles.infoRow}>
                    <IconButton icon="car" size={16} style={styles.infoIcon} />
                    <Text variant="bodySmall" style={styles.infoText}>
                        {item.veiculo_nome}
                    </Text>
                </View>

                <View style={styles.infoRow}>
                    <IconButton icon="account-group" size={16} style={styles.infoIcon} />
                    <Text variant="bodySmall" style={styles.infoText}>
                        {item.total_funcionarios || 0} funcionário(s)
                    </Text>
                </View>

                {item.is_encerrado && item.encerrado_at ? (
                    <View style={styles.infoRow}>
                        <IconButton icon="clock-outline" size={16} style={styles.infoIcon} />
                        <Text variant="bodySmall" style={styles.infoTextMuted}>
                            Encerrado em {new Date(item.encerrado_at).toLocaleString('pt-BR')}
                        </Text>
                    </View>
                ) : null}
            </Card.Content>
        </Card>
    );

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
                                Turnos de Equipe
                            </Text>
                            <Text variant="bodySmall" style={styles.headerSubtitle}>
                                Gerencie os turnos das equipes de trabalho
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
                    <Dialog visible={isShowEncerrarDialog} onDismiss={() => setIsShowEncerrarDialog(false)} style={styles.dialog}>
                        <Dialog.Title style={styles.dialogTitle}>✓ Encerrar Turno</Dialog.Title>
                        <Dialog.Content>
                            <Text variant="bodyLarge" style={styles.dialogContent}>
                                Tem certeza que deseja encerrar este turno?
                            </Text>
                        </Dialog.Content>
                        <Dialog.Actions>
                            <View style={styles.dialogButtonsContainer}>
                                <Button
                                    mode="outlined"
                                    onPress={() => setIsShowEncerrarDialog(false)}
                                    style={styles.dialogButton}
                                    textColor="#666"
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    mode="contained"
                                    buttonColor="#4caf50"
                                    onPress={handleEncerrarTurno}
                                    style={styles.dialogButton}
                                >
                                    Encerrar
                                </Button>
                            </View>
                        </Dialog.Actions>
                    </Dialog>

                    <Dialog visible={isShowDeleteDialog} onDismiss={() => setIsShowDeleteDialog(false)} style={styles.dialog}>
                        <Dialog.Title style={styles.dialogTitle}>🗑️ Confirmar Exclusão</Dialog.Title>
                        <Dialog.Content>
                            <Text variant="bodyLarge" style={styles.dialogContent}>
                                Tem certeza que deseja excluir este turno? Esta ação não pode ser desfeita.
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
                                    Excluir
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
    },
    turnoCardAberto: {
        borderLeftWidth: 4,
        borderLeftColor: '#4caf50',
    },
    turnoCardEncerrado: {
        borderLeftWidth: 4,
        borderLeftColor: '#999',
        opacity: 0.8,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
        backgroundColor: '#f0f0f0',
    },
    statusText: {
        fontSize: 12,
        fontWeight: 'bold',
    },
    statusTextAberto: {
        color: '#4caf50',
    },
    statusTextEncerrado: {
        color: '#999',
    },
    encerrarButton: {
        margin: 0,
    },
    equipeName: {
        fontWeight: 'bold',
        marginBottom: 8,
        color: '#333',
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 2,
    },
    infoIcon: {
        margin: 0,
        marginRight: -8,
    },
    infoText: {
        color: '#666',
    },
    infoTextMuted: {
        color: '#999',
        fontSize: 11,
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
